# Booking Confirmation Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a rich, responsive HTML booking confirmation ticket email via Brevo SMTP to the logged-in user upon successful ticket payment, tracked as an idempotent Inngest background function.

**Architecture:** When a booking is marked paid (via return URL `/api/booking/confirm-payment` or Stripe webhook `/api/stripe`), an idempotent Inngest event (`app/show.booked`) is dispatched. The Inngest background function `send-booking-confirmation-email` resolves booking details, show info, and the user's email (falling back to Clerk if needed), generates a styled cinema e-ticket HTML receipt, and sends it via Brevo SMTP using Nodemailer.

**Tech Stack:** Node.js, Express, Nodemailer, Inngest, Brevo SMTP, Clerk SDK, Mongoose.

---

## Global Constraints

- Use Brevo SMTP (`smtp-relay.brevo.com:587`) with credentials from `process.env.SMTP_USER`, `process.env.SMTP_PASS`, and `process.env.SENDER_EMAIL`.
- The email must include: Booking ID, exact show date & time, seat numbers & count, transaction breakdown (unit price, total amount), and movie poster/title.
- Inngest function must remain idempotent using event key `booking-confirmation-${bookingId}`.
- Recipient email must target the authenticated user (with fallback to Clerk `clerkClient.users.getUser` if local MongoDB user record is missing).

---

## Review Focus

1. **Missing SMTP Credentials**: If Brevo keys are not yet added to `.env`, Nodemailer must give a descriptive, actionable error without crashing the server.
2. **Missing MongoDB User record**: If Clerk webhook hasn't populated MongoDB `User`, the function should query Clerk API directly as fallback so the email is never dropped.
3. **Double Email Prevention**: If both the Stripe Webhook and the return URL trigger within milliseconds, Inngest deduplication key must ensure only 1 email is delivered.
4. **HTML Rendering in Diverse Email Clients**: Email layout must use inline CSS, tables, and web-safe fallbacks compatible with Gmail, Outlook, Apple Mail, and mobile screens.

---

### Task 1: Cinema Ticket HTML Email Generator & Nodemailer Configuration

**Files:**
- Create: `server/utils/emailTemplates.js`
- Modify: `server/configs/nodemailer.js`
- Test: `attic/test-email-template.mjs`

**Interfaces:**
- Produces: `generateBookingTicketEmail({ booking, user, movie, show }) -> { subject: string, html: string, text: string }`
- Produces: `sendEmail({ to, subject, html, text }) -> Promise<any>`

- [ ] **Step 1: Write test for email template generation**
  Verify `generateBookingTicketEmail` outputs correct booking ID, seats, formatted date/time, total amount, and HTML structure.
- [ ] **Step 2: Implement `server/utils/emailTemplates.js`**
  Build a dark-crimson branded cinema e-ticket HTML template with logo, movie poster, booking ID badge, date/time, seat badges, pricing summary, and fallback text.
- [ ] **Step 3: Update `server/configs/nodemailer.js`**
  Add graceful configuration validation and support for `html` and `text` bodies.
- [ ] **Step 4: Run template unit test**
  Verify template builds without errors and contains all required data points.

---

### Task 2: Enhance Inngest Email Function with Clerk Fallback

**Files:**
- Modify: `server/inngest/index.js:93-120`

**Interfaces:**
- Consumes: `generateBookingTicketEmail` from `server/utils/emailTemplates.js`
- Consumes: `sendEmail` from `server/configs/nodemailer.js`
- Consumes: `clerkClient.users.getUser` from `@clerk/express`

- [ ] **Step 1: Update `sendBookingConfirmationEmail` Inngest function**
  Populate booking with show and movie; resolve user email and name with Clerk fallback if `booking.user` document is null; generate HTML ticket; send via `sendEmail`.
- [ ] **Step 2: Verify Inngest function export**
  Ensure `sendBookingConfirmationEmail` is properly registered in `functions` array and triggered on `app/show.booked`.

---

### Task 3: Dual-Channel Trigger Alignment (Webhook & Client Return)

**Files:**
- Verify: `server/controllers/bookingController.js:140-146`
- Verify: `server/controllers/stripeWebhooks.js:23-28`

**Interfaces:**
- Produces: `inngest.send({ id: 'booking-confirmation-' + bookingId, name: 'app/show.booked', data: { bookingId } })`

- [ ] **Step 1: Check `confirmBookingPayment` event dispatch**
  Ensure `sessionId` payment confirmation dispatches `app/show.booked` with deterministic `id`.
- [ ] **Step 2: Check `markBookingPaid` webhook event dispatch**
  Ensure Stripe webhook dispatches `app/show.booked` with matching deterministic `id`.

---

### Task 4: Environment Documentation & Step-by-Step UI Guide

**Files:**
- Modify: `server/.env` (add placeholder comments)
- Documentation: Detailed UI instructions for Brevo SMTP and Vercel settings.

- [ ] **Step 1: Add Brevo SMTP variable placeholders to `server/.env`**
- [ ] **Step 2: Provide interactive verification script in `attic/`**
- [ ] **Step 3: Document step-by-step UI instructions for Brevo setup and Vercel configuration**
