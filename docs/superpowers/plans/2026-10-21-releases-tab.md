# Releases Tab, Movie Card Navigation to Movie Details, & Dynamic Shows/Coming Soon Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 
1. Display the same now-playing movies from the Admin "Add Shows" tab on the user-facing "Releases" tab (`/releases`).
2. **Movie Card Navigation:** Clicking on any movie card in the Releases tab navigates directly to its Movie Details page (`/movies/:id`).
3. **Dynamic Movie Details Behavior:**
   - When the admin has **not** added shows for this movie yet: the Movie Details page displays full movie metadata with a prominent **"Coming Soon to Theatres"** section (replacing the date selector and "Book Now" interface).
   - As soon as the admin **adds shows** for this movie: the Movie Details page automatically displays the normal movie details tab with date selection, showtimes, and the "Book Now" interface.
4. **Favorites Management:**
   - Add a heart favorite icon on each movie card in the Releases tab (with `e.stopPropagation()` so clicking the heart favorites/unfavorites without triggering card navigation).
   - Allow users to unfavorite movies directly from the Favorites tab (`/favourite`).

**Architecture:** 
1. **Backend Endpoints:**
   - Make `GET /api/show/now-playing` public by removing `protectAdmin` middleware.
   - Update `GET /api/show/:movieId`:
     - If the movie is already in MongoDB, return it. If not yet in MongoDB (a newly released movie from TMDB), fetch its details and cast from TMDB.
     - Query upcoming, non-deleted, non-sold-out shows for this movie ID.
     - Return `{ success: true, movie, dateTime, hasActiveShows: Object.keys(dateTime).length > 0 }`.
   - In `server/controllers/userController.js`:
     - In `updateFavourite`: ingest favorited TMDB movies into MongoDB so they persist in the user's favorites list.
     - In `getFavourites`: return all user-favorited movies (`Movie.find({ _id: { $in: favourites } })`).
2. **Global Favorites Toggle in AppContext:**
   - Expose a reusable `toggleFavourite(movieId)` helper in `client/src/context/AppContext.jsx`.
3. **Releases Catalog Page (`client/src/pages/releases.jsx`):**
   - Fetches now-playing movies from `/api/show/now-playing`.
   - Renders a responsive grid of movie cards with poster, rating, vote count badge (`kConverter`), title, and release date.
   - **Card Navigation:** Clicking on the movie card calls `navigate('/movies/' + movie.id); scrollTo(0,0);` to open its Movie Details page.
   - **Heart Favorite Button:** Positioned on the card with `e.stopPropagation()` so clicking the heart toggles favorites without triggering card navigation.
4. **Dynamic Movie Details Page (`client/src/pages/movieDetails.jsx`):**
   - Displays full movie hero layout (backdrop, poster, title, rating, genres, runtime, overview, cast avatars).
   - Dynamic conditional rendering based on `hasActiveShows`:
     - **Before Admin Adds Shows (`hasActiveShows === false`):**
       - Displays a styled **"Coming Soon to Theatres"** badge in the hero action area (instead of "Buy Tickets").
       - Replaces the `<DateSelect/>` area with a styled **"Coming Soon to Theatres"** banner:
         *"Coming Soon to Theatres — Ticket bookings for this movie will open once showtimes are scheduled. Add it to your favourites to stay updated!"*
     - **After Admin Adds Shows (`hasActiveShows === true`):**
       - Automatically transitions to the **normal movie details tab**!
       - Displays the "Buy Tickets" button.
       - Renders `<DateSelect/>` with available dates, showtimes, and the "Book Now" button.
     - Both states support **"Watch Trailer"** and the **Heart Favorite Button**.
5. **Favorites Tab Unfavorite Capability:**
   - In `client/src/components/MovieCard.jsx` and `client/src/pages/favourite.jsx`, add an interactive Heart icon.
   - In `/favourite`, clicking the active heart immediately unfavorites the movie and refreshes the view.
6. **Navigation & Routing:**
   - Link "Releases" in `navBar.jsx` to `/releases`.
   - Register `/releases` in `client/src/App.jsx`.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React Icons (`Heart`, `StarIcon`, `Calendar`), React Router v7, Express, MongoDB/Mongoose, Clerk Auth, TMDB API.

---

## Global Constraints
- Node.js ESM format (`import`/`export`).
- Preserve dark-theme styling, `BlurCircle` glow accents, and responsive layout.
- Do NOT deploy or execute until explicit user confirmation ("Yes").

