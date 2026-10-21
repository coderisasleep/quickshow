# Hero Section Most Booked Movie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded "Guardians of the Galaxy" in the homepage `HeroSection` with the movie that has the most seats booked among all movies added by the admin, displaying its real title, backdrop image, release year, runtime, genres, and synopsis.

**Architecture:**
- **Backend (`server/controllers/showController.js` & `server/routes/showRoutes.js`):**
  - Implement a new endpoint `GET /api/show/featured`.
  - Calculate total booked seats for every movie added by the admin by aggregating:
    1. `occupiedSeats` across all shows for each movie (`Object.keys(show.occupiedSeats || {}).length`).
    2. Paid bookings (`Booking.find({ isPaid: true })`).
  - Sort movies by total seats booked descending.
  - If no seats have been booked yet across any movie, select the movie with the latest active show added by the admin.
  - Return `{ success: true, movie, totalBookedSeats }`.
- **Global Context (`client/src/context/AppContext.jsx`):**
  - Fetch `featuredMovie` in `fetchShows()` and export it through `AppContext`.
- **Frontend (`client/src/components/heroSection.jsx`):**
  - Read `featuredMovie` and `image_base_url` from `useAppContext()`.
  - Dynamically set the background to the movie's backdrop with a dark gradient overlay.
  - Replace the Marvel logo with a dynamic badge (e.g. `🔥 Most Popular • [N] Seats Booked` or `Featured Movie`).
  - Display `featuredMovie.title`, `release_date`, `runtime` (via `timeFormat`), `genres`, and `overview`.
  - Update the CTA button to **"Buy Tickets"** navigating directly to `/movies/${featuredMovie._id}`.

**Tech Stack:** React 19, Tailwind CSS, Express.js, MongoDB / Mongoose.

---

## Global Constraints
- Do NOT implement or deploy until explicit user confirmation ("yes").
- If no movies have been added by the admin or database is empty, provide a clean fallback.
- Preserve existing styling, responsive layout, and dark aesthetic.

---

## Tasks

### Task 1: Backend Featured Movie Endpoint (`server/controllers/showController.js` & `server/routes/showRoutes.js`)
**Files:**
- Modify: `server/controllers/showController.js`
- Modify: `server/routes/showRoutes.js`

- [ ] **Step 1: Implement `getFeaturedMovie` controller**
  - Query all shows and paid bookings.
  - Aggregate total seats booked per movie (`movieSeatsMap`).
  - Find the movie with maximum booked seats.
  - Fallback to the most recent movie added by admin if all seat counts are 0.
  - Return `{ success: true, movie, totalBookedSeats }`.
- [ ] **Step 2: Register route in `server/routes/showRoutes.js`**
  - Add `showRouter.get('/featured', getFeaturedMovie)`.

---

### Task 2: Global State Integration (`client/src/context/AppContext.jsx`)
**Files:**
- Modify: `client/src/context/AppContext.jsx`

- [ ] **Step 1: Add `featuredMovie` state**
  - Add `const [featuredMovie, setFeaturedMovie] = useState(null)`.
  - In `fetchShows()`, query `/api/show/featured` and update `featuredMovie`.
  - Export `featuredMovie` in context provider value.

---

### Task 3: Dynamic Hero Section Component (`client/src/components/heroSection.jsx`)
**Files:**
- Modify: `client/src/components/heroSection.jsx`

- [ ] **Step 1: Render dynamic movie details**
  - Replace hardcoded text with `featuredMovie.title`, `featuredMovie.overview`, `release_date`, and genres.
  - Render backdrop with gradient overlay (`linear-gradient(...)`).
  - Render `timeFormat(featuredMovie.runtime)`.
- [ ] **Step 2: Replace Marvel logo with dynamic badge**
  - Show a stylish badge displaying `🔥 Most Popular • [N] Seats Booked` (or `Featured Movie`).
- [ ] **Step 3: Update CTA button**
  - Connect button to `navigate('/movies/' + featuredMovie._id)`.

---

### Task 4: Build Verification & Deployment Gate
**Files:**
- Test: `npm run build` in `client/`
- Test: `node --check` on server files

- [ ] **Step 1: Run client build**
  - Verify 0 compilation errors.
- [ ] **Step 2: User Approval Gate**
  - Prompt user for confirmation before deploying.
