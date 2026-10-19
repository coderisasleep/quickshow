# Admin Delete Show & Auto-Delete Sold Out Shows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow administrators to delete shows from a dedicated "Delete Show" admin tab, automatically remove shows from the website when all 90 tickets are sold out, and immediately remove them from "Now Showing" and "Movies" sections while completely preserving earned revenue and booking records.

**Architecture:** Implement a soft-delete mechanism (`isDeleted: true`) on the `Show` schema so existing `Booking` references remain valid for revenue aggregation and booking history. In addition to manual admin deletion, auto-delete/exclude shows when all 90 seats are occupied (`Object.keys(show.occupiedSeats).length >= 90`). Exclude deleted and sold-out shows across all public show queries (`/api/show/all`, `/api/show/trailers`, `/api/show/:movieId`, `/api/admin/dashboard`, `/api/admin/all-shows`). Create a new `DeleteShow.jsx` admin page featuring an interactive show selection table, a "Delete Show" button matching the exact CSS of `AddShow.jsx`, and register the tab in `AdminSidebar.jsx` and `App.jsx`.

**Tech Stack:** React 19, Tailwind CSS, Lucide Icons (`Trash2Icon`), React Router v7, Express, Mongoose.

**Spec:**
- Add "Delete Show" tab in `AdminSidebar.jsx` sharing the exact same CSS as other sidebar tabs.
- Create `/admin/delete-show` route in `client/src/App.jsx`.
- Implement `DeleteShow.jsx` with table of upcoming shows, selection control, and a "Delete Show" button sharing the exact CSS as the "Add Show" button:
  `bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer`.
- Soft-delete show (`isDeleted: true`) on backend via `POST /api/admin/delete-show` (protected with `protectAdmin`).
- Auto-delete / exclude sold-out shows: when all 90 seats are booked (`Object.keys(occupiedSeats).length >= 90`), mark or exclude the show from website listings.
- Exclude deleted and sold-out shows from `getShows`, `getShow`, `getNowShowingTrailers`, `getAllShows`, and `getDashboardData`.
- Ensure `Booking` records are untouched so `totalRevenue` (`bookings.reduce(...)`) and booking history remain 100% unaffected.

## Global Constraints
- Node.js ESM format (`import`/`export`).
- Admin endpoints protected with `protectAdmin`.
- Total theater seats = 90 (rows A-J $\times$ 9 seats per row from `SeatLayout.jsx`).
- Defensive checks on `item.show?.movie?.title` in booking lists to prevent crashes if a show was deleted.
- No external packages needed.

## Review Focus
1. Revenue preservation: Verify `totalRevenue` in `getDashboardData` remains unchanged after deleting a show with paid bookings.
2. Auto-deletion on sell-out: Verify a show with 90 occupied seats immediately disappears from `/api/show/all` (Now Showing & Movies page) and `/api/show/trailers`.
3. Manual deletion: Verify admin clicking "Delete Show" successfully sets `isDeleted: true` and removes it from the catalog.
4. Booking history integrity: Verify `ListBookings.jsx` and `MyBookings.jsx` render correctly without throwing null reference errors.
5. Unauthorized access: Verify non-admin requests to `/api/admin/delete-show` return 403 / 401.

---

### Task 1: Backend Show Soft-Delete, Auto-Delete Sold Out & Query Filtering

**Files:**
- Modify: `server/model/Show.js`
- Modify: `server/controllers/adminController.js`
- Modify: `server/routes/adminRoutes.js`
- Modify: `server/controllers/showController.js`
- Modify: `server/controllers/bookingController.js`
- Test: `attic/test-delete-show.mjs`

**Interfaces:**
- Produces: `POST /api/admin/delete-show` with `{ showId: string }` returning `{ success: true, message: "Show deleted successfully" }`.
- Updates: `Show` schema to include `isDeleted: { type: Boolean, default: false }`.
- Updates: `confirmBookingPayment` in `bookingController.js`: if `Object.keys(showData.occupiedSeats).length >= 90`, set `showData.isDeleted = true`.
- Updates: `getShows`, `getNowShowingTrailers`, `getShow`, `getAllShows`, `getDashboardData` to filter out `{ isDeleted: true }` and sold-out shows (`Object.keys(occupiedSeats).length >= 90`).

- [ ] **Step 1: Write test script to verify manual delete, auto-delete on sold-out, and query isolation**
Create `attic/test-delete-show.mjs` to test:
- Call `deleteShow` controller function and assert show has `isDeleted: true`.
- Assert `getShows` excludes deleted shows and shows with 90 occupied seats.
- Assert `Booking.find({ isPaid: true })` revenue calculation remains intact.

