import "./configs/loadEnv.js";
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest,functions } from "./inngest/index.js"
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

const app = express();
const port = 3000;
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clockSkewInMs = process.env.CLERK_CLOCK_SKEW_IN_MS
    ? parseInt(process.env.CLERK_CLOCK_SKEW_IN_MS, 10)
    : 60000;

if (!clerkPublishableKey || !clerkSecretKey) {
    throw new Error("CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must be configured");
}

await connectDB()

//Stripe webhooks Route
app.use('/api/stripe', express.raw({type:'application/json'}),stripeWebhooks)

//Middleware
app.use(express.json())
app.use(cors({
    exposedHeaders: ['x-clerk-auth-status', 'x-clerk-auth-reason', 'x-clerk-auth-message']
}))
app.use(clerkMiddleware({
    publishableKey: clerkPublishableKey,
    secretKey: clerkSecretKey,
    clockSkewInMs
}))

//API Routes
app.get('/', (req,res)=> res.send('Server is Live!'))
app.use('/api/inngest', serve({client:inngest,functions}))
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin',adminRouter)
app.use('/api/user',userRouter)

if (process.env.VERCEL !== "1") {
    app.listen(port, ()=> console.log(`Server listening at http://localhost:${port}`));
}

export default app;