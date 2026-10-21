import { useState,useEffect } from "react"
import { dummyShowsData } from "../../assets/assets";
import Loading from "../../components/Loading";
import Title from "./Title";
import { CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const AddShow = () =>{

    const {axios,getToken, user, image_base_url, fetchShows} = useAppContext()

    const currency = import.meta.env.VITE_CURRENCY
    const [nowPlayingMovies,setNowPlayingMovies] = useState([]);
    const [selectedMovie,setSelectedMovie] = useState(null);
    const [dateTimeSelection,setDateTimeSelection] = useState({});
    const [dateTimeInput,setDateTimeInput] = useState("");
    const [showPrice,setShowPrice] = useState("");
    const [addingShow, setAddingShow] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNowPlayingMovies = async () =>{
       setIsLoading(true);
       setError(null);
       try{
          const {data} = await axios.get('/api/show/now-playing',{
            headers: {Authorization: `Bearer ${await getToken()}`}})
          if(data.success && Array.isArray(data.movies)){
              setNowPlayingMovies(data.movies)
          }else{
              setError(data.message || 'Unable to load now playing movies')
          }
       }catch(error){
          console.error('Error fetching movies:',error)
          setError(error.response?.data?.message || error.message || 'Error fetching movies')
       }finally{
          setIsLoading(false);
       }
    };

    const getStartOfTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    };

    const getMinDateTime = () => {
        const tomorrow = getStartOfTomorrow();
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00`;
    };

    const isTodayOrPast = Boolean(dateTimeInput && new Date(dateTimeInput) < getStartOfTomorrow());

    const handleDateTimeAdd = () => {
        if (!dateTimeInput) return;
        const selectedDate = new Date(dateTimeInput);
        if (isNaN(selectedDate.getTime()) || selectedDate < getStartOfTomorrow()) {
            toast.error("Shows cannot be scheduled for the current day or past dates. Please select tomorrow or later.");
            return;
        }
        const [date,time] = dateTimeInput.split("T");
        if(!date||!time) return;

        setDateTimeSelection((prev) =>{
            const times = prev[date] || [];
            if(!times.includes(time)){
                return{...prev,[date]:[...times,time]};
            }
            return prev;
        });
    };

    const handleRemoveTime =(date,time) =>{
        setDateTimeSelection((prev)=>{
            const filteredTimes = prev[date].filter((t)=> t !==time);
            if(filteredTimes.length===0){ //"===" "strict equality" for true both value and type must be same
              const {[date]: _, ...rest}=prev;
              return rest;
            }
            return {
                ...prev,
                [date]: filteredTimes,
            };
        });
    };


    const handleSubmit = async () =>{
        try{
          setAddingShow(true)
          
          if(!selectedMovie || Object.keys(dateTimeSelection).length === 0 || !showPrice){
            toast.error('Missing required fields')
            return
          }

          const startOfTomorrow = getStartOfTomorrow();
          const hasInvalidShow = Object.entries(dateTimeSelection).some(([date, times]) =>
            times.some(time => new Date(`${date}T${time}`) < startOfTomorrow)
          );
          if (hasInvalidShow) {
            toast.error("Shows cannot be scheduled for the current day or past dates. Please select tomorrow or later.");
            return;
          }

          const showsInput = Object.entries(dateTimeSelection).map(([date, times]) => ({
            date,
            time: times,
            isoTimes: times.map((t) => new Date(`${date}T${t}`).toISOString()),
          }));

          const payload = {
            movieId: selectedMovie,
            showsInput,
            showPrice: Number(showPrice)
          }

          const {data} = await axios.post('/api/show/add',payload,{headers: {Authorization: `Bearer ${await getToken()}`}})

          if(data.success){
            toast.success('Show was added successfully')
            setSelectedMovie(null)
            setDateTimeSelection({})
            setShowPrice("")
            if (typeof fetchShows === 'function') {
              await fetchShows();
            }
          }else{
            toast.error(data.message)
          }

        }catch(error){
          console.error("Submission error:",error)
          toast.error('An error occurred, please try again')
        }finally{
          setAddingShow(false)
        }
    }

    useEffect(()=>{
        if(user){
          fetchNowPlayingMovies();
        }
        
    },[user]);

    if (isLoading) {
        return <Loading/>;
    }

    if (error && nowPlayingMovies.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <p className="text-red-400">{error}</p>
                <button onClick={fetchNowPlayingMovies} className="bg-primary px-6 py-2 rounded text-white cursor-pointer hover:bg-primary/90">
                    Retry
                </button>
            </div>
        );
    }

    const selectedMovieObj = nowPlayingMovies.find((m) => m.id === selectedMovie);

    return (
        <div className="space-y-8 max-w-7xl">
        <Title text1="Add" text2="Shows"/>

        {/* STEP 1: Full-Width 6-Column Responsive Movie Grid */}
        <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
                        <span>Step 1: Select a Movie</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700 font-normal">
                            {nowPlayingMovies.length} Available
                        </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Click any movie card to select or switch the show target</p>
                </div>

                {selectedMovieObj ? (
                    <div className="text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full font-medium truncate max-w-xs">
                        Selected: {selectedMovieObj.title}
                    </div>
                ) : (
                    <div className="text-xs text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full">
                        No movie selected
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {nowPlayingMovies.map((movie)=>{
                const isSelected = selectedMovie === movie.id;
                return (
                  <div
                    key={movie.id}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                      isSelected
                        ? "ring-2 ring-primary bg-primary/10 shadow-xl shadow-primary/20"
                        : "border border-gray-800 bg-gray-900/60 hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedMovie(isSelected ? null : movie.id)}
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden">
                      <img
                        src={image_base_url + movie.poster_path}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-md">
                          <CheckIcon className="w-3.5 h-3.5" strokeWidth={2.5}/>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/>
                          {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </span>
                        <span className="text-gray-300 text-[11px]">{kConverter(movie.vote_count)} votes</span>
                      </div>
                    </div>

                    <div className="p-3">
                      <p className={`font-semibold text-xs truncate ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                        {movie.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{movie.release_date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
        </section>

        {/* STEP 2: Full-Width 3-Column Scheduling Command Deck */}
        <section className="space-y-4">
            <div>
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    <span>Step 2: Schedule & Launch</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Set ticket pricing, configure showtimes, and publish to the schedule</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* CARD 1: Selected Target Spotlight */}
                <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b border-gray-800">
                            <span className="flex items-center gap-1.5 text-white">
                                <span>🎯</span> Selected Target
                            </span>
                            {selectedMovieObj ? (
                                <span className="text-xs text-emerald-400 font-mono">Ready to Schedule</span>
                            ) : (
                                <span className="text-xs text-gray-500 font-mono">No Target Chosen</span>
                            )}
                        </div>

                        {selectedMovieObj ? (
                            <div className="flex gap-4 items-center">
                                <img
                                    src={image_base_url + selectedMovieObj.poster_path}
                                    alt={selectedMovieObj.title}
                                    className="w-16 h-24 object-cover rounded-xl shadow-md border border-gray-700 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-white text-base truncate">{selectedMovieObj.title}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Release: {selectedMovieObj.release_date}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-2 font-medium">
                                        <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/>
                                        <span className="text-gray-200">{selectedMovieObj.vote_average?.toFixed(1)}</span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-400">{kConverter(selectedMovieObj.vote_count)} votes</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMovie(null)}
                                        className="mt-2.5 text-xs text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                        ✕ Deselect movie
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-xl border border-dashed border-gray-700 text-center text-sm text-gray-400">
                                <p className="text-2xl mb-2">👆</p>
                                <p className="font-medium text-gray-300">No movie selected</p>
                                <p className="text-xs text-gray-500 mt-1">Click any movie card in Step 1 above to select it</p>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 pt-4 border-t border-gray-800/80 mt-4">
                        💡 Tip: Click any other card above in Step 1 to switch targets.
                    </p>
                </div>

                {/* CARD 2: Pricing & Showtime Scheduler */}
                <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md space-y-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <span>💵</span> Pricing & Timing
                        </span>
                        <span className="text-gray-400 text-xs font-mono">{currency}</span>
                    </div>

                    {/* Ticket Price */}
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Ticket Price</label>
                        <div className="flex items-center rounded-xl border border-gray-700/80 bg-gray-950/80 px-4 py-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                            <span className="text-gray-400 font-bold text-sm mr-2.5">{currency}</span>
                            <input
                                min={0}
                                type="number"
                                value={showPrice}
                                onChange={(e) => setShowPrice(e.target.value)}
                                placeholder="Enter show price"
                                className="bg-transparent text-white text-sm outline-none w-full placeholder-gray-500 font-medium"
                            />
                        </div>
                    </div>

                    {/* Showtime Picker */}
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                            Date & Time (Tomorrow or later)
                        </label>
                        <div className={`flex gap-2 p-1 rounded-xl border ${isTodayOrPast ? "border-red-500" : "border-gray-700/80"} bg-gray-950/80 items-center`}>
                            <input
                                type="datetime-local"
                                min={getMinDateTime()}
                                value={dateTimeInput}
                                onChange={(e) => setDateTimeInput(e.target.value)}
                                className="flex-1 bg-transparent px-3 py-2 text-white text-xs outline-none rounded-lg [color-scheme:dark]"
                            />
                            <button
                                type="button"
                                onClick={handleDateTimeAdd}
                                disabled={!dateTimeInput || isTodayOrPast}
                                className={`px-4 py-2 text-xs font-bold rounded-lg text-white transition shrink-0 ${
                                    !dateTimeInput || isTodayOrPast
                                        ? "bg-gray-700 opacity-50 cursor-not-allowed"
                                        : "bg-primary hover:bg-primary/90 cursor-pointer shadow-md"
                                }`}
                            >
                                + Add
                            </button>
                        </div>
                        {isTodayOrPast ? (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1 font-medium">
                                <span>⚠️</span> Shows cannot be scheduled for today or past dates.
                            </p>
                        ) : (
                            <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                                <span>ℹ️</span> Shows must be scheduled for tomorrow or later.
                            </p>
                        )}
                    </div>
                </div>

                {/* CARD 3: Queued Showtimes & Submit CTA */}
                <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-800 mb-3">
                            <span className="flex items-center gap-1.5">
                                <span>📅</span> Queued Showtimes
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono font-normal">
                                {Object.values(dateTimeSelection).reduce((acc, times) => acc + times.length, 0)} showtimes
                            </span>
                        </div>

                        {/* List of configured dates & times */}
                        {Object.keys(dateTimeSelection).length > 0 ? (
                            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                                {Object.entries(dateTimeSelection).map(([date, times]) => (
                                    <div key={date} className="p-3 bg-gray-950/80 rounded-xl border border-gray-800">
                                        <div className="text-xs font-semibold text-gray-300 mb-2">{date}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {times.map((time) => (
                                                <span
                                                    key={time}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs"
                                                >
                                                    <span>{time}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTime(date, time)}
                                                        className="text-red-400 hover:text-white transition-colors cursor-pointer"
                                                        title="Remove time"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-5 rounded-xl border border-dashed border-gray-800 text-center text-xs text-gray-500">
                                No showtimes queued yet. Select a date & time in Card 2 and click "+ Add".
                            </div>
                        )}
                    </div>

                    {/* Submit CTA */}
                    <div className="pt-4 border-t border-gray-800 mt-4">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={addingShow || !selectedMovie || Object.keys(dateTimeSelection).length === 0 || !showPrice}
                            className="w-full py-3.5 px-6 bg-primary hover:bg-primary/90 active:scale-98 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {addingShow ? (
                                <span>Adding Show...</span>
                            ) : (
                                <>
                                    <span>🚀</span> Add Show to Schedule
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </section>

        </div>
    );
}

export default AddShow