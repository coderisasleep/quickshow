import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { assets, dummyShowsData, getDummyShowtimesForDate } from '../assets/assets'
import Loading from '../components/Loading'
import { ArrowRightIcon, ClockIcon } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'

const SeatLayout = () => {

  const groupRows = [["A","B"],["C","D"],["E","F"],["G","H"],["I","J"]]
  
  const { id , date } = useParams()
  const [selectedTime,setSelectedTime] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const movie = dummyShowsData.find((show) => show._id === id)
  const availableTimes = movie ? getDummyShowtimesForDate(date) : []

  const handleSeatClick = (seatId) => {
    if(!selectedTime){
      return toast("Please select time first")
    }
    if(!selectedSeats.includes(seatId) && selectedSeats.length > 4){
      return toast("You can only select 5 seats")
    }
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat  => seat !== seatId) : [...prev,seatId])
  }

  const renderSeats = (row, count = 9) => (
    <div key={row} className='flex gap-2 mt-2'>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {Array.from({length:count},(_,i) => {
          const seatId = `${row}${i+1}`;
          return (
            <button key={seatId} onClick={()=> handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${selectedSeats.includes(seatId) && "bg-primary text-white"}`}>
              {seatId}
            </button>
          )
        })}

      </div>

    </div>
  )

  

  return movie ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
     {/* Available Timings */}
     <div className='w-52 bg-primary/10 border border-primary/20 rounded-lg py-6 h-max md:sticky md:top-30'>
       <p className='px-4 text-center text-base font-semibold'>Available Timings</p>
       <div className='mt-3 flex flex-col items-center gap-1'>
       {availableTimes.length > 0 ? availableTimes.map((item)=>(
        <div key={item.time} onClick={()=>setSelectedTime(item)} className={`flex items-center gap-2 px-4 py-1.5 w-max rounded-md cursor-pointer transition
        ${selectedTime?.time === item.time ? "bg-primary text-white" : "hover:bg-primary/20"}`}>
          <ClockIcon className='w-3.5 h-3.5' />
          <p className='text-xs'>{new Date(item.time).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}</p>
        </div>
       )) : <p className='px-4 text-center text-xs text-gray-400'>No available timings.</p>}
     </div>
     </div>
     
     {/* Seat Layout */}
     <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>
        <BlurCircle too="-100px" left="-100px"/>
        <BlurCircle too="0px" right="0px"/>
        <h1 className='text-2xl font-semibold mb-4'>Select Your Seat</h1>
        <img src={assets.screenImage} alt=""/>
        <p className='text-gray-400 text-sm mb-6'>
          SCREEN SIDE
        </p>
        <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
          <div className='grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6'>
            {groupRows[0].map(row => renderSeats(row))}
          </div>
         <div className='grid grid-cols-2 gap-11'>
           {groupRows.slice(1).map((group, idx)=>(
            <div key={idx}>
              {group.map(row => renderSeats(row))}
            </div>
           ))}
        </div>
        </div>
        <button onClick={()=>Navigate('/my-bookings')} className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'>
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className='w-4 h-4'/>
        </button>
        
     </div>
    </div>) : (
      <Loading />
    )
  
}

export default SeatLayout
