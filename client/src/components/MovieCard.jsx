import { Heart, StarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom"
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({movie}) => {
    const navigate = useNavigate()

    const { image_base_url, favouriteMovies, toggleFavourite } = useAppContext();
    const movieId = movie._id || movie.id;
    const isFav = favouriteMovies.some(m => m._id.toString() === movieId?.toString());

    return(
        <div className="flex flex-col justify-between p-3 bg-gray-800
        rounded-2xl hover:-translate-y-1 transition duration-300 w-full">
        <div className="relative rounded-lg overflow-hidden h-52 w-full">
            <img onClick={()=>{navigate(`/movies/${movieId}`); scrollTo(0,0)}}
             src={image_base_url + (movie.backdrop_path || movie.poster_path)} alt={movie.title || ''}
            className="h-full w-full object-cover object-right-bottom cursor-pointer hover:scale-105 transition duration-500"/>

            <button
                type="button"
                title={isFav ? "Remove from favourites" : "Add to favourites"}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFavourite(movieId);
                }}
                className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-black/90 transition cursor-pointer active:scale-90 z-10"
            >
                <Heart className={`w-4 h-4 transition-colors ${isFav ? "text-primary fill-primary" : "text-white hover:text-primary"}`} />
            </button>
        </div>

        <p className="font-semibold mt-2 truncate">{movie.title}</p>
        
        <p className="text-sm text-gray-400 mt-2">
            {movie.release_date ? new Date(movie.release_date).getFullYear() : ''} • 
            {(movie.genres || []).slice(0,2).map(genre => genre.name).join(" | ")} {movie.runtime ? `• ${timeFormat(movie.runtime)}` : ''}
        </p>

        <div className="flex items-center justify-between mt-4 pb-3">
        <button onClick={()=>{navigate(`/movies/${movieId}`); scrollTo(0,0)}}
        className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull
        transition rounded-full font-medium cursor-pointer">Buy Tickets</button>
        <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
            <StarIcon className="w-4 h-4 text-primary fill-primary"/>
            {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
        </p>
        </div>
        </div>
    )
}

export default MovieCard