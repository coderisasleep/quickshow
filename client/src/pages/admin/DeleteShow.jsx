import { useState, useEffect } from "react"
import Loading from "../../components/Loading";
import Title from "./Title";
import { CheckIcon, StarIcon, CalendarDays } from "lucide-react";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const DeleteShow = () => {
    const { axios, getToken, user, image_base_url, fetchShows } = useAppContext();
    const currency = import.meta.env.VITE_CURRENCY;

    const [shows, setShows] = useState([]);
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

    const toggleShowSelection = (showId) => {
        setSelectedShowIds((prev) =>
            prev.includes(showId) ? prev.filter((id) => id !== showId) : [...prev, showId]
        );
    };

    const handleSelectAll = () => {
        if (selectedShowIds.length === shows.length) {
            setSelectedShowIds([]);
        } else {
            setSelectedShowIds(shows.map((s) => s._id));
        }
    };

    const handleDelete = async () => {
        if (selectedShowIds.length === 0) {
            toast.error("Please select at least one show listing to delete");
            return;
        }

        const confirmMsg = `Are you sure you want to delete ${selectedShowIds.length} show listing(s)? Only these specific date/time listings will be removed. Other showtimes for the movie(s) and revenue earned will remain unaffected.`;
        if (!window.confirm(confirmMsg)) return;

        setIsDeleting(true);
        try {
            const { data } = await axios.post(
                '/api/admin/delete-show',
                { showIds: selectedShowIds },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );

            if (data.success) {
                toast.success(data.message || "Show listing(s) deleted successfully");
                setSelectedShowIds([]);
                await fetchAllShows();
                if (typeof fetchShows === 'function') {
                    await fetchShows();
                }
            } else {
                toast.error(data.message || "Failed to delete show listing(s)");
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

            <div className="flex items-center justify-between mt-10 max-w-5xl">
                <div>
                    <p className="text-lg font-medium">Active Show Listings</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Select specific date/time show listings to delete. The movie and its other showtimes remain active.
                    </p>
                </div>
                {shows.length > 0 && (
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-primary hover:underline cursor-pointer font-medium"
                    >
                        {selectedShowIds.length === shows.length ? "Deselect All" : "Select All"}
                    </button>
                )}
            </div>

            {shows.length === 0 ? (
                <p className="mt-6 text-sm text-gray-400">No active show listings available to delete.</p>
            ) : (
                <div className="overflow-x-auto pb-4">
                    <div className="group flex flex-wrap gap-5 mt-4 w-max">
                        {shows.map((show) => {
                            const isSelected = selectedShowIds.includes(show._id);
                            const occupiedCount = Object.keys(show.occupiedSeats || {}).length;

                            return (
                                <div
                                    key={show._id}
                                    className={`relative w-48 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-primary/10 border ${
                                        isSelected
                                            ? "border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20 brightness-105"
                                            : "border-primary/20 hover:border-primary/60 group-hover:not-hover:opacity-50"
                                    }`}
                                    onClick={() => toggleShowSelection(show._id)}
                                >
                                    <div className="relative h-56 w-full overflow-hidden">
                                        <img
                                            src={image_base_url + show.movie?.poster_path}
                                            alt={show.movie?.title}
                                            className="w-full h-full object-cover brightness-90"
                                        />
                                        <div className="text-xs flex items-center justify-between p-2 bg-black/75 w-full absolute bottom-0 left-0">
                                            <p className="flex items-center gap-1 text-gray-400">
                                                <StarIcon className="w-3.5 h-3.5 text-primary fill-primary" />
                                                {show.movie?.vote_average?.toFixed(1) || "N/A"}
                                            </p>
                                            <span className="text-gray-200 font-semibold">{currency}{show.showPrice}</span>
                                        </div>
                                    </div>

                                    {/* Selected Checkmark Badge (matching AddShow checkmark) */}
                                    {isSelected && (
                                        <div className="absolute top-2.5 right-2.5 flex items-center justify-center bg-primary h-6 w-6 rounded shadow-md z-10">
                                            <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                                        </div>
                                    )}

                                    <div className="p-3">
                                        <p className="font-semibold text-sm truncate text-white">{show.movie?.title}</p>
                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
                                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{dateFormat(show.showDateTime)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5">
                                            {occupiedCount} / 90 booked
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Delete Show Button with same CSS as Add Show */}
            <button
                onClick={handleDelete}
                disabled={isDeleting || selectedShowIds.length === 0}
                className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isDeleting ? "Deleting..." : `Delete Show${selectedShowIds.length > 0 ? ` (${selectedShowIds.length})` : ""}`}
            </button>
        </>
    );
};

export default DeleteShow;
