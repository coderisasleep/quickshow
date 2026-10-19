import Movie from "../model/Movie.js"
import Show from "../model/Show.js"
import { tmdbClient } from "../configs/tmdb.js"

//API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req,res) =>{
     try{
       const { data } = await tmdbClient.get('/movie/now_playing')
       const movies = data.results;
       res.json({success:true, movies: movies})
     } catch(error){
        console.error('TMDB Error:', error.message)
        res.status(500).json({success:false, message: error.message})
     }
}

//API to add a new show to the database
export const addShow = async(req,res) =>{
   try{
      const {movieId, showsInput, showPrice} = req.body

      let movie = await Movie.findById(movieId);

      if(!movie){
        //Fetch movie details and credits from TMDB API
        const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
          tmdbClient.get(`/movie/${movieId}`),
          tmdbClient.get(`/movie/${movieId}/credits`)
        ]);

        const movieApiData = movieDetailsResponse.data;
        const movieCreditsData = movieCreditsResponse.data;

        const movieDetails = {
          _id: movieId,
          title: movieApiData.title,
          overview: movieApiData.overview,
          poster_path: movieApiData.poster_path,
          backdrop_path: movieApiData.backdrop_path,
          genres: movieApiData.genres,
          casts: movieCreditsData.cast,
          release_date: movieApiData.release_date,
          original_language: movieApiData.original_language,
          tagline: movieApiData.tagline || "",
          vote_average: movieApiData.vote_average,
          runtime: movieApiData.runtime,

        }

        //Add movie to the database
        movie = await Movie.create(movieDetails);
      }

      const showsToCreate = [];
      showsInput.forEach(show =>{
         const showDate = show.date;
         show.time.forEach((time)=>{
           const dateTimeString = `${showDate}T${time}`;
           showsToCreate.push({
            movie: movieId,
            showDateTime: new Date(dateTimeString),
            showPrice,
            occupiedSeats: {}
           })
         })
      });

      if(showsToCreate.length>0){
        await Show.insertMany(showsToCreate);
      }

      res.json({success:true, message:"Show Added Successfully"})



   } catch(error){
    console.error(error)
    res.json({success:false, message: error.message})
   }
}

// API to get all shows from the database
export const getShows = async(req,res) =>{
  try{
    const shows = await Show.find({showDateTime:{$gte: new Date()}}).populate('movie').sort({showDateTime: 1});

      //filter unique shows
      const uniqueShows = new Set(shows.map(show=>show.movie))
    
    res.json({success:true, shows: Array.from(uniqueShows)})
  } catch(error){
    console.error(error);
    res.json({success:false, message: error.message});
  }
}

// API to get a single show from database
export const getShow = async(req,res) =>{
  try{
     const {movieId} = req.params;
     //get all upcoming shows for the movie
     const shows = await Show.find({movie:movieId, showDateTime:{$gte: new Date()}})

     const movie = await Movie.findById(movieId);
     const dateTime ={};

     shows.forEach((show)=>{
      const date = show.showDateTime.toISOString().split("T")[0];
      if(!dateTime[date]){
        dateTime[date]=[]
      }
      dateTime[date].push({time:show.showDateTime, showId: show._id})
     })

     res.json({success:true, movie, dateTime})
  }catch(error){
     console.error(error);
     res.json({success:false, message:error.message});
  }
}

// API to get trailers for now showing movies
export const getNowShowingTrailers = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDateTime: 1 });

    const movieMap = new Map();
    shows.forEach((s) => {
      if (s.movie?._id && !movieMap.has(s.movie._id.toString())) {
        movieMap.set(s.movie._id.toString(), s.movie);
      }
    });

    const movies = Array.from(movieMap.values()).slice(0, 20);

    const trailerResults = await Promise.allSettled(
      movies.map(async (movie) => {
        try {
          const { data } = await tmdbClient.get(`/movie/${movie._id}/videos`);
          const trailer =
            data.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
            data.results?.find((v) => v.site === 'YouTube');

          if (trailer?.key) {
            return {
              movieId: movie._id,
              title: movie.title,
              videoUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
              image: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
              fallbackImage: `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`,
            };
          }
        } catch (tmdbErr) {
          console.error(`TMDB error fetching videos for movie ${movie._id}:`, tmdbErr.message);
        }
        return null;
      })
    );

    const trailers = trailerResults
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);

    res.json({ success: true, trailers });
  } catch (error) {
    console.error('Error in getNowShowingTrailers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};