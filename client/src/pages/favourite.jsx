
import BlurCircle from '../components/BlurCircle'
import MovieCard from '../components/MovieCard'
import { useAppContext } from '../context/AppContext'

const Movies = () => {
    
    const { favouriteMovies } = useAppContext();

    return (
        <main className='min-h-screen px-6 md:px-16 lg:px-24 xl:px-44 pt-28 pb-20'>

            <BlurCircle top='150px' left='0px'/>
            <BlurCircle bottom='50px' right='50px'/>
            
            {favouriteMovies.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {favouriteMovies.map((movie) => (
                        <MovieCard movie={movie} key={movie._id} />
                    ))}
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center h-screen'>
                  <h1 className='text-3xl font-bold text-center'>No Movies Available.</h1>
                </div>
                
            )}
        </main>
    )
}

export default Movies