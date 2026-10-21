import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BlurCircle from '../components/BlurCircle'
import { Calendar, Heart, PlayCircleIcon } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import DateSelect from '../components/DateSelect'
import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'


const MovieDetails = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [showResult, setShowResult] = useState(null)

    const { shows, axios, getToken, user, fetchFavouriteMovies, favouriteMovies, toggleFavourite, image_base_url } = useAppContext()
    const show = showResult?.id === id ? showResult.show : null
    const isLoading = showResult?.id !== id

    const handleFavourite =async () =>{
        try {
            if(!user) return toast.error("please login to mark favourites")
                const {data} = await axios.post('/api/user/update-favourite', {movieId : id}, {headers: {Authorization: `Bearer ${await getToken()}`}})
            if(data.success){
                await fetchFavouriteMovies()
                toast.success(data.message)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleWatchTrailer = () => {
        navigate('/', {
            state: {
                trailerMovieId: id,
                movieTitle: show?.movie?.title,
                autoPlay: true,
            }
        })
    }

    useEffect(()=>{
        let isActive = true

        const getShow = async () =>{
            try {
                const {data} = await axios.get(`/api/show/${id}`)
                if(isActive){
                    const hasMovie = Boolean(data.success && data.movie);
                    const hasActiveShows = Boolean(
                        hasMovie &&
                        data.hasActiveShows &&
                        data.dateTime &&
                        Object.keys(data.dateTime).length > 0
                    );
                    setShowResult({
                        id,
                        show: hasMovie
                            ? {movie: data.movie, dateTime: data.dateTime || {}, hasActiveShows}
                            : null,
                        error: hasMovie
                            ? null
                            : data.message || 'Movie details are not available.'
                    })
                }
            } catch (error) {
                console.error(error)
                if(isActive){
                    setShowResult({
                        id,
                        show: null,
                        error: 'Unable to load movie details. Please try again.'
                    })
                }
            }
        }

        getShow()
        return () => {
            isActive = false
        }
    },[axios, id])

    if(isLoading){
        return <Loading/>
    }

    if(!show){
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="text-gray-300 text-lg">{showResult?.error || 'No active shows available for this movie.'}</p>
                <button onClick={()=>navigate('/movies')} className="rounded-md bg-primary hover:bg-primary-dull transition px-8 py-3 text-sm font-medium cursor-pointer">
                    Browse Movies
                </button>
            </main>
        )
    }

    return (
        <main className='min-h-screen px-6 md:px-16 lg:px-40 pt-30 md:pt-50'>
            <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'>

             <img src={image_base_url + show.movie.poster_path} alt={`${show.movie.title} poster`}
             className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover'/>

                <div className='relative flex flex-col gap-3'>
                <BlurCircle top="-100px" left="-100px"/>
                <p className='text-primary'>{show.movie.original_language.toUpperCase()}</p>
                <h1 className='text-4xl font-semibold max-w-96
                text-balance'>{show.movie.title}</h1>
                <div className='flex items-center gap-2 text-gray-300'>
                    <Heart className='w-5 h-5 ${} text-primary fill-primary'/>
                    {show.movie.vote_average.toFixed(1)} User Rating
                </div>
             <p className='text-gray-300'>
                {show.movie.genres.map((genre) => genre.name).join(', ')} •{' '}
                {show.movie.release_date.split('-')[0]} • {timeFormat(show.movie.runtime)}
             </p>
             <div className='flex items-center flex-wrap gap-4 mt-4'>
                <button onClick={handleWatchTrailer} className='flex items-center gap-2 px-7 py-3 text-sm
                bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium
                cursor-pointer active:scale-95'>
                    <PlayCircleIcon className='w-5 h-5'/>
                    Watch Trailer</button>
                {show.hasActiveShows ? (
                    <a href="#dateSelect" className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull
                    transition rounded-md font-medium cursor-pointer active:scale-95'>Buy Tickets</a>
                ) : (
                    <span className='px-8 py-3 text-sm bg-primary/20 text-primary border border-primary/40
                    rounded-md font-semibold select-none'>Coming Soon to Theatres</span>
                )}
                <button onClick={() => toggleFavourite(id)} className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95'>
                    <Heart className={`w-5 h-5 ${favouriteMovies.some(movie => movie._id.toString() === id.toString()) ? 'text-primary fill-primary' : ""} `}/>
                </button>
             </div>
             <p className='max-w-2xl text-gray-300'>{show.movie.overview}</p>

            </div>
            </div>
            <p className='text-lg font-medium mt-20'>Cast</p>
            <div className='overflow-x-auto no-scrollbar mt-8 pb-4'>
             <div className='flex items-center gap-4 w-max px-4'>
                {(show.movie.casts || []).slice(0,12).map((cast, index)=>(
                    <div key={index} className='flex flex-col items-center text-center'>
                       <img src={image_base_url + cast.profile_path} alt={cast.name} className='rounded-full 
                       h-20 md:h-20 aspect-square object-cover'/>
                       <p className='font-medium text-xs mt-3'>{cast.name}</p>
                    </div>
                ))}
             </div>
            </div>
            {show.hasActiveShows ? (
                <DateSelect dateTime={show.dateTime} id={id}/>
            ) : (
                <div className='pt-20'>
                    <div className='relative flex flex-col items-center justify-center text-center p-10 bg-primary/10 border border-primary/20 rounded-2xl'>
                        <BlurCircle top='-40px' left='25%'/>
                        <Calendar className='w-12 h-12 text-primary mb-3' />
                        <h2 className='text-2xl font-semibold text-white'>Coming Soon to Theatres</h2>
                        <p className='text-gray-400 mt-2 max-w-lg text-sm leading-relaxed'>
                            Ticket bookings for this movie have not opened yet. Add it to your favourites to get notified when showtimes are scheduled!
                        </p>
                        <button
                            onClick={() => toggleFavourite(id)}
                            className='mt-6 flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dull transition rounded-md text-sm font-medium cursor-pointer active:scale-95'
                        >
                            <Heart className={`w-4 h-4 ${favouriteMovies.some(m => m._id.toString() === id.toString()) ? 'fill-white' : ''}`} />
                            {favouriteMovies.some(m => m._id.toString() === id.toString()) ? 'In Favourites' : 'Add to Favourites'}
                        </button>
                    </div>
                </div>
            )}
            <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {shows.slice(0,4).map((movie)=>(
                <MovieCard key={movie._id} movie={movie}/>
              ))}
            </div>
            <div className='flex justify-center mt-20'>
              <button onClick={()=>{navigate('/movies'); scrollTo(0,0)}} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'>
               Show More
              </button>
            </div>
        </main>
    )
}

export default MovieDetails