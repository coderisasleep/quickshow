
import Title from "./Title";
import { dateFormat } from "../../lib/dateFormat";
import { useEffect, useState} from 'react';
import Loading from "../../components/Loading";
import { useAppContext } from "../../context/AppContext";

const ListShow = () =>{

    const currency = import.meta.env.VITE_CURRENCY

    const { axios,getToken,user} = useAppContext()

    const [shows,setShows] = useState([]);
    const [loading,setLoading] = useState(true);

    const getAllShows = async() =>{
        
        try{
            const {data} = await axios.get('/api/admin/all-shows',{
                headers:{Authorization: `Bearer ${await getToken()}`}
            });
           setShows(data.shows)

            setLoading(false);
        }catch(error){
            console.error(error);
        }
    }

    useEffect(()=>{
        if(user){
           getAllShows(); 
        } 
    },[user]);

    return !loading ? (
        <>
        <Title text1="List" text2="Shows"/>
        <div className="max-w-5xl mt-6 overflow-x-auto rounded-xl border border-gray-700/60 bg-gray-900/40 shadow-xl backdrop-blur-xs">
          <table className="w-full border-collapse text-left text-nowrap">
            <thead>
                <tr className="border-b border-gray-700/60 bg-gray-800/80 text-xs font-semibold uppercase tracking-wider text-gray-300">
                   <th className="px-6 py-3.5">Movie Name</th>
                   <th className="px-6 py-3.5">Show Time</th>
                   <th className="px-6 py-3.5">Total Bookings</th>
                   <th className="px-6 py-3.5">Earnings</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70 text-sm font-normal text-gray-300">
                {shows.length > 0 ? (
                  shows.map((show,index)=>(
                    <tr key={index} className="transition-colors hover:bg-white/5">
                        <td className="px-6 py-3.5 font-medium text-white">{show.movie?.title || "Movie"}</td>
                        <td className="px-6 py-3.5">{dateFormat(show.showDateTime)}</td>
                        <td className="px-6 py-3.5">{Object.keys(show.occupiedSeats || {}).length}</td>
                        <td className="px-6 py-3.5 font-medium text-primary">{currency} {Object.keys(show.occupiedSeats || {}).length * show.showPrice}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-sm text-gray-400">
                      No active shows currently listed
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
        </>
    ) : <Loading/>
} 

export default ListShow