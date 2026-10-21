# Admin Past Shows Restriction & Automatic Show End Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 
1. Prevent administrators from scheduling shows on past dates or times in the Admin "Add Shows" dashboard, disabling and whiting out past dates/times in the picker and enforcing client & server validation.
2. Automatically remove/deactivate shows when they have ended (i.e. once the current time reaches `showDateTime + movie.runtime`).

**Architecture:**
- **Admin UI Restriction:** In `client/src/pages/admin/AddShow.jsx`, set the `min` attribute on `<input type="datetime-local" />` to the local formatted timestamp (`YYYY-MM-DDTHH:mm`). Modern browsers natively gray/white out and disable all dates prior to today, and all times earlier than the current time for today. Complement with client-side guards in `handleDateTimeAdd` and `handleSubmit`.
- **Backend Add Guard:** In `server/controllers/showController.js` (`addShow`), reject any show whose `showDateTime` is in the past.
- **Automatic Show Removal on End:**
  - Create a centralized server helper `cleanupEndedShows()`.
  - For every active show (`isDeleted: { $ne: true }`), calculate `showEndTime = new Date(show.showDateTime.getTime() + (show.movie?.runtime || 0) * 60 * 1000)`.
  - If `new Date() >= showEndTime`, automatically mark the show as `isDeleted: true`.
  - Integrate `cleanupEndedShows()` into show retrieval endpoints (`getShows`, `getShow`, `getAllShows`, `getDashboardData`, `getNowShowingTrailers`) and run on an interval in `server.js`.
  - In `createBooking` (`server/controllers/bookingController.js`), verify that the target show has not ended before confirming a booking.

**Tech Stack:** React 19, Tailwind CSS, Express.js, MongoDB / Mongoose.

---

## Global Constraints
- Preserve existing styling and behavior for valid future dates.
- Booking records and historical revenue must remain intact (using `isDeleted: true` soft deletion).
- Do NOT implement or deploy until explicit user confirmation ("yes").

---

## Tasks

### Task 1: UI Date & Time Restriction in Admin Add Show (`client/src/pages/admin/AddShow.jsx`)
**Files:**
- Modify: `client/src/pages/admin/AddShow.jsx`

- [ ] **Step 1: Compute local current datetime string**
  - Implement a helper `getMinDateTime()` returning `YYYY-MM-DDTHH:mm` based on the user's local timezone.
- [ ] **Step 2: Add `min` attribute to `datetime-local` input**
  - Add `min={getMinDateTime()}` to `<input type="datetime-local" ... />` so the browser date picker natively grays/whites out dates prior to today and times prior to the current time for today.
- [ ] **Step 3: Add past-time validation in `handleDateTimeAdd`**
  - Verify that `new Date(dateTimeInput) >= new Date()`.
  - If the user selects or enters a past time, display `toast.error('Cannot add shows for past dates or times')` and abort.
- [ ] **Step 4: Add past-time guard in `handleSubmit`**
  - Check all entries in `dateTimeSelection`. If any selected time has expired while on the page, notify the user and block submission.

---

### Task 2: Server-Side Add Show Validation (`server/controllers/showController.js`)
**Files:**
- Modify: `server/controllers/showController.js`

- [ ] **Step 1: Validate `showDateTime` in `addShow`**
  - Before inserting shows into MongoDB, verify each `showDateTime >= new Date(Date.now() - 60000)` (allowing a 1-minute margin for network latency).
  - If any show date/time is in the past, return `res.status(400).json({ success: false, message: "Cannot schedule shows for past dates or times" })`.

---

### Task 3: Automatic Show Removal Upon Show End (`server/utils/showCleanup.js` & Controllers)
**Files:**
- Create: `server/utils/showCleanup.js`
- Modify: `server/controllers/showController.js`
- Modify: `server/controllers/adminController.js`
- Modify: `server/controllers/bookingController.js`
- Modify: `server/server.js`

- [ ] **Step 1: Implement `cleanupEndedShows` helper**
  - In `server/utils/showCleanup.js`, query shows where `isDeleted: { $ne: true }`, populate `movie` (for `runtime`).
  - Compute `endTime = new Date(show.showDateTime.getTime() + (show.movie?.runtime || 0) * 60000)`.
  - Update all shows where `now >= endTime` to `{ isDeleted: true }`.
- [ ] **Step 2: Hook `cleanupEndedShows` into API endpoints and server interval**
  - Call `await cleanupEndedShows()` in `getShows`, `getShow`, `getAllShows`, and `getDashboardData`.
  - Set periodic interval (`setInterval(cleanupEndedShows, 60000)`) in `server/server.js` for standalone server mode.
- [ ] **Step 3: Add booking guard in `createBooking`**
  - Reject booking creation if `show.isDeleted === true` or if `new Date() >= new Date(show.showDateTime.getTime() + (show.movie?.runtime || 0) * 60000)`.

---

### Task 4: Build Verification & Deployment Gate
**Files:**
- Test via: `npm run build` in `client/`

- [ ] **Step 1: Run client build**
  - Run `npm run build` in `client` to verify 0 errors.
- [ ] **Step 2: User Approval Gate**
  - Ask user for explicit permission ("yes or no") before deploying to production.
