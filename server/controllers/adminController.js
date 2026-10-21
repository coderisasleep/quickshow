import Booking from "../model/Booking.js";
import Show from "../model/Show.js";
import User from "../model/User.js";
import { cleanupEndedShows } from "../utils/showCleanup.js";


//API to check if user is admin
export const isAdmin = async(req,res)=>{
    res.json({success:true, isAdmin:true})
}

//API to get dashboard data
export const getDashboardData = async(req,res)=>{
    try{
       await cleanupEndedShows();
       const now = new Date();
       const bookings = await Booking.find({isPaid:true});
       const shows = await Show.find({isDeleted: {$ne: true}}).populate('movie');
       const activeShows = shows.filter(show => {
         const runtimeMinutes = show.movie?.runtime || 0;
         const endTime = new Date(show.showDateTime.getTime() + runtimeMinutes * 60000);
         return endTime > now;
       });

       const totalUser = await User.countDocuments();

       const dashboardData = {
        totalBookings:bookings.length,
        totalRevenue:bookings.reduce((acc,booking)=>acc + booking.amount, 0),
        activeShows,
        totalUser
       }

       res.json({success:true, dashboardData})
    }catch(error){
        console.error(error);
        res.json({success:false, message:error.message})

    }
}

//API to get all shows
export const getAllShows = async(req,res)=>{
    try{
        await cleanupEndedShows();
        const now = new Date();
        const shows = await Show.find({isDeleted: {$ne: true}}).populate('movie').sort({showDateTime: 1});
        const activeShows = shows.filter(show => {
          const runtimeMinutes = show.movie?.runtime || 0;
          const endTime = new Date(show.showDateTime.getTime() + runtimeMinutes * 60000);
          return endTime > now;
        });
        res.json({success:true, shows: activeShows})
    }catch(error){

        console.error(error);
        res.json({success:false, message:error.message})

    }
}

//API to delete show(s)
export const deleteShow = async(req,res)=>{
    try{
        const { showId, showIds } = req.body;
        const targetIds = Array.isArray(showIds) ? showIds : (showId ? [showId] : []);

        if(targetIds.length === 0){
            return res.status(400).json({success:false, message: "Please specify showId or showIds to delete"});
        }

        await Show.updateMany(
            { _id: { $in: targetIds } },
            { $set: { isDeleted: true } }
        );

        res.json({success:true, message: "Show(s) deleted successfully"});
    }catch(error){
        console.error(error);
        res.status(500).json({success:false, message:error.message});
    }
}

//API to get all bookings 

export const getAllBookings = async(req,res)=>{
    try{
        const bookings = await Booking.find({}).populate('user').populate({
            path:"show",
            populate:{path:"movie"}
        }).sort({createdAt: -1})
        res.json({success:true,bookings})

    }catch(error){
        console.error(error);
        res.json({success:false, message:error.message})

    }
}