# Admin Prevent Past Time Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the admin cannot select or add past showtimes on the current day (e.g. attempting to schedule at 14:00 when the current time is 16:58), providing instant UI feedback, disabling the "Add Time" button, ensuring timezone consistency between browser and server, and enforcing backend validation.

**Architecture:**
- In `client/src/pages/admin/AddShow.jsx`:
  - Calculate real-time `min` timestamp (`YYYY-MM-DDTHH:mm`).
  - Calculate `isPastTime` instantaneously on input change: `new Date(dateTimeInput) < new Date()`.
  - Disable the "Add Time" button whenever a past date/time is selected (`disabled={!dateTimeInput || isPastTime}`).
  - Render an immediate inline warning alert below the datetime input if a past time is selected for today or previous dates.
  - Reject in `handleDateTimeAdd` and block submission in `handleSubmit`.
  - Include the client's local ISO string (`new Date(dateTimeString).toISOString()`) in `showsInput` so the cloud server (running in UTC) does not misinterpret local times due to timezone offset (e.g. IST +05:30 vs UTC).
- In `server/controllers/showController.js`:
  - In `addShow`, evaluate the show's exact timestamp against `new Date(Date.now() - 60000)`.
  - Reject any show with a past timestamp with `400 Bad Request`.

**Tech Stack:** React 19, Tailwind CSS, Express.js, MongoDB / Mongoose.

---

## Global Constraints
- Do NOT implement or deploy until explicit user confirmation ("yes").
- Preserve all existing styling and future scheduling capabilities.

---

## Tasks

### Task 1: Real-time Past Time Validation & UI Feedback (`client/src/pages/admin/AddShow.jsx`)
**Files:**
- Modify: `client/src/pages/admin/AddShow.jsx`

- [ ] **Step 1: Real-time past time check on input**
  - Derive `isPastTime = Boolean(dateTimeInput && new Date(dateTimeInput) < new Date())`.
- [ ] **Step 2: Disable "Add Time" button on past time**
  - Add `disabled={!dateTimeInput || isPastTime}` to the "Add Time" button with styling `disabled:opacity-50 disabled:cursor-not-allowed`.
- [ ] **Step 3: Inline warning message**
  - Render a red warning banner under the datetime input whenever `isPastTime` is true:
    `"⚠️ The selected time has already passed. Please select a time later than [Current Time]."`
- [ ] **Step 4: Timezone-aware ISO payload in `handleSubmit`**
  - Map `showsInput` to include `isoDateTime: new Date(`${date}T${time}`).toISOString()`.

---

### Task 2: Server-side Timezone-aware Validation (`server/controllers/showController.js`)
**Files:**
- Modify: `server/controllers/showController.js`

- [ ] **Step 1: Validate against UTC timestamp**
  - Use `isoDateTime` (or fallback) to parse the exact instant.
  - Verify `new Date(showDateTime) >= new Date(Date.now() - 60000)`.
  - If invalid, return `400 Bad Request`.

---

### Task 3: Build Verification & Deployment Gate
**Files:**
- Test: `npm run build` in `client/`

- [ ] **Step 1: Run client build**
  - Verify 0 errors.
- [ ] **Step 2: User Approval Gate**
  - Await user approval ("yes or no") before implementing or deploying.