- [ ] **Step 2: Run test to verify it fails**
Run: `node attic/test-delete-show.mjs`
Expected: FAIL (`deleteShow` not defined).

- [ ] **Step 3: Implement `isDeleted` in `Show.js`, `deleteShow` controller, auto-delete check, and query filters**
1. In `server/model/Show.js`: Add `isDeleted: { type: Boolean, default: false }`.
2. In `server/controllers/adminController.js`:
   - Add `deleteShow` controller handler.
   - Update `getAllShows`: filter `{ showDateTime: { $gte: new Date() }, isDeleted: { $ne: true } }`.
   - Update `getDashboardData`: filter activeShows with `isDeleted: { $ne: true }`.
3. In `server/routes/adminRoutes.js`: Add `adminRouter.post('/delete-show', protectAdmin, deleteShow)`.
4. In `server/controllers/showController.js`:
   - In `getShows`: filter `{ showDateTime: { $gte: new Date() }, isDeleted: { $ne: true } }` and exclude shows where `Object.keys(show.occupiedSeats).length >= 90`.
   - In `getShow`: filter `{ movie: movieId, showDateTime: { $gte: new Date() }, isDeleted: { $ne: true } }` and exclude shows with 90 seats occupied.
   - In `getNowShowingTrailers`: filter `{ showDateTime: { $gte: new Date() }, isDeleted: { $ne: true } }`.
5. In `server/controllers/bookingController.js`:
   - In `confirmBookingPayment`: check if `Object.keys(showData.occupiedSeats).length >= 90`, and if so, set `showData.isDeleted = true`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node attic/test-delete-show.mjs`
Expected: PASS.

- [ ] **Step 5: Commit backend changes**
```bash
git add server/
git commit -m "feat: add deleteShow endpoint and auto-delete sold out shows"
```

---

### Task 2: Frontend "Delete Show" Admin Page & Navigation

**Files:**
- Create: `client/src/pages/admin/DeleteShow.jsx`
- Modify: `client/src/components/admin/AdminSidebar.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/pages/admin/ListBookings.jsx` (defensive optional chaining)
- Modify: `client/src/pages/myBookings.jsx` (defensive optional chaining)

**Interfaces:**
- Route: `/admin/delete-show`
- Component: `DeleteShow`
- Action: Calls `api.post('/api/admin/delete-show', { showId })` with bearer token.

- [ ] **Step 1: Create `DeleteShow.jsx` mirroring `AddShow.jsx` layout and CSS**
1. Use `<Title text1="Delete" text2="Shows" />`.
2. Fetch active shows from `/api/admin/all-shows`.
3. Display the movies of active shows using the **exact same layout and CSS as `AddShow.jsx`**:
   - Section heading: `<p className="mt-10 text-lg font-medium">Active Shows</p>`.
   - Card container: `<div className="overflow-x-auto pb-4"><div className="group flex flex-wrap gap-4 mt-4 w-max">...</div></div>`.
   - Movie card: `<div className="relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300">` with poster image, star rating, vote count badge, title, and release date.
   - Selected checkmark badge in top-right: `<div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded"><CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5}/></div>`.
4. When a movie card is selected, display its scheduled showtimes in styled badges (matching the date-time selection block of `AddShow.jsx`). Admin can select all or specific showtimes to delete.
5. Render the "Delete Show" button using the exact same classes as `AddShow.jsx`:
   `className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"`.
6. Add confirmation dialog before triggering delete.
7. Call `POST /api/admin/delete-show` with `{ showIds }` (or `{ showId }`), trigger toast, and reload shows on successful deletion.

- [ ] **Step 2: Register tab in `AdminSidebar.jsx` directly below 'Add Shows' and route in `App.jsx`**
1. In `AdminSidebar.jsx`, add `{ name: 'Delete Shows', path: '/admin/delete-show', icon: Trash2Icon }` directly below `'Add Shows'` (order: Dashboard -> Add Shows -> Delete Shows -> List Shows -> list Bookings).
2. In `App.jsx`, add `<Route path="delete-show" element={<DeleteShow/>} />` under admin routes.

- [ ] **Step 3: Add defensive optional chaining in booking views**
Ensure `item.show?.movie?.title || 'Show Removed'` in `ListBookings.jsx` and `myBookings.jsx` so booking history never throws an error.

- [ ] **Step 4: Verify client build**
Run: `npm run build` in `client`.
Expected: 0 errors.

- [ ] **Step 5: Commit frontend changes**
```bash
git add client/
git commit -m "feat: add Delete Show admin page and sidebar navigation"
```

---

### Task 3: End-to-End Verification

- [ ] **Step 1: Test full client build**
- [ ] **Step 2: Clean up temporary test files in attic**
- [ ] **Step 3: Confirm all requirements met and present report to user**
