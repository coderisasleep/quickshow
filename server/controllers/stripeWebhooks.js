import stripe from "stripe"
import Booking from '../model/Booking.js'

const markBookingPaid = async(session) =>{
    if(session.payment_status !== 'paid'){
        return
    }

    const bookingId = session.metadata?.bookingId
    if(!bookingId){
        throw new Error(`Stripe checkout session ${session.id} has no booking ID`)
    }

    const booking = await Booking.findByIdAndUpdate(bookingId,{
        isPaid:true,
        paymentLink:""
    })
    if(!booking){
        throw new Error(`Booking ${bookingId} not found for Stripe checkout session ${session.id}`)
    }
}

export const stripeWebhooks = async (request, response) =>{
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];
    
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body,sig,process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        return response.status(400).send(`webhook error: ${error.message}`)
    }

    try {
        switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":{
                await markBookingPaid(event.data.object)
                break;
            }
            case "payment_intent.succeeded":{
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                })

                const session = sessionList.data.find(({metadata})=>metadata?.bookingId)
                if(!session){
                    throw new Error(`No checkout session found for payment intent ${paymentIntent.id}`)
                }
                await markBookingPaid(session)
                break;
            }
                
                
        
            default:
                console.log('unhandled event type', event.type)
        }
        response.json({received: true})
    } catch (err) {
        console.error("webhook processing error:",err);
        response.status(500).send("Internal Server Error");
    }
}