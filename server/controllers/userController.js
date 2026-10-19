import { clerkClient } from "@clerk/express";
import Booking from "../model/Booking.js";
import Movie from "../model/Movie.js";
import Show from "../model/Show.js";

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

        const updatedFavourites = favourites.includes(movieId)
            ? favourites.filter(item=> item !== movieId)
            : [...favourites,movieId]

        await clerkClient.users.updateUserMetadata(userId,{
            privateMetadata:{...user.privateMetadata,favourites:updatedFavourites}
        })
        res.json({success:true, message:"Favourite movies updated"})
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

       // Only include favourite movies with active, non-deleted, non-sold-out shows
       const activeShows = await Show.find({
         movie: { $in: favourites },
         showDateTime: { $gte: new Date() },
         isDeleted: { $ne: true }
       });

       const activeMovieIds = new Set(
         activeShows
           .filter(s => Object.keys(s.occupiedSeats || {}).length < 90)
           .map(s => s.movie.toString())
       );

       //getting movies from database
       const movies = await Movie.find({_id: {$in: Array.from(activeMovieIds)} })

       res.json({success:true , movies})


    }catch(error){
        console.error(error);
        res.status(500).json({success:false,message:error.message})
    }
}
