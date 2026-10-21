import { clerkClient } from "@clerk/express";
import Booking from "../model/Booking.js";
import Movie from "../model/Movie.js";
import Show from "../model/Show.js";
import { tmdbClient } from "../configs/tmdb.js";

//API Controller function to get user bookings
export const getUserBookings = async(req,res) =>{
    try{
      const user = req.auth().userId;
      if(!user){
        return res.status(401).json({success:false,message:"Authentication required"})
      }
      
      const bookings = await Booking.find({user}).populate({
        path:"show",
        populate:{path:'movie'}
      }).sort({createdAt: -1})
      res.json({success:true, bookings})
    }catch(error){
      console.error(error.message);
      res.status(500).json({success:false,message:error.message});
    }
}

//API Controller Function to Update Favourite Movie in Cleerk User Metadata
export const updateFavourite = async(req,res) =>{
    try{
        const {movieId} = req.body;
        const userId = req.auth().userId;
        if(!userId){
            return res.status(401).json({success:false,message:"Authentication required"})
        }
        if(typeof movieId !== 'string' || !movieId){
            return res.status(400).json({success:false,message:"Movie ID is required"})
        }

        const user = await clerkClient.users.getUser(userId)
        const favourites = Array.isArray(user.privateMetadata?.favourites)
            ? [...user.privateMetadata.favourites]
            : []

        const isFavoriting = !favourites.includes(movieId);

        if (isFavoriting) {
          // If movie is being added to favourites and not in Movie DB, fetch & save it
          let movie = await Movie.findById(movieId);
          if (!movie) {
            try {
              const [detailsRes, creditsRes] = await Promise.all([
                tmdbClient.get(`/movie/${movieId}`),
                tmdbClient.get(`/movie/${movieId}/credits`)
              ]);
              const d = detailsRes.data;
              const c = creditsRes.data;
              await Movie.create({
                _id: movieId,
                title: d.title,
                overview: d.overview,
                poster_path: d.poster_path,
                backdrop_path: d.backdrop_path || d.poster_path,
                genres: d.genres || [],
                casts: c?.cast || [],
                release_date: d.release_date,
                original_language: d.original_language,
                tagline: d.tagline || "",
                vote_average: d.vote_average,
                runtime: d.runtime || 0,
              });
            } catch (tmdbErr) {
              console.error("TMDB error when favoriting movie:", tmdbErr.message);
            }
          }
        }

        const updatedFavourites = favourites.includes(movieId)
            ? favourites.filter(item=> item !== movieId)
            : [...favourites,movieId]

        await clerkClient.users.updateUserMetadata(userId,{
            privateMetadata:{...user.privateMetadata,favourites:updatedFavourites}
        })
        res.json({success:true, message: isFavoriting ? "Added to favourites" : "Removed from favourites"})
    }catch(error){
        console.error(error);
        res.status(500).json({success:false,message:error.message})
    }
}

export const getFavourites = async(req,res) =>{
    try{
       const userId = req.auth().userId
       if(!userId){
         return res.status(401).json({success:false,message:"Authentication required"})
       }

       const user = await clerkClient.users.getUser(userId)
       const favourites = Array.isArray(user.privateMetadata?.favourites)
         ? user.privateMetadata.favourites
         : []

       if(favourites.length === 0){
         return res.json({success:true, movies: []})
       }

       // Getting movies from database
       const movies = await Movie.find({_id: {$in: favourites} })

       res.json({success:true , movies})
    }catch(error){
        console.error(error);
        res.status(500).json({success:false,message:error.message})
    }
}
