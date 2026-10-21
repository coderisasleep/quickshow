# Admin Restrict Show Creation to Next Day and Beyond Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the admin cannot schedule shows for the current day (today) or past dates, requiring all newly scheduled shows to be for tomorrow (the next day) or later.

**Architecture:**
- **Frontend Date Lockout (`client/src/pages/admin/AddShow.jsx`):**
  - Compute `min` date as tomorrow at 00:00: `getMinDateTime()` sets `min` to `${tomorrowDate}T00:00`.
  - In modern browsers, today and all previous dates are grayed/whited out and completely unselectable in the date picker.
  - Calculate `isTodayOrPast = Boolean(dateTimeInput && new Date(dateTimeInput) < startOfTomorrow)`.
  - If today or a past date is entered:
    - Disable the "Add Time" button (`disabled={!dateTimeInput || isTodayOrPast}`).
    - Display an inline warning: `"⚠️ Shows cannot be added for today or past dates. Please select tomorrow or a later date."`
    - In `handleDateTimeAdd` and `handleSubmit`, block any show scheduled for today or earlier.
- **Backend Validation (`server/controllers/showController.js`):**
  - In `addShow`, validate each show's calendar date against the current date.
  - Reject any show where `show.date <= currentDateString` with `400 Bad Request` and message `"Shows cannot be scheduled for the current day or past dates"`.

**Tech Stack:** React 19, Tailwind CSS, Express.js, MongoDB / Mongoose.

---

## Global Constraints
- Do NOT implement or deploy until explicit user confirmation ("yes").
- Shows for tomorrow and all future dates must continue to work normally.

---

## Tasks

### Task 1: Lock Out Current Day in Admin Add Show UI (`client/src/pages/admin/AddShow.jsx`)
**Files:**
- Modify: `client/src/pages/admin/AddShow.jsx`

- [ ] **Step 1: Set `min` to tomorrow 00:00**
  - Update `getMinDateTime()` to return tomorrow's date at `00:00` (`${tomorrow}T00:00`), whiting out today and earlier in the date picker.
- [ ] **Step 2: Add `isTodayOrPast` validation & disable "Add Time" button**
  - Check `new Date(dateTimeInput) < startOfTomorrow`.
  - Disable "Add Time" button if `isTodayOrPast` is true.
  - Display inline warning message if today or a past date is selected.
- [ ] **Step 3: Update `handleDateTimeAdd` and `handleSubmit`**
  - Reject additions and submissions where show date is today or earlier.

---

### Task 2: Server-Side Next-Day Enforcement (`server/controllers/showController.js`)
**Files:**
- Modify: `server/controllers/showController.js`

- [ ] **Step 1: Validate `show.date > todayString` in `addShow`**
  - Ensure show calendar date is strictly after today.
  - Return `400 Bad Request` if any show is for today or the past.

---

### Task 3: Build Verification & Deployment Gate
**Files:**
- Test: `npm run build` in `client/`

- [ ] **Step 1: Run client build**
  - Confirm 0 compilation errors.
- [ ] **Step 2: User Approval Gate**
  - Present results to the user and prompt for permission before implementing and deploying.
