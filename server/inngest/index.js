import { Inngest } from "inngest";
import { clerkClient } from "@clerk/express";
import User from "../model/User.js";
import Booking from "../model/Booking.js";
import Show from "../model/Show.js";
import Movie from "../model/Movie.js";
import sendEmail from "../configs/nodemailer.js";
import { generateBookingTicketEmail } from "../utils/emailTemplates.js";


//create client to send and receive events
export const inngest = new Inngest({id:"movie-ticket-booking"});

//Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
    {id:'sync-user-from-clerk', triggers: {event:'clerk/user.created'}},
    async ({event}) =>{
        const {id,first_name,last_name,email_addresses,image_url} = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name+' '+last_name,
            image: image_url
        }
        await User.create(userData)
    }
)

//Inngest Function to delete user from database
const syncUserDeletion = inngest.createFunction(
    {id:'delete-user-with-clerk', triggers: {event:'clerk/user.deleted'}},
    async ({event}) =>{
          const{id} = event.data
          await User.findByIdAndDelete(id)
        }
)

//Inngest Function to update user data in Database
const syncUserUpdation = inngest.createFunction(
    {id:'update-user-from-clerk', triggers: {event:'clerk/user.updated'}},
    async ({event,step}) =>{
        const {id,first_name,last_name,email_addresses,primary_email_address_id,image_url} = event.data
        const primaryEmail = email_addresses?.find(({id:emailId})=>emailId === primary_email_address_id)
            ?? email_addresses?.[0]

        if(!id || !primaryEmail?.email_address || !image_url){
            throw new Error('Clerk user.updated event is missing a user ID, email address, or image URL')
        }

        const userData = {
            email: primaryEmail.email_address,
            name: [first_name,last_name].filter(Boolean).join(' ') || primaryEmail.email_address,
            image: image_url
        }

        await step.run('update-user-record', async () =>{
            const result = await User.updateOne(
                {_id:id},
                {$set:userData},
                {upsert:true,runValidators:true}
            )
            return {updated:result.modifiedCount > 0, created:result.upsertedCount > 0}
        })
    }
)

//Inngest Function to cancel booking and release seats of show
//after 10 minutes of booking created if payment is not made

const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {id:'release-seats-delete-booking', triggers: {event: 'app/checkpayment'}},
    async ({event,step}) =>{
         const tenMinutesLater = new Date(Date.now() + 10*60*1000);
         await step.sleepUntil('wait-for-10-minutes',tenMinutesLater)

         await step.run('check-payment-status', async ()=>{
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId)

            //if payment is not made, release seats and delete booking
            if(booking && !booking.isPaid){
                const show = await Show.findById(booking.show);
                if(show){
                    booking.bookedSeats.forEach((seat)=>{
                        delete show.occupiedSeats[seat]
                    });
                    show.markModified('occupiedSeats')
                    await show.save()
                }
                await Booking.findByIdAndDelete(booking._id)
            }
         })
    }
)


const sendBookingConfirmationEmail = inngest.createFunction(
    {
        id: "send-booking-confirmation-email",
        name: "Send Booking Confirmation Email",
        triggers: [{ event: "app/show.booked" }]
    },
    async ({event,step}) =>{
        const {bookingId} = event.data;
        const booking = await Booking.findById(bookingId).populate({
            path:"show",
            populate:{path:"movie",model:"Movie"}
        }).populate("user");

        if(!booking){
            console.error(`[Inngest] Booking ${bookingId} not found`);
            return;
        }

        // 1. Resolve recipient user details with fallback to Clerk API
        let userEmail = booking.user?.email;
        let userName = booking.user?.name;

        if(!userEmail){
            const clerkUserId = typeof booking.user === 'string'
                ? booking.user
                : (booking.user?._id || booking.user);

            if(clerkUserId){
                try{
                    const clerkUser = await clerkClient.users.getUser(clerkUserId);
                    const primaryEmail = clerkUser?.emailAddresses?.find(
                        (e) => e.id === clerkUser.primaryEmailAddressId
                    ) || clerkUser?.emailAddresses?.[0];

                    userEmail = primaryEmail?.emailAddress;
                    userName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || 'Movie Lover';
                }catch(clerkErr){
                    console.error(`[Inngest] Failed to fetch Clerk user ${clerkUserId}:`, clerkErr.message);
                }
            }
        }

        if(!userEmail){
            throw new Error(`Cannot send confirmation email: no recipient email found for booking ${bookingId}`);
        }

        // 2. Resolve movie details
        const show = booking.show;
        let movie = show?.movie;
        if(show && typeof show.movie === 'string'){
            movie = await Movie.findById(show.movie);
        }

        // 3. Generate rich HTML cinema ticket and plain text
        const emailContent = generateBookingTicketEmail({
            booking,
            user: { name: userName, email: userEmail },
            movie: movie || { title: "Movie Show" },
            show: show || {},
        });

        // 4. Send email inside tracked Inngest step
        await step.run("send-booking-confirmation-email", async () => {
            return await sendEmail({
                to: userEmail,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            });
        });
    }
);


//create an empty array where we will export Inngest functions
export const functions = [syncUserCreation,
                          syncUserDeletion,
                          syncUserUpdation,
                          releaseSeatsAndDeleteBooking,
                          sendBookingConfirmationEmail
                        ];