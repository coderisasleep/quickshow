import { inngest } from "../inngest/index.js";
import Booking from "../model/Booking.js";
import Show from "../model/Show.js"
import stripe from "stripe"

//Function to check availability of selected seats for a movie
const checkSeatsAvailability = async(showId,selectedSeats,excludeBookingId = null)=>{
    try{
        const showData = await Show.findById(showId);
        if(!showData || showData.isDeleted) return false;

        const occupiedSeats = showData.occupiedSeats || {};

        // 1. Check permanently occupied seats
        const isAnySeatTaken = selectedSeats.some(seat=> occupiedSeats[seat]);
        if (isAnySeatTaken) return false;

        // 2. Check seats held by active unexpired pending bookings (<10 mins)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const pendingQuery = {
            show: showId.toString(),
            isPaid: false,
            createdAt: { $gte: tenMinutesAgo },
            bookedSeats: { $in: selectedSeats }
        };
        if (excludeBookingId) {
            pendingQuery._id = { $ne: excludeBookingId };
        }

        const activePendingBooking = await Booking.findOne(pendingQuery);
        return !activePendingBooking;
    }catch(error){
       console.error("checkSeatsAvailability error:", error.message);
       return false;
    }
}

export const createBooking = async (req,res) =>{
    try{
       const {userId} = req.auth();
       if(!userId){
         return res.status(401).json({success:false,message:"Authentication required"})
       }

       const origin = req.get('origin')
       if(!origin){
         return res.status(400).json({success:false,message:"Checkout origin is missing"})
       }

       const {showId,selectedSeats} = req.body;
       
       //check if the seat is available for the selected show
       const isAvailable = await checkSeatsAvailability(showId,selectedSeats)
 
       if(!isAvailable){
        return res.status(409).json({success:false,message:"Selected seats are not available"})
       }

       //Get the show details
       const showData = await Show.findById(showId).populate('movie');
       if(!showData || showData.isDeleted){
         return res.status(400).json({success:false,message:"This show is no longer available"});
       }

       const runtimeMinutes = showData.movie?.runtime || 0;
       const endTime = new Date(showData.showDateTime.getTime() + runtimeMinutes * 60000);
       if (new Date() >= endTime) {
         return res.status(400).json({success:false,message:"This show has already ended"});
       }

       //create a new booking
       const booking = await Booking.create({
        user:userId,
        show:showId,
        amount:showData.showPrice * selectedSeats.length,
        bookedSeats:selectedSeats
       })

       // NOTE: Seats are NOT assigned to showData.occupiedSeats here.
       // They are only permanently assigned after payment succeeds (in confirmBookingPayment or stripeWebhooks).

       //Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY) 

        //creating line items for stripe
        const line_items = [{
           price_data: {
            currency:'usd',
            product_data:{
                name: showData.movie.title
            },
            unit_amount: Math.floor(booking.amount)* 100
           },
           quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url : `${origin}/my-bookings?canceled_booking_id=${booking._id.toString()}`,
            line_items: line_items,
            mode:"payment",
            metadata:{
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now()/1000)+30*60, //expires in 30min
        })

        booking.paymentLink = session.url
        await booking.save()

        //run inngest scheduler function to check payment status after 10 minutes
        await inngest.send({
            name:"app/checkpayment",
            data:{
                bookingId: booking._id.toString()
            }
        })

       res.json({success:true, url: session.url})

    }catch(error){
        console.error(error.message);
        res.status(500).json({success:false, message:error.message})
    }
}

export const confirmBookingPayment = async(req,res) =>{
    try{
       const {userId} = req.auth();
       if(!userId){
         return res.status(401).json({success:false,message:"Authentication required"})
       }

       const {sessionId} = req.body;
       if(typeof sessionId !== 'string' || !sessionId){
         return res.status(400).json({success:false,message:"Checkout session ID is required"})
       }

       const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
       const session = await stripeInstance.checkout.sessions.retrieve(sessionId)
       const bookingId = session.metadata?.bookingId
       if(!bookingId){
         return res.status(404).json({success:false,message:"No booking is associated with this payment"})
       }

       const booking = await Booking.findOne({_id:bookingId,user:userId})
       if(!booking){
         return res.status(404).json({success:false,message:"Booking not found"})
       }

       if(session.payment_status !== 'paid'){
         return res.status(409).json({success:false,message:"Payment has not been completed"})
       }

       // Only assign seats and trigger confirmation if not already processed (idempotent)
       if (!booking.isPaid) {
           booking.isPaid = true
           booking.paymentLink = ""
           await booking.save()

           // Permanently book seats into show.occupiedSeats now that payment succeeded
           const showData = await Show.findById(booking.show);
           if (showData) {
               showData.occupiedSeats = showData.occupiedSeats || {};
               booking.bookedSeats.forEach((seat) => {
                   showData.occupiedSeats[seat] = booking.user;
               });
               showData.markModified('occupiedSeats');

               // Auto-delete show from website if all tickets (90 seats) are sold
               if (Object.keys(showData.occupiedSeats || {}).length >= 90) {
                   showData.isDeleted = true;
               }
               await showData.save();
           }

           await inngest.send({
             id: `booking-confirmation-${bookingId}`,
             name: "app/show.booked",
             data: {bookingId}
           });
       }

       res.json({success:true,isPaid:true})
    }catch(error){
        console.error(error)
        res.status(500).json({success:false,message:error.message})
    }
}

// Cancel a pending unpaid booking immediately (e.g. when user abandons or cancels Stripe)
export const cancelPendingBooking = async(req,res) =>{
    try{
       const {userId} = req.auth();
       const {bookingId} = req.body;
       if(!bookingId){
         return res.status(400).json({success:false,message:"bookingId is required"});
       }
       const booking = await Booking.findOne({_id:bookingId, user:userId, isPaid:false});
       if(booking){
         await Booking.findByIdAndDelete(booking._id);
       }
       res.json({success:true, message:"Pending booking cancelled successfully"});
    }catch(error){
        console.error("cancelPendingBooking error:", error.message);
        res.status(500).json({success:false, message:error.message});
    }
}

export const getOccupiedSeats = async(req,res) =>{
    try{
       const { showId } = req.params;
       const showData = await Show.findById(showId)
       if(!showData){
         return res.status(404).json({success:false,message:"Show not found"})
       }

       const confirmedSeats = Object.keys(showData.occupiedSeats || {});

       // Include active unexpired pending holds (<10 mins) so UI marks them as taken
       const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
       const pendingBookings = await Booking.find({
           show: showId.toString(),
           isPaid: false,
           createdAt: { $gte: tenMinutesAgo }
       });
       const pendingSeats = pendingBookings.flatMap(b => b.bookedSeats || []);

       const occupiedSeats = Array.from(new Set([...confirmedSeats, ...pendingSeats]));

       res.json({success:true, occupiedSeats})

    }catch(error){
        console.error(error.message);
        res.status(500).json({success:false, message:error.message})
    }
}