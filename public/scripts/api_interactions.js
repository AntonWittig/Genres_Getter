import { env } from 'node:process';

/**
 * Requests the backend to request the genres of a track.
 * @param {Map<string>} trackInformation The default Spotify track information
 * @returns The Spotify track information combined with the genres if they could fetched
 */
module.exports.getGenres = async function (trackInformation) {
	await $.get({
		url: '/get_genres',
		/**
		 * Adds the genres array to the track information Map
		 * @param {Map<string>} data The response body of the API request
		 */
		success: function (data) {
			if (data?.genres.length > 0)
				trackInformation.genres = data.genres;
		}
	});

	return trackInformation;
}

/**
 * Requests the backend to request the information of the currently played track.
 * @returns The Spotify track information ombined with the genres if they could fetched
 */
module.exports.getCurrentlyPlayingTrack = async function () {
	let trackInformation = {};

	await $.get({
		url: '/track_information',
		/**
		 * Initiates requesting of genres, if a new track is played.
		 * @param {Map<string>} data The response body of the API request
		 */
		success: async function (data) {
			// Abort if no track is playing
			if (!data.is_playing) {
				trackInformation = { is_playing: false };
				return;
			}

			// Abort if track information is already known
			if (data.item.name === env.TRACK_NAME &&
				data.item.artists.join(', ') === env.TRACK_ARTISTS)
				return;

			trackInformation = await getGenres(data.item);
			trackInformation.is_playing = true;
		},
		error: refreshAccessToken,
	})

	return trackInformation;
}

/**
 * Requests the backend to request a new access token.
 */
module.exports.refreshAccessToken = function () {
	$.get({
		url: '/refresh_token',
	});
}