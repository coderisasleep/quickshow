import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, StarIcon } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import Loading from '../components/Loading'
import { useAppContext } from '../context/AppContext'
import { kConverter } from '../lib/kConverter'

const Releases = () => {
    const navigate = useNavigate()
    const { axios, image_base_url, favouriteMovies, toggleFavourite } = useAppContext()

    const [movies, setMovies] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchNowPlaying = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const { data } = await axios.get('/api/show/now-playing')
            if (data.success && Array.isArray(data.movies)) {
                setMovies(data.movies)
            } else {
                setError(data.message || 'Unable to load releases')
            }
        } catch (err) {
            console.error('Error fetching now playing releases:', err)
            setError(err.response?.data?.message || err.message || 'Error loading releases')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNowPlaying()
    }, [])

    if (isLoading) {
        return <Loading />
    }

    return (
        <main className='min-h-screen px-6 md:px-16 lg:px-24 xl:px-44 pt-28 pb-20'>
            <BlurCircle top='150px' left='0px' />
            <BlurCircle bottom='50px' right='50px' />

            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-3xl font-semibold'>Latest Releases</h1>
                    <p className='text-sm text-gray-400 mt-1'>
                        Explore the newest movies playing in theatres. Click any movie to view details.
                    </p>
                </div>
            </div>

            {error && movies.length === 0 ? (
                <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center'>
                    <p className='text-red-400'>{error}</p>
                    <button
                        onClick={fetchNowPlaying}
                        className='bg-primary px-6 py-2 rounded text-white cursor-pointer hover:bg-primary/90'
                    >
                        Retry
                    </button>
                </div>
            ) : movies.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                    {movies.map((movie) => {
                        const isFav = favouriteMovies.some(
                            (m) => m._id.toString() === movie.id.toString()
                        )

                        return (
                            <div
                                key={movie.id}
                                onClick={() => {
                                    navigate(`/movies/${movie.id}`)
                                    scrollTo(0, 0)
                                }}
                                className='group relative flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-full cursor-pointer border border-transparent hover:border-primary/40'
                            >
                                {/* Poster Image */}
                                <div className='relative rounded-lg overflow-hidden h-72 w-full'>
                                    <img
                                        src={image_base_url + movie.poster_path}
                                        alt={movie.title}
                                        className='w-full h-full object-cover brightness-95 group-hover:scale-105 transition duration-500'
                                    />

                                    {/* Bottom Info Bar inside image */}
                                    <div className='text-xs flex items-center justify-between p-2.5 bg-black/75 w-full absolute bottom-0 left-0 backdrop-blur-xs'>
                                        <p className='flex items-center gap-1 text-gray-300 font-medium'>
                                            <StarIcon className='w-3.5 h-3.5 text-primary fill-primary' />
                                            {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                                        </p>
                                        <p className='text-gray-300 text-[11px]'>
                                            {kConverter(movie.vote_count)} Votes
                                        </p>
                                    </div>

                                    {/* Heart Favorite Icon button on top-right */}
                                    <button
                                        type='button'
                                        title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleFavourite(movie.id)
                                        }}
                                        className='absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-black/90 transition cursor-pointer active:scale-90 z-10'
                                    >
                                        <Heart
                                            className={`w-4 h-4 transition-colors ${
                                                isFav ? 'text-primary fill-primary' : 'text-white hover:text-primary'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Movie Title & Release Date */}
                                <div className='mt-3 flex flex-col justify-between flex-1'>
                                    <div>
                                        <p className='font-semibold text-white text-base truncate group-hover:text-primary transition-colors'>
                                            {movie.title}
                                        </p>
                                        <p className='text-xs text-gray-400 mt-1'>
                                            Release Date: {movie.release_date || 'Coming Soon'}
                                        </p>
                                    </div>

                                    <div className='mt-4 flex items-center justify-between pt-2 border-t border-gray-700/60'>
                                        <span className='text-xs text-primary font-medium group-hover:underline'>
                                            View Details &rarr;
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center h-64 text-center'>
                    <h2 className='text-2xl font-bold'>No Releases Found.</h2>
                    <p className='text-gray-400 text-sm mt-2'>Check back soon for new movie releases.</p>
                </div>
            )}
        </main>
    )
}

export default Releases
