import { dummyShowsData } from '../assets/assets'
import BlurCircle from '../components/BlurCircle'
import MovieCard from '../components/MovieCard'

const Movies = () => {
    return (
        <main className='min-h-screen px-6 md:px-16 lg:px-24 xl:px-44 pt-28 pb-20'>

            <BlurCircle top='150px' left='0px'/>
            <BlurCircle bottom='50px' right='50px'/>
            <h1 className='text-3xl font-semibold mb-8'>Now Showing</h1>
            {dummyShowsData.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {dummyShowsData.map((movie) => (
                        <MovieCard movie={movie} key={movie._id} />
                    ))}
                </div>
            ) : (
                <h1 className='text-3xl font-bold text-center'>No Movies Available.</h1>
            )}
        </main>
    )
}

export default Movies