import Show from "../model/Show.js";

/**
 * Automatically marks shows as deleted (isDeleted: true) once the show has ended
 * (i.e. when current time >= showDateTime + movie.runtime).
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
