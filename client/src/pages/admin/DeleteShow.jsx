import { useState, useEffect } from "react"
import Loading from "../../components/Loading";
import Title from "./Title";
import { CheckIcon, StarIcon, Trash2Icon } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const DeleteShow = () => {
    const { axios, getToken, user, image_base_url } = useAppContext();
    const currency = import.meta.env.VITE_CURRENCY;

    const [shows, setShows] = useState([]);
    const [selectedMovieId, setSelectedMovieId] = useState(null);
    const [selectedShowIds, setSelectedShowIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    const fetchAllShows = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await axios.get('/api/admin/all-shows', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success && Array.isArray(data.shows)) {
                setShows(data.shows);
            } else {
                setError(data.message || 'Unable to load active shows');
            }
        } catch (err) {
            console.error('Error fetching shows:', err);
            setError(err.response?.data?.message || err.message || 'Error fetching shows');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAllShows();
        }
    }, [user]);

    // Group unique movies from active shows
    const movieMap = new Map();
    shows.forEach((show) => {
        if (show.movie?._id && !movieMap.has(show.movie._id)) {
            movieMap.set(show.movie._id, show.movie);
        }
    });
    const uniqueMovies = Array.from(movieMap.values());

    // Filter shows for the selected movie
    const showsForSelectedMovie = shows.filter(
        (show) => show.movie?._id === selectedMovieId
    );

    // Group showtimes by date for the selected movie
    const showsByDate = {};
    showsForSelectedMovie.forEach((show) => {
        const dateStr = new Date(show.showDateTime).toISOString().split('T')[0];
        if (!showsByDate[dateStr]) {
            showsByDate[dateStr] = [];
        }
        showsByDate[dateStr].push(show);
    });

    const handleMovieClick = (movieId) => {
        if (selectedMovieId === movieId) {
            setSelectedMovieId(null);
            setSelectedShowIds([]);
        } else {
            setSelectedMovieId(movieId);
            // Pre-select all show times for this movie by default for convenience
            const movieShows = shows.filter((s) => s.movie?._id === movieId);
            setSelectedShowIds(movieShows.map((s) => s._id));
        }
    };

    const toggleShowSelection = (showId) => {
        setSelectedShowIds((prev) =>
            prev.includes(showId) ? prev.filter((id) => id !== showId) : [...prev, showId]
        );
    };

    const handleSelectAllForMovie = () => {
        const allIds = showsForSelectedMovie.map((s) => s._id);
        const isAllSelected = allIds.every((id) => selectedShowIds.includes(id));
        if (isAllSelected) {
            setSelectedShowIds((prev) => prev.filter((id) => !allIds.includes(id)));
        } else {
            setSelectedShowIds((prev) => Array.from(new Set([...prev, ...allIds])));
        }
    };

    const handleDelete = async () => {
        if (selectedShowIds.length === 0) {
            toast.error("Please select at least one show to delete");
            return;
        }

        const confirmMsg = `Are you sure you want to delete ${selectedShowIds.length} show(s)? They will be removed from website listings, but revenue earned will remain unaffected.`;
        if (!window.confirm(confirmMsg)) return;

        setIsDeleting(true);
        try {
            const { data } = await axios.post(
                '/api/admin/delete-show',
                { showIds: selectedShowIds },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );

            if (data.success) {
                toast.success(data.message || "Show(s) deleted successfully");
                setSelectedMovieId(null);
                setSelectedShowIds([]);
                await fetchAllShows();
            } else {
                toast.error(data.message || "Failed to delete show(s)");
            }
        } catch (err) {
            console.error("Delete show error:", err);
            toast.error(err.response?.data?.message || err.message || "Error deleting show");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <Loading />;
    }

    if (error && shows.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchAllShows}
                    className="bg-primary px-6 py-2 rounded text-white cursor-pointer hover:bg-primary/90"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <Title text1="Delete" text2="Shows" />

            <p className="mt-10 text-lg font-medium">Active Shows</p>
            {uniqueMovies.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">No active shows available to delete.</p>
            ) : (
                <div className="overflow-x-auto pb-4">
                    <div className="group flex flex-wrap gap-4 mt-4 w-max">
                        {uniqueMovies.map((movie) => (
                            <div
                                key={movie._id}
                                className="relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300"
                                onClick={() => handleMovieClick(movie._id)}
                            >
                                <div className="relative rounded-lg overflow-hidden">
                                    <img
                                        src={image_base_url + movie.poster_path}
                                        alt={movie.title}
                                        className="w-full object-cover brightness-90"
                                    />
                                    <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                                        <p className="flex items-center gap-1 text-gray-400">
                                            <StarIcon className="w-4 h-4 text-primary fill-primary" />
                                            {movie.vote_average?.toFixed(1) || "N/A"}
                                        </p>
                                        <p className="text-gray-300">
                                            {movie.vote_count ? `${kConverter(movie.vote_count)} Votes` : ""}
                                        </p>
                                    </div>
                                </div>
                                {selectedMovieId === movie._id && (
                                    <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded shadow-md">
                                        <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                                    </div>
                                )}
                                <p className="font-medium truncate mt-1">{movie.title}</p>
                                <p className="text-gray-400 text-sm">{movie.release_date}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Display Scheduled Showtimes for Selected Movie */}
            {selectedMovieId && showsForSelectedMovie.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2 max-w-xl">
                        <h2 className="font-medium">Scheduled Show Times</h2>
                        <button
                            type="button"
                            onClick={handleSelectAllForMovie}
                            className="text-xs text-primary hover:underline cursor-pointer"
                        >
                            {showsForSelectedMovie.every((s) => selectedShowIds.includes(s._id))
                                ? "Deselect All"
                                : "Select All Times"}
                        </button>
                    </div>
                    <ul className="space-y-3 max-w-xl">
                        {Object.entries(showsByDate).map(([date, dateShows]) => (
                            <li key={date}>
                                <div className="font-medium text-sm text-gray-300">{date}</div>
                                <div className="flex flex-wrap gap-2 mt-1.5 text-sm">
                                    {dateShows.map((show) => {
                                        const isSelected = selectedShowIds.includes(show._id);
                                        const timeStr = new Date(show.showDateTime).toLocaleTimeString([], {
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        });
                                        const occupiedCount = Object.keys(show.occupiedSeats || {}).length;

                                        return (
                                            <button
                                                key={show._id}
                                                type="button"
                                                onClick={() => toggleShowSelection(show._id)}
                                                className={`border px-3 py-1.5 flex items-center gap-2 rounded cursor-pointer transition text-xs sm:text-sm ${
                                                    isSelected
                                                        ? "border-primary bg-primary text-white"
                                                        : "border-gray-600 bg-transparent text-gray-300 hover:border-gray-400"
                                                }`}
                                            >
                                                <span>{timeStr}</span>
                                                <span className="opacity-80">
                                                    ({currency}{show.showPrice} • {occupiedCount} booked)
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Delete Show Button with same CSS as Add Show */}
            <button
                onClick={handleDelete}
                disabled={isDeleting || selectedShowIds.length === 0}
                className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isDeleting ? "Deleting..." : "Delete Show"}
            </button>
        </>
    );
};

export default DeleteShow;
