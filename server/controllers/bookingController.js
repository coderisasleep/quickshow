import { inngest } from "../inngest/index.js";
import Booking from "../model/Booking.js";
import Show from "../model/Show.js"
import stripe from "stripe"

//Function to check availability of selected seats for a movie
const checkSeatsAvailability = async(showId,selectedSeats)=>{
    try{
        const showData = await Show.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat=> occupiedSeats[seat]);
        return !isAnySeatTaken;
    }catch(error){
       console.log(error.message);
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

       //create a new booking
       const booking = await Booking.create({
        user:userId,
        show:showId,
        amount:showData.showPrice * selectedSeats.length,
        bookedSeats:selectedSeats
       })

       selectedSeats.map((seat)=>{
        showData.occupiedSeats[seat] = userId;
       })

       showData.markModified('occupiedSeats');

       await showData.save();
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
            cancel_url : `${origin}/my-bookings`,
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

       booking.isPaid = true
       booking.paymentLink = ""
       await booking.save()

       // Auto-delete show from website if all tickets (90 seats) are sold
       try {
         const showData = await Show.findById(booking.show);
         if (showData && Object.keys(showData.occupiedSeats || {}).length >= 90) {
           showData.isDeleted = true;
           await showData.save();
         }
       } catch (showCheckErr) {
         console.error('Error checking show sold-out status:', showCheckErr.message);
       }

       await inngest.send({
         id: `booking-confirmation-${bookingId}`,
         name: "app/show.booked",
         data: {bookingId}
       })

       res.json({success:true,isPaid:true})
    }catch(error){
        console.error(error)
        res.status(500).json({success:false,message:error.message})
    }
}

export const getOccupiedSeats = async(req,res) =>{
    try{
       const { showId } = req.params;
       const showData = await Show.findById(showId)
       if(!showData){
         return res.status(404).json({success:false,message:"Show not found"})
       }

       const occupiedSeats = Object.keys(showData.occupiedSeats)

       res.json({success:true, occupiedSeats})


    }catch(error){
        console.error(error.message);
        res.status(500).json({success:false, message:error.message})
    }
}