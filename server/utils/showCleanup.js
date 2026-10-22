import Show from "../model/Show.js";
import Movie from "../model/Movie.js";
import Booking from "../model/Booking.js";

/**
 * 1. Automatically marks shows as deleted (isDeleted: true) once the show has ended
 *    (i.e. when current time >= showDateTime + movie.runtime).
 * 2. Reconciles show.occupiedSeats: Removes any seat from show.occupiedSeats that does not
 *    have a corresponding paid booking (cleans up abandoned/failed checkout artifacts).
 */
export const cleanupEndedShows = async () => {
  try {
    const now = new Date();
    const activeShows = await Show.find({ isDeleted: { $ne: true } }).populate('movie');

    const endedShowIds = [];
    for (const show of activeShows) {
      const runtimeMinutes = show.movie?.runtime || 0;
      const endTime = new Date(show.showDateTime.getTime() + runtimeMinutes * 60 * 1000);
      if (now >= endTime) {
        endedShowIds.push(show._id);
        continue;
      }

      // Reconcile occupied seats against actual paid bookings
      const occupiedSeatKeys = Object.keys(show.occupiedSeats || {});
      if (occupiedSeatKeys.length > 0) {
        const paidBookings = await Booking.find({
          show: show._id.toString(),
          isPaid: true
        });
        const paidSeatsSet = new Set(paidBookings.flatMap((b) => b.bookedSeats || []));

        let hasOrphanedSeats = false;
        for (const seat of occupiedSeatKeys) {
          if (!paidSeatsSet.has(seat)) {
            delete show.occupiedSeats[seat];
            hasOrphanedSeats = true;
          }
        }

        if (hasOrphanedSeats) {
          show.markModified('occupiedSeats');
          await show.save();
        }
      }
    }

    if (endedShowIds.length > 0) {
      await Show.updateMany(
        { _id: { $in: endedShowIds } },
        { $set: { isDeleted: true } }
      );
    }
  } catch (error) {
    console.error("Error running cleanupEndedShows:", error.message);
  }
};
