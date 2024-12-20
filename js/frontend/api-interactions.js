import { env } from 'node:process';

/**
 * Requests the backend to request the information of the spotify user profile.
 */
export async function getProfileInformation() {
	$.get({
		url: '/profile_information',
		/**
		 * Set spotify user profile data to be displayed.
		 * @param {object} data The user profile data
		 */
		success: function (data) {
			env.DISPLAY_NAME = data.display_name;
			env.CONNECTED = true;
		}
	});
}

/**
 * Requests the backend to request the genres of a track.
 * @param {object} trackInformation The default Spotify track information
 * @returns {Promise<object>} The Spotify track information combined with the genres if they could fetched
 */
export async function getGenres(trackInformation) {
	await $.get({
		url: '/get_genres',
		/**
		 * Adds the genres array to the track information Map
		 * @param {object} data The response body of the API request
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
 * @returns {Promise<object>} The Spotify track information ombined with the genres if they could fetched
 */
export async function getCurrentlyPlayingTrack() {
	let trackInformation = {};

	await $.get({
		url: '/track_information',
		/**
		 * Initiates requesting of genres, if a new track is played.
		 * @param {object} data The response body of the API request
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
export function refreshAccessToken() {
	$.get({
		url: '/refresh_token',
	});
}