import { useEffect, useState } from "react";
import { dummyBookingData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "./Title";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";

const ListBookings = () =>{
    const currency = import.meta.env.VITE_CURRENCY

    const { axios,getToken,user} = useAppContext()

    const [bookings,setBookings] = useState([]);
    const [isLoading,setIsLoading] = useState(true);

    const getAllBookings = async () =>{
        try {
            const {data} = await axios.get('/api/admin/all-bookings',{
            headers:{Authorization: `Bearer ${await getToken()}`}
            });
            setBookings(data.bookings)
        } catch (error) {
            console.error(error);
        }

        setIsLoading(false)
    }

    useEffect(()=>{
        if(user){
          getAllBookings();  
        }
        
    },[user]);

    return !isLoading ? (
        <>
        <Title text1="List" text2="Bookings"/>
        <div className="max-w-5xl mt-6 overflow-x-auto rounded-xl border border-gray-700/60 bg-gray-900/40 shadow-xl backdrop-blur-xs">
            <table className="w-full border-collapse text-left text-nowrap">
             <thead>
                <tr className="border-b border-gray-700/60 bg-gray-800/80 text-xs font-semibold uppercase tracking-wider text-gray-300">
                   <th className="px-6 py-3.5">User Name</th>
                   <th className="px-6 py-3.5">Movie Name</th>
                   <th className="px-6 py-3.5">Show Time</th>
                   <th className="px-6 py-3.5">Seats</th>
                   <th className="px-6 py-3.5">Amount</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70 text-sm font-normal text-gray-300">
                {bookings.length > 0 ? (
                  bookings.map((item,index)=>(
                    <tr key={index} className="transition-colors hover:bg-white/5">
                        <td className="px-6 py-3.5 font-medium text-white">{item.user?.name || "User"}</td>
                        <td className="px-6 py-3.5">{item.show?.movie?.title || "Show Removed"}</td>
                        <td className="px-6 py-3.5">{item.show?.showDateTime ? dateFormat(item.show.showDateTime) : "N/A"}</td>
                        <td className="px-6 py-3.5">{item.bookedSeats ? (Array.isArray(item.bookedSeats) ? item.bookedSeats.join(", ") : Object.values(item.bookedSeats).join(", ")) : ""}</td>
                        <td className="px-6 py-3.5 font-medium text-primary">{currency} {item.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-sm text-gray-400">
                      No bookings recorded yet
                    </td>
                  </tr>
                )}
            </tbody>
            </table>
        </div>
        </>
    ) : <Loading/>
}

export default ListBookings