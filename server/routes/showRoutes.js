import express from "express"
import { getNowPlayingMovies, addShow, getShows, getShow, getNowShowingTrailers, getMovieTrailer } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

showRouter.get('/now-playing',protectAdmin, getNowPlayingMovies)
showRouter.post('/add',protectAdmin, addShow)
showRouter.get('/all', getShows)
showRouter.get('/trailers', getNowShowingTrailers)
showRouter.get('/trailer/:movieId', getMovieTrailer)
showRouter.get("/:movieId",getShow)

export default showRouter