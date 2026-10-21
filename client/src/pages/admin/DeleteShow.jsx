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

    const selectedShows = shows.filter((s) => selectedShowIds.includes(s._id));
    const totalBookedSeats = selectedShows.reduce(
        (sum, s) => sum + Object.keys(s.occupiedSeats || {}).length,
        0
    );

    return (
        <div className="space-y-8 max-w-7xl">
            <Title text1="Delete" text2="Shows" />

            {/* STEP 1: Full-Width 6-Column Responsive Active Shows Grid */}
            <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
                            <span>Step 1: Select Show Listings to Delete</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700 font-normal">
                                {shows.length} Active Listings
                            </span>
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Click individual show cards to select specific dates and times for deletion.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {shows.length > 0 && (
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs px-3.5 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition cursor-pointer font-medium"
                            >
                                {selectedShowIds.length === shows.length ? "Deselect All" : "Select All"}
                            </button>
                        )}
                        <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full font-medium">
                            {selectedShowIds.length} listings selected
                        </span>
                    </div>
                </div>

                {shows.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 text-center text-sm text-gray-400">
                        No active show listings available to delete.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {shows.map((show) => {
                            const isSelected = selectedShowIds.includes(show._id);
                            const occupiedCount = Object.keys(show.occupiedSeats || {}).length;

                            return (
                                <div
                                    key={show._id}
                                    className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                                        isSelected
                                            ? "ring-2 ring-primary bg-primary/10 shadow-xl shadow-primary/20"
                                            : "border border-gray-800 bg-gray-900/60 hover:border-gray-600"
                                    }`}
                                    onClick={() => toggleShowSelection(show._id)}
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden">
                                        <img
                                            src={image_base_url + show.movie?.poster_path}
                                            alt={show.movie?.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>

                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-md z-10">
                                                <CheckIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            </div>
                                        )}

                                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                                                <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                {show.movie?.vote_average?.toFixed(1) || "N/A"}
                                            </span>
                                            <span className="text-white font-bold bg-black/60 px-1.5 py-0.5 rounded text-[11px]">
                                                {currency}{show.showPrice}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <p className={`font-semibold text-xs truncate ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                                            {show.movie?.title}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-[11px] text-primary font-medium">
                                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{dateFormat(show.showDateTime)}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {occupiedCount} / 90 booked
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* STEP 2: Full-Width 3-Column Deletion Command Deck */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                        <span>Step 2: Review Deletion Impact & Execute</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Review selected listings, customer refund impact, and delete from active schedule
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* CARD 1: Selected Target Spotlight / Queue */}
                    <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b border-gray-800">
                                <span className="flex items-center gap-1.5 text-white">
                                    <span>🎯</span> Marked For Deletion
                                </span>
                                <span className="text-xs text-primary font-mono">
                                    {selectedShows.length} Listings Selected
                                </span>
                            </div>

                            {selectedShows.length > 0 ? (
                                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                                    {selectedShows.map((s) => (
                                        <div key={s._id} className="flex items-center gap-3 p-2 bg-gray-950/80 rounded-xl border border-gray-800">
                                            <img
                                                src={image_base_url + s.movie?.poster_path}
                                                alt={s.movie?.title}
                                                className="w-8 h-12 object-cover rounded-md shrink-0 border border-gray-700"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-white truncate">{s.movie?.title}</p>
                                                <p className="text-[11px] text-primary truncate">
                                                    {dateFormat(s.showDateTime)} • {currency}{s.showPrice}
                                                </p>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 shrink-0">
                                                {Object.keys(s.occupiedSeats || {}).length} booked
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 rounded-xl border border-dashed border-gray-700 text-center text-xs text-gray-500">
                                    <p className="text-xl mb-1">👆</p>
                                    <p className="font-medium text-gray-300">No show listings selected</p>
                                    <p className="mt-1">Click show cards in Step 1 above</p>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 pt-4 border-t border-gray-800/80 mt-4">
                            💡 Other showtimes for these movies will remain completely unaffected.
                        </p>
                    </div>

                    {/* CARD 2: Impact & Customer Refund Policy */}
                    <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md space-y-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-800 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <span>🛡️</span> Customer Notification & Refund
                            </span>
                            <span className="text-emerald-400 text-xs font-mono">Automated</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Total Booked Seats:</span>
                                <span className="font-bold text-primary text-sm">{totalBookedSeats} Seats</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Selected Listings:</span>
                                <span className="font-bold text-white text-sm">{selectedShows.length} Shows</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed">
                            <span>📧</span> Deleting these listings automatically dispatches cancellation emails with refund initiation links to all affected ticket holders.
                        </p>
                    </div>

                    {/* CARD 3: Action Controls & Delete Submit CTA */}
                    <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-800 mb-3">
                                <span className="flex items-center gap-1.5">
                                    <span>⚙️</span> Deletion Actions
                                </span>
                                {selectedShowIds.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedShowIds([])}
                                        className="text-xs text-gray-400 hover:text-white transition cursor-pointer"
                                    >
                                        Clear Selection
                                    </button>
                                )}
                            </div>

                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-gray-300 space-y-1.5">
                                <p className="font-semibold text-primary">Confirm Deletion</p>
                                <p className="text-[11px] text-gray-400">
                                    This action permanently removes the selected time slots from the public booking catalog.
                                </p>
                            </div>
                        </div>

                        {/* Submit CTA */}
                        <div className="pt-4 border-t border-gray-800 mt-4">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || selectedShowIds.length === 0}
                                className="w-full py-3.5 px-6 bg-primary hover:bg-primary/90 active:scale-98 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <span>Deleting...</span>
                                ) : (
                                    <>
                                        <span>🗑️</span>
                                        <span>
                                            {selectedShowIds.length > 0
                                                ? `Delete ${selectedShowIds.length} Show Listing${selectedShowIds.length > 1 ? "s" : ""}`
                                                : "Select Shows to Delete"}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default DeleteShow;
