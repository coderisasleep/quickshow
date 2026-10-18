import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req,res,next) =>{
  try{
     const { userId } = req.auth();
     if(!userId){
       return res.status(401).json({success:false, message:"Authentication required"})
     }

     const user = await clerkClient.users.getUser(userId)

     if(user.privateMetadata?.role !== 'admin'){
       return res.status(403).json({
         success:false,
         message:'Admin access requires privateMetadata.role to be set to "admin" in Clerk'
       })
     }

     next();
  }catch(error){
     console.error('Failed to verify admin access with Clerk:', error)
     return res.status(500).json({success:false, message:"Unable to verify admin access"})
  }
}