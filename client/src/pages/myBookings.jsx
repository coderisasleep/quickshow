import BlurCircle from '../components/BlurCircle'
import { CalendarDays } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import { dateFormat } from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'
import { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import { Link, useNavigate, useSearchParams } from "react-router-dom"

const MyBookings = () => {

    const currency = import.meta.env.VITE_CURRENCY
    const { axios, getToken, user, isClerkLoaded, image_base_url } = useAppContext()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const paymentSessionId = searchParams.get('session_id')

    const [bookings,setBookings] = useState([])
    const[isLoading,setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [paymentError, setPaymentError] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() =>{
        if(!isClerkLoaded || !user){
            return
        }

        let isActive = true

        const getMyBookings = async () =>{
            setIsLoading(true)
            setError('')
            try {
                const {data} = await axios.get('/api/user/bookings',{headers: {Authorization: `Bearer ${await getToken()}`}})
                if(!data.success){
                    throw new Error(data.message || 'Unable to load your bookings.')
                }
                if(isActive){
                    setBookings(data.bookings)
                }
            } catch (error) {
                console.error(error)
                if(isActive){
                    setError(error.response?.data?.message || error.message || 'Unable to load your bookings.')
                }
            } finally {
                if(isActive){
                    setIsLoading(false)
                }
            }
        }

        getMyBookings()
        return () => {
            isActive = false
        }
    },[axios, getToken, isClerkLoaded, refreshKey, user])

    useEffect(() =>{
        if(!isClerkLoaded || !user || !paymentSessionId){
            return
        }

        let isActive = true

        const confirmPayment = async () =>{
            try{
                const token = await getToken()
                const {data} = await axios.post('/api/booking/confirm-payment',{sessionId:paymentSessionId},{
                    headers:{Authorization:`Bearer ${token}`}
                })
                if(!data.success || !data.isPaid){
                    throw new Error(data.message || 'Unable to confirm payment.')
                }
                setPaymentError('')
            }catch(error){
                console.error(error)
                if(isActive){
                    setPaymentError(error.response?.data?.message || error.message || 'Unable to confirm payment.')
                }
            }finally{
                if(isActive){
                    setRefreshKey(key => key + 1)
                    navigate('/my-bookings',{replace:true})
                }
            }
        }

        confirmPayment()
        return () => {
            isActive = false
        }
    },[axios, getToken, isClerkLoaded, navigate, paymentSessionId, user])

    const isPageLoading = !isClerkLoaded || (Boolean(user) && isLoading)

    return !isPageLoading ? (
        <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
            <BlurCircle top="100px" left="100px"/>
            <div>
                <BlurCircle top="100px" left="600px"/>
            </div>
            <h1 className='text-lg font-semibold mb-4'>My Bookings ({bookings.length})</h1>
            {error && <p className='text-red-400'>{error}</p>}
            {paymentError && <p className='text-red-400'>{paymentError}</p>}
            {!user && <p className='text-gray-400'>Sign in to view your bookings.</p>}
            {user && !error && bookings.length === 0 && <p className='text-gray-400'>You have no bookings yet.</p>}
            {bookings.map((item,index)=>(
                <div key={index} className='flex flex-col sm:flex-row sm:items-stretch justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'>
                      <div className='flex min-w-0 flex-1 flex-col sm:flex-row'>
                           <img src={image_base_url + item.show.movie.poster_path} alt="" className='w-full sm:w-44 sm:shrink-0 aspect-video h-auto object-cover object-bottom rounded'/>
                           <div className='flex min-w-0 flex-1 flex-col p-4'>
                               <p className='text-lg font-semibold'>{item.show.movie.title}</p>
                               <p className='text-gray-400 text-sm'>{timeFormat(item.show.movie.runtime)}</p>
                               <div className='flex flex-wrap items-center gap-x-4 gap-y-2 mt-auto pt-3 text-gray-400 text-sm'>
                                   <p className='flex items-center gap-1.5'>
                                    <CalendarDays className='w-4 h-4' />
                                       {dateFormat(item.show.showDateTime)} 
                                   </p>
                               </div>
                           </div>
                           <div className='flex flex-col justify-between gap-4 p-4 sm:min-w-52 sm:items-end'>
                            <div className='flex w-full items-center justify-between gap-3 sm:justify-end'>
                             <p className='whitespace-nowrap text-xl font-semibold'>{currency}{item.amount}</p>
                             {!item.isPaid && <Link to={item.paymentLink} className='shrink-0 bg-primary px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer'>Pay Now</Link>}
                            </div>
                            <div className='w-full space-y-1 text-sm sm:text-right'>
                             <p className='flex justify-between gap-4 sm:justify-end'><span className='text-gray-400'>Total Tickets:</span><span>{item.bookedSeats.length}</span></p>
                             <p className='flex justify-between gap-4 sm:justify-end'><span className='text-gray-400'>Seat Number:</span><span>{item.bookedSeats.join(", ")}</span></p>
                            </div>
                           </div>

                      </div>
                </div>
            ))}
        </div>
    ) : (
        <Loading/>
    )
}

export default MyBookings