---

### Task 1: Backend Endpoints - Public Now Playing & Dynamic Movie Details

**Files:**
- Modify: `server/routes/showRoutes.js`
- Modify: `server/controllers/showController.js`
- Modify: `server/controllers/userController.js`

**Steps:**
- [ ] In `server/routes/showRoutes.js`, remove `protectAdmin` from `GET /api/show/now-playing`.
- [ ] In `server/controllers/showController.js`, update `getShow`:
  - If `Movie.findById(movieId)` is not in MongoDB, fetch details and credits from TMDB (`/movie/${movieId}` & `/movie/${movieId}/credits`).
  - Calculate `dateTime` for upcoming, non-deleted, non-sold-out shows.
  - Return `{ success: true, movie, dateTime, hasActiveShows: Object.keys(dateTime).length > 0 }`.
- [ ] In `server/controllers/userController.js`:
  - In `updateFavourite`: ingest TMDB movie into MongoDB if not yet present.
  - In `getFavourites`: fetch and return all user-favorited movies (`Movie.find({ _id: { $in: favourites } })`).

---

### Task 2: Global `toggleFavourite` in AppContext

**Files:**
- Modify: `client/src/context/AppContext.jsx`

**Steps:**
- [ ] Implement `toggleFavourite(movieId)` in `AppContext.jsx`:
  - Verify user authentication (prompt login toast if guest).
  - Call `POST /api/user/update-favourite`.
  - Await `fetchFavouriteMovies()` and show success toast.
- [ ] Expose `toggleFavourite` in `AppContext.Provider` value.

---

### Task 3: Releases Page with Movie Card Click Navigation

**Files:**
- Create: `client/src/pages/releases.jsx`

**Steps:**
- [ ] Create `Releases.jsx` fetching `/api/show/now-playing`.
- [ ] Render responsive grid with `<BlurCircle/>` accents.
- [ ] **Card Click Action:** Clicking on any movie card navigates to its Movie Details page: `navigate('/movies/' + movie.id); scrollTo(0,0);`.
- [ ] **Heart Icon Action:** Top-right heart icon with `e.stopPropagation()` calling `toggleFavourite(movie.id)` without triggering navigation.
- [ ] Display poster, rating with `StarIcon`, vote count badge (`kConverter`), title, and release date.

---

### Task 4: Dynamic Movie Details Page (Coming Soon vs Active Shows)

**Files:**
- Modify: `client/src/pages/movieDetails.jsx`

**Steps:**
- [ ] Update `movieDetails.jsx` to load movie data regardless of whether active shows exist:
  - `show = { movie: data.movie, dateTime: data.dateTime, hasActiveShows: data.hasActiveShows }`.
- [ ] Hero Actions:
  - If `hasActiveShows`: show "Buy Tickets" (`href="#dateSelect"`).
  - If `!hasActiveShows`: show a styled badge "Coming Soon to Theatres".
- [ ] Booking Section:
  - If `hasActiveShows`: render `<DateSelect dateTime={show.dateTime} id={id} />` with date picker and "Book Now".
  - If `!hasActiveShows`: render the **"Coming Soon to Theatres"** section with calendar icon and notification message.
- [ ] When admin adds shows for this movie in the dashboard, page dynamically switches to normal booking mode with dates.
- [ ] Retain "Watch Trailer" and heart favorite toggle for both states.

---

### Task 5: Unfavorite Functionality in Favorites Tab & MovieCard

**Files:**
- Modify: `client/src/components/MovieCard.jsx`
- Modify: `client/src/pages/favourite.jsx`

**Steps:**
- [ ] In `client/src/components/MovieCard.jsx`, add an interactive Heart button to toggle favorite status.
- [ ] In `client/src/pages/favourite.jsx`, ensure clicking the heart immediately removes the movie from favorites and updates the display cleanly.

---

### Task 6: Navigation & Routing Connection

**Files:**
- Modify: `client/src/components/navBar.jsx`
- Modify: `client/src/App.jsx`

**Steps:**
- [ ] In `client/src/components/navBar.jsx`, update the "Releases" link to `to={'/releases'}`.
- [ ] In `client/src/App.jsx`, import `Releases` from `./pages/releases` and register `<Route path='/releases' element={<Releases/>} />`.

---

### Task 7: Verification & Build

**Steps:**
- [ ] Run `npm run build` in `client` to ensure zero compilation or routing errors.
- [ ] Present completed work and confirm with user.
