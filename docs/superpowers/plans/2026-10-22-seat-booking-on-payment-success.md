# Seat Booking on Payment Success & Deletion Email Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure seats are only permanently booked into `show.occupiedSeats` once payment succeeds (never if payment fails or is abandoned), automatically clean up abandoned seat reservations, and ensure cancellation/refund emails are reliably sent to all booked users when an admin deletes a show.

**Architecture:**
- **Conditional Seat Assignment (`server/controllers/bookingController.js` & `server/controllers/stripeWebhooks.js`):**
  - In `createBooking`: Only create the pending `Booking` record (`isPaid: false`). **Do NOT** permanently write seats into `show.occupiedSeats` before payment.
  - Temporarily hold seats during the checkout window (10 min TTL) by checking active pending bookings in `checkSeatsAvailability`.
  - When payment succeeds (in `/confirm-payment` and in `stripeWebhooks`): Write seats to `show.occupiedSeats[seat] = booking.user`, mark `isPaid = true`, and save.
  - If payment is cancelled or abandoned: The seats were never permanently written into `show.occupiedSeats`, so the show remains clean.
- **Show Deletion Email Reliability (`server/controllers/adminController.js`):**
  - Check both paid `Booking` documents and `show.occupiedSeats` to ensure every user with a seat gets a cancellation email.
  - Deduplicate recipients and return transparent email dispatch metrics in the API response.

**Tech Stack:** Express.js, MongoDB / Mongoose, Stripe, Nodemailer / Brevo SMTP, Clerk SDK.

---

## Global Constraints
- **Strict User Gate:** Do NOT implement any code until explicit user confirmation ("yes").
- **Zero Orphaned Seats:** No seat should remain in `show.occupiedSeats` unless payment is confirmed.
- **Resilience:** Show deletion must succeed even if a third-party email service has transient errors, while reporting exact delivery status.

---

## Tasks

### Task 1: Defer Permanent Seat Booking Until Payment Succeeds
**Files:**
- Modify: `server/controllers/bookingController.js`
- Modify: `server/controllers/stripeWebhooks.js`

- [ ] **Step 1: Update `checkSeatsAvailability` to respect temporary lock window**
  - A seat is unavailable if it is already in `showData.occupiedSeats` OR belongs to an active pending booking (`isPaid: false` created within the last 10 minutes).
- [ ] **Step 2: Remove immediate seat assignment from `createBooking`**
  - Remove `showData.occupiedSeats[seat] = userId` and `showData.save()` from `createBooking`.
  - Seat assignment is deferred to payment confirmation.
- [ ] **Step 3: Assign seats atomically upon payment confirmation**
  - In `confirmBookingPayment` (`bookingController.js`) and `markBookingPaid` (`stripeWebhooks.js`):
    - Retrieve `showData` for `booking.show`.
    - Set `showData.occupiedSeats[seat] = booking.user` for each seat in `booking.bookedSeats`.
    - `showData.markModified('occupiedSeats')` and `await showData.save()`.
    - Set `booking.isPaid = true` and `await booking.save()`.
- [ ] **Step 4: Add instant cancellation endpoint / handle Stripe cancel URL**
  - When a user cancels on Stripe (redirected to `cancel_url`), immediately delete or expire the pending unpaid booking so seats are freed instantly without waiting 10 minutes.

---

### Task 2: Clean Up Orphaned Seats from Past Test Sessions
**Files:**
- Modify: `server/utils/showCleanup.js`

- [ ] **Step 1: Reconcile `show.occupiedSeats` with confirmed bookings**
  - In `cleanupEndedShows` (or a helper sync): Check if any seat in `show.occupiedSeats` does not have a corresponding `isPaid: true` booking.
  - Remove orphaned unconfirmed seats so the admin view reflects only genuinely booked seats.

---

### Task 3: Strengthen Show Deletion Email Dispatch
**Files:**
- Modify: `server/controllers/adminController.js`

- [ ] **Step 1: Check both `Booking` collection and `show.occupiedSeats`**
  - Query all bookings for targeted shows: `Booking.find({ show: { $in: targetIds } })`.
  - For any user sitting in `show.occupiedSeats` not found in `Booking`, extract user IDs directly from `show.occupiedSeats`.
- [ ] **Step 2: Deduplicate and resolve emails**
  - Deduplicate user IDs so no customer receives duplicate emails.
  - Look up emails via MongoDB `User` model, falling back to `clerkClient.users.getUser`.
- [ ] **Step 3: Send cancellation emails & return transparent feedback**
  - Send emails using `sendEmail` with `Promise.allSettled`.
  - Return clear response: `Show(s) deleted successfully. Cancellation notice sent to X guest(s).`

---

### Task 4: Verification & Testing
**Files:**
- Test: Verify syntax and run build: `npm --prefix client run build` and `node --check` on modified server files.
- Test: Simulate abandoned booking (seats remain available).
- Test: Simulate paid booking (seats permanently assigned).
- Test: Verify show deletion dispatches emails.
