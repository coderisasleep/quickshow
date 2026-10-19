# Now Showing Trailers Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dynamically display and play official YouTube trailers for movies featured in the "Now Showing" section instead of hardcoded dummy trailers, with an auto-rotating slide show from right to left when more than 4 movies are showing.

**Architecture:** Add a new Express backend endpoint `GET /api/show/trailers` in `server/controllers/showController.js` and `server/routes/showRoutes.js` that retrieves the active unique movies from upcoming shows, queries the TMDB API (`/movie/{id}/videos`) for their official YouTube trailer keys, and returns video URLs and thumbnail links. Update `client/src/components/TrailersSection.jsx` to fetch this endpoint on mount. If 4 or fewer trailers exist, render a clean responsive 4-column grid; if more than 4 trailers exist, render an auto-advancing rotating slide show (carousel) moving right to left with pause-on-hover and arrow navigation. Clicking any card immediately switches the main player to that trailer and highlights the active card.

**Tech Stack:** React 19, ReactPlayer, Lucide Icons (`ChevronLeft`, `ChevronRight`, `PlayCircleIcon`), Tailwind CSS, Node.js / Express, Mongoose, TMDB API (Axios).

**Spec:** User requirements from chat session:
- Fetch official YouTube trailers for movies present in the "Now Showing" section.
- If `<= 4` movies: render static responsive cards matching Now Showing.
- If `> 4` movies: render all trailers in a rotating slide show moving smoothly from right to left covering all active movies.
- When user clicks any trailer card in the slide show or grid, the main video player updates immediately to play that trailer.
- High-res YouTube thumbnail (`https://img.youtube.com/vi/{key}/maxresdefault.jpg`) on the trailer cards with fallback (`hqdefault.jpg`).
- Fallback gracefully to dummy trailers if no active shows or trailers exist.

## Global Constraints
- Node.js ESM format (`import`/`export`) in both client and server.
- Express route `/api/show/trailers` must be declared before `showRouter.get("/:movieId", getShow)` to prevent route collision.
- Touch only necessary files (`server/controllers/showController.js`, `server/routes/showRoutes.js`, `client/src/components/TrailersSection.jsx`).
- No unnecessary external packages.

## Review Focus
1. Route collision: `GET /api/show/trailers` must not be captured by `GET /api/show/:movieId`.
2. TMDB missing video: A movie might have no "Trailer" type video, only "Teaser" or "Clip" - the lookup must fall back to any valid YouTube video key.
3. Database with zero upcoming shows: The endpoint must return an empty list `{ success: true, trailers: [] }` without crashing, and the client must preserve `dummyTrailers` fallback.
4. Broken YouTube `maxresdefault.jpg` image: Older or low-res YouTube videos might 404 on `maxresdefault.jpg`; `onError` handler should fall back to `hqdefault.jpg`.
5. Active trailer indicator & click action: Clicking any trailer card in grid or slideshow updates `currentTrailer` and triggers playback in `ReactPlayer`.
6. Carousel rotation math & wrapping: When `> 4` movies exist, rotating from right to left must cycle seamlessly and pause on user hover/interaction.

---

### Task 1: Backend Endpoint `GET /api/show/trailers`

**Files:**
- Modify: `server/controllers/showController.js`
- Modify: `server/routes/showRoutes.js`
- Test: `attic/test-trailers-endpoint.mjs`

**Interfaces:**
- Produces: `GET /api/show/trailers` returning JSON:
  ```json
  {
    "success": true,
    "trailers": [
      {
        "movieId": "1423191",
        "title": "Resident Evil",
        "videoUrl": "https://www.youtube.com/watch?v=mNd1gb19A-c",
        "image": "https://img.youtube.com/vi/mNd1gb19A-c/maxresdefault.jpg",
        "fallbackImage": "https://img.youtube.com/vi/mNd1gb19A-c/hqdefault.jpg"
      }
    ]
  }
  ```

