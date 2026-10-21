# Show Deletion Notification & Refund Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an admin deletes a show that has booked seats, automatically send a show cancellation email to all affected users apologizing for the cancellation, promising a full refund, and providing a dummy refund link to initiate their refund.

**Architecture:**
- **Email Template (`server/utils/emailTemplates.js`):**
  - Create a new template `generateShowCancellationRefundEmail({ booking, user, movie, show, refundUrl })`.
  - Design it with QuickShow's dark cinema aesthetic:
    - Urgent yet friendly cancellation notice: `⚠️ Show Cancelled & Full Refund Notice`.
    - Movie title, poster, date/time of cancelled show, and seat badges.
    - Refund summary showing the full refund amount and booking ID.
    - Prominent dummy refund CTA button: `"Initiate / Track Refund"` pointing to `https://quickshow-refunds.vercel.app/refund?bookingId=${bookingId}&amount=${amount}` (or client base URL).
- **Admin Delete Controller (`server/controllers/adminController.js`):**
  - In `deleteShow`:
    - Before or during deletion, query all bookings associated with the targeted shows:
      `Booking.find({ show: { $in: targetIds }, isPaid: true }).populate('show')`.
    - For each affected booking, resolve user details (`userEmail`, `userName`) via local `User` or Clerk client.
    - Mark the shows as `isDeleted: true`.
    - Also update affected bookings or mark them as cancelled/refund pending.
    - Send cancellation and refund emails using `sendEmail` asynchronously with `Promise.allSettled`.
    - Return a detailed success message to the admin indicating how many users were notified.

**Tech Stack:** Express.js, MongoDB / Mongoose, Nodemailer / Brevo SMTP, Clerk SDK.

---

## Global Constraints
- Do NOT implement or deploy until explicit user confirmation ("yes").
- Email sending must be resilient (`Promise.allSettled`) so that a single SMTP failure does not crash or block the show deletion process.
- Use a dummy refund link as requested since Stripe sandbox cannot automate real customer refunds.

---

## Tasks

### Task 1: Create Cancellation & Refund Email Template (`server/utils/emailTemplates.js`)
**Files:**
- Modify: `server/utils/emailTemplates.js`

- [ ] **Step 1: Implement `generateShowCancellationRefundEmail`**
  - Format show date/time, movie title, booked seats, and amount.
  - Generate dummy refund link: `https://quickshow-refunds.vercel.app/refund?bookingId=${bookingId}&amount=${amount}`.
  - Return `{ subject, html, text }` with responsive styling and clear refund instructions.

---

### Task 2: Trigger Refund Emails on Show Deletion (`server/controllers/adminController.js`)
**Files:**
- Modify: `server/controllers/adminController.js`

- [ ] **Step 1: Identify booked guests in `deleteShow`**
  - Query all paid bookings for `targetIds`: `Booking.find({ show: { $in: targetIds }, isPaid: true }).populate({ path: 'show', populate: { path: 'movie' } })`.
- [ ] **Step 2: Resolve user emails & send notifications**
  - Resolve email address for each booking via `User.findById` or Clerk's `clerkClient.users.getUser`.
  - Send email via `sendEmail` for each affected guest.
  - Mark shows as `isDeleted: true`.
- [ ] **Step 3: Return informative response**
  - Return `{ success: true, message: `Show(s) deleted. Sent refund emails to ${notifiedCount} guest(s).` }`.

---

### Task 3: Build & Syntax Verification
**Files:**
- Test: `node --check` on `server/controllers/adminController.js` and `server/utils/emailTemplates.js`
- Test: `npm run build` in `client/`

- [ ] **Step 1: Verify syntax and build**
  - Run syntax check and build test to verify 0 errors.
- [ ] **Step 2: User Approval Gate**
  - Ask user for confirmation before deploying.
