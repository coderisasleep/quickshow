import express from 'express';
import { confirmBookingPayment, createBooking, getOccupiedSeats, cancelPendingBooking } from '../controllers/bookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/create',createBooking);
bookingRouter.post('/confirm-payment',confirmBookingPayment);
bookingRouter.post('/cancel-pending',cancelPendingBooking);
bookingRouter.get('/seats/:showId',getOccupiedSeats);

export default bookingRouter;