- [ ] **Step 1: Write test script to verify endpoint contract**

Create `attic/test-trailers-endpoint.mjs` calling `getNowShowingTrailers` logic directly and asserting response shape:
- Returns `success: true`
- Returns array of `trailers` for all active movies
- Each item has `movieId`, `title`, `videoUrl`, `image`, `fallbackImage`

- [ ] **Step 2: Run test to verify it fails**

Run: `node attic/test-trailers-endpoint.mjs`
Expected: FAIL with function `getNowShowingTrailers` undefined.

- [ ] **Step 3: Implement `getNowShowingTrailers` in `server/controllers/showController.js` and register in `server/routes/showRoutes.js`**

In `server/controllers/showController.js`:
1. Find upcoming shows (`showDateTime >= new Date()`) populated with `movie`, sorted by `showDateTime: 1`.
2. Deduplicate unique movies by ID preserving chronological order (up to a safety cap of 20).
3. Query `tmdbClient.get('/movie/${movie._id}/videos')` in parallel using `Promise.allSettled`.
4. Prioritize `v.site === 'YouTube' && v.type === 'Trailer'`, fallback to `v.site === 'YouTube'`.
5. Map to `{ movieId, title, videoUrl, image, fallbackImage }`.
6. Return `res.json({ success: true, trailers })`.

In `server/routes/showRoutes.js`:
Add `showRouter.get('/trailers', getNowShowingTrailers)` immediately above `showRouter.get("/:movieId", getShow)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node attic/test-trailers-endpoint.mjs`
Expected: PASS with trailers correctly retrieved.

- [ ] **Step 5: Commit**

```bash
git add server/controllers/showController.js server/routes/showRoutes.js
git commit -m "feat: add getNowShowingTrailers endpoint"
```

---

### Task 2: Update Frontend `TrailersSection.jsx`

**Files:**
- Modify: `client/src/components/TrailersSection.jsx`

**Interfaces:**
- Consumes: `GET /api/show/trailers` via `useAppContext().axios`
- Updates: state `trailers` and `currentTrailer`
- Slideshow: auto-rotates right-to-left when `trailers.length > 4`, with pause-on-hover and left/right controls.

- [ ] **Step 1: Update `TrailersSection.jsx` implementation**

1. Import `useEffect`, `useState`, `useRef`, and `useAppContext`.
2. Get `axios` from `useAppContext()`.
3. In `useEffect`, fetch `/api/show/trailers`. If `data.success && data.trailers?.length > 0`, set `trailers` and `currentTrailer(data.trailers[0])`.
4. Add slide state: `slideIndex`, `isPaused`.
5. Set up auto-rotation interval when `trailers.length > 4` and `!isPaused` to advance slide from right to left every 3.5 seconds.
6. When `trailers.length <= 4`, render the standard 4-column responsive grid.
7. When `trailers.length > 4`, render the rotating slide show with:
   - Overflow hidden viewport with responsive visible items (e.g., 4 on lg, 3 on md, 2 on sm).
   - Smooth `translateX` animation track.
   - Prev/Next navigation chevron buttons.
   - `onMouseEnter` / `onMouseLeave` pause controls.
8. On clicking any card in both grid and slideshow:
   - Call `setCurrentTrailer(trailer)`.
   - Highlight active card with `ring-2 ring-primary`.
9. Add `onError` on card `<img>` to fallback to `trailer.fallbackImage`.

- [ ] **Step 2: Verify client builds without errors**

Run: `npm run build` in `client`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/TrailersSection.jsx
git commit -m "feat: render dynamic trailers and rotating slideshow when count exceeds 4"
```

---

### Task 3: End-to-End Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run client build verification**
Run: `npm run build` in `client`
Expected: PASS with 0 warnings/errors.

- [ ] **Step 2: Clean up scratch test files in attic**
Keep repository clean.

- [ ] **Step 3: Final check and summary**
Confirm all requirements are satisfied.
