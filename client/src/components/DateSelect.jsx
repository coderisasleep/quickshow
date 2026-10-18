import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import BlurCircle from "./BlurCircle"
import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

const DateSelect = ({id, dateTime = {}}) =>{

    const navigate = useNavigate();

    const [selected, setSelected] = useState(null)
    const dates = Object.keys(dateTime)
        .sort()
        .map((dateKey) => ({
            dateKey,
            date: new Date(`${dateKey}T00:00:00`)
        }))

    const onBookHandler = () => {
        if(!selected || !dateTime[selected]?.length){
            return toast('Please select a date!')
        }
        navigate(`/movies/${id}/${selected}`)
        scrollTo(0,0)

    }

    return(
        <div id="dateSelect" className="pt-30">
            <div className="flex flex-col md:flex-row
            items-center justify-between gap-10
            relative p-8 bg-primary/10 border border-primary/20
            rounded-lg">
                <BlurCircle top="-100px" left="-100px"/>
                <BlurCircle top="-100px" right="0px"/>
                <div>
                    <p className="text-lg font-semibold">Choose Date</p>
                    <div className="flex items-center gap-6 text-sm mt-5">
                     <ChevronLeftIcon width={28}/>
                     <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4">
                        {dates.map(({date, dateKey})=>(
                    <button key={dateKey} onClick={() => setSelected(dateKey)} className={`flex flex-col items-center justify-center
                               h-14 w-14 aspect-square rounded cursor-pointer ${selected === dateKey ? "bg-primary text-white" : "border border-primary/70"}`}>
                              <span>{date.getDate()}</span>
                              <span>{date.toLocaleString("en-US", {month: "short"})}</span>
                            </button>
                        ))}
                     </span>
                     <ChevronRightIcon width={28}/>
                    </div>
                </div>
                {dates.length === 0 && (
                    <p className="mt-5 text-sm text-gray-400">No upcoming show dates are available.</p>
                )}
                <button onClick={onBookHandler} disabled={dates.length === 0} className="bg-primary text-white px-8 py-2 mt-6
                rounded hover:bg-primary/90 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                   Book Now
                </button>

            </div>

        </div>
    )
}

export default DateSelect