import React from "react";
import { ArrowRight, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import timeFormat from "../lib/timeFormat";

const HeroSection = () => {
    const navigate = useNavigate();
    const { featuredMovie, totalBookedSeats, image_base_url } = useAppContext();

    // Default movie fallback if database has no shows yet
    const movie = featuredMovie || {
        _id: "",
        title: "Guardians of the Galaxy",
        overview: "A group of unlikely outlaws—including Peter Quill, Gamora, Drax, Rocket, and Groot—join forces to protect a powerful artifact from a ruthless enemy.",
        genres: [{ name: "Action" }, { name: "Adventure" }, { name: "Sci-fi" }],
        release_date: "2018-05-04",
        runtime: 128,
        backdrop_path: ""
    };

    const backdropUrl = movie.backdrop_path 
        ? `${image_base_url}${movie.backdrop_path}` 
        : "/backgroundImage.png";

    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "";
    const genreNames = Array.isArray(movie.genres) 
        ? movie.genres.map((g) => (typeof g === "string" ? g : g.name)).slice(0, 3).join(" | ") 
        : "";

    const hasSpecificMovie = Boolean(featuredMovie?._id);

    return (
        <div 
            style={{
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.85) 100%), url("${backdropUrl}")`
            }}
            className="relative flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen"
        >
            {/* Dynamic Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-semibold tracking-wider uppercase mt-20 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                {totalBookedSeats > 0 ? `Most Popular • ${totalBookedSeats} Seats Booked` : "Featured Screening"}
            </div>

            <h1 className="text-4xl md:text-[64px] md:leading-16 font-bold max-w-2xl text-white drop-shadow-md">
                {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm">
                {genreNames && <span>{genreNames}</span>}
                {releaseYear && (
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-primary"/> {releaseYear}
                    </div>
                )}
                {movie.runtime > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Clock3 className="w-4 h-4 text-primary"/> {timeFormat(movie.runtime)}
                    </div>
                )}
            </div>

            <p className="max-w-xl text-gray-300 text-sm md:text-base line-clamp-3 leading-relaxed drop-shadow-sm">
                {movie.overview}
            </p>

            <button 
                onClick={() => {
                    if (hasSpecificMovie) {
                        navigate(`/movies/${movie._id}`);
                    } else {
                        navigate("/movies");
                    }
                    scrollTo(0, 0);
                }} 
                className="flex items-center gap-2 px-7 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer shadow-lg active:scale-95"
            >
                {hasSpecificMovie ? "Buy Tickets" : "Explore Movies"}
                <ArrowRight className="w-4 h-4"/>
            </button>
        </div>
    );
};

export default HeroSection;
