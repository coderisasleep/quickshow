import Booking from "../model/Booking.js";
import Show from "../model/Show.js";
import User from "../model/User.js";
import { clerkClient } from "@clerk/express";
import { cleanupEndedShows } from "../utils/showCleanup.js";
import sendEmail from "../configs/nodemailer.js";
import { generateShowCancellationRefundEmail } from "../utils/emailTemplates.js";


//API to check if user is admin
export const isAdmin = async(req,res)=>{
    res.json({success:true, isAdmin:true})
}

//API to get dashboard data
export const getDashboardData = async(req,res)=>{
    try{
       await cleanupEndedShows();
       const now = new Date();
       const bookings = await Booking.find({isPaid:true});
       const shows = await Show.find({isDeleted: {$ne: true}}).populate('movie');
       const activeShows = shows.filter(show => {
         const runtimeMinutes = show.movie?.runtime || 0;
         const endTime = new Date(show.showDateTime.getTime() + runtimeMinutes * 60000);
         return endTime > now;
       });

       const totalUser = await User.countDocuments();

       const dashboardData = {
        totalBookings:bookings.length,
        totalRevenue:bookings.reduce((acc,booking)=>acc + booking.amount, 0),
        activeShows,
        totalUser
       }

       res.json({success:true, dashboardData})
    }catch(error){
        console.error(error);
        res.json({success:false, message:error.message})

    }
}

//API to get all shows
export const getAllShows = async(req,res)=>{
    try{
        await cleanupEndedShows();
        const now = new Date();
        const shows = await Show.find({isDeleted: {$ne: true}}).populate('movie').sort({showDateTime: 1});
        const activeShows = shows.filter(show => {
          const runtimeMinutes = show.movie?.runtime || 0;
          const endTime = new Date(show.showDateTime.getTime() + runtimeMinutes * 60000);
          return endTime > now;
        });
        res.json({success:true, shows: activeShows})
    }catch(error){

        console.error(error);
        res.json({success:false, message:error.message})

    }
}

//API to delete show(s)
export const deleteShow = async(req,res)=>{
    try{
        const { showId, showIds } = req.body;
        const targetIds = Array.isArray(showIds) ? showIds : (showId ? [showId] : []);

        if(targetIds.length === 0){
            return res.status(400).json({success:false, message: "Please specify showId or showIds to delete"});
        }

        // Find all paid bookings for these shows before deletion
        const affectedBookings = await Booking.find({
            show: { $in: targetIds },
            isPaid: true
        }).populate({
            path: 'show',
            populate: { path: 'movie' }
        });

        // Soft delete the shows
        await Show.updateMany(
            { _id: { $in: targetIds } },
            { $set: { isDeleted: true } }
        );

        // Send cancellation and refund emails to affected ticket holders
        let emailsSentCount = 0;
        if (affectedBookings.length > 0) {
            const emailPromises = affectedBookings.map(async (booking) => {
                try {
                    let userEmail = null;
                    let userName = 'Movie Lover';

                    const clerkUserId = typeof booking.user === 'string'
                        ? booking.user
                        : (booking.user?._id || booking.user);

                    if (clerkUserId) {
                        const localUser = await User.findById(clerkUserId);
                        if (localUser?.email) {
                            userEmail = localUser.email;
                            userName = localUser.name || userName;
                        } else {
                            try {
                                const clerkUser = await clerkClient.users.getUser(clerkUserId);
                                const primaryEmail = clerkUser?.emailAddresses?.find(
                                    (e) => e.id === clerkUser.primaryEmailAddressId
                                ) || clerkUser?.emailAddresses?.[0];
                                userEmail = primaryEmail?.emailAddress;
                                userName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || userName;
                            } catch (clerkErr) {
                                console.error(`[DeleteShow] Clerk lookup failed for ${clerkUserId}:`, clerkErr.message);
                            }
                        }
                    }

                    if (!userEmail) {
                        console.warn(`[DeleteShow] No email address found for booking ${booking._id}`);
                        return;
                    }

                    const show = booking.show;
                    const movie = show?.movie || { title: "Movie Screening" };

                    const emailContent = generateShowCancellationRefundEmail({
                        booking,
                        user: { name: userName, email: userEmail },
                        movie,
                        show: show || {}
                    });

                    await sendEmail({
                        to: userEmail,
                        subject: emailContent.subject,
                        html: emailContent.html,
                        text: emailContent.text
                    });

                    emailsSentCount++;
                } catch (emailErr) {
                    console.error(`[DeleteShow] Failed to send refund email for booking ${booking._id}:`, emailErr.message);
                }
            });

            await Promise.allSettled(emailPromises);
        }

        const message = affectedBookings.length > 0
            ? `Show(s) deleted successfully. Refund notice sent to ${emailsSentCount} booked guest(s).`
            : "Show(s) deleted successfully";

        res.json({ success: true, message, notifiedCount: emailsSentCount });
    }catch(error){
        console.error(error);
        res.status(500).json({success:false, message:error.message});
    }
}

//API to get all bookings 

export const getAllBookings = async(req,res)=>{
    try{
        const bookings = await Booking.find({}).populate('user').populate({
            path:"show",
            populate:{path:"movie"}
        }).sort({createdAt: -1})
        res.json({success:true,bookings})

    }catch(error){
        console.error(error);
        res.json({success:false, message:error.message})

    }
}