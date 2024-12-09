//#region Imports

import { getCurrentlyPlayingTrack, refreshAccessToken } from './scripts/spotify_api_interactions';

import { env } from 'node:process';
import TrackTemplate from './templates/track.handlebars';
import UserTemplate from './templates/user.handlebars';

//#endregion

//#region Global variables
const REFRESH_INTERVAL = 1000; // ms
const DEFAULT_GENRES_MESSAGE = 'No genres found';

// Get important document elements
const initialView = document.getElementById('initialView');
const functionalView = document.getElementById('functionalView');
const userContainer = document.getElementById('userContainer');
const trackContainer = document.getElementById('infoContainer');
//#endregion

//#region App flow
/**
 * Runs every REFRESH_INTERVAL milliseconds and initiates visual and content updates.
 */
async function update() {
	if (env.CONNECTED) {
		initialView.hide();
		functionalView.show();

		userContainer.innerHTML = UserTemplate({
			display_name: env.DISPLAY_NAME
		});

		const trackInformation = await getCurrentlyPlayingTrack();

		// TODO also include track cover
		env.TRACK_NAME = trackInformation.name;
		env.TRACK_ARTISTS = trackInformation.artists.join(', ');
		env.TRACK_GENRES = filterGenres(trackInformation.genres).join(', ');

		trackContainer.innerHTML = TrackTemplate({
			track: env.TRACK_NAME,
			artists: env.TRACK_ARTISTS,
			genres: env.TRACK_GENRES.length > 0 ? env.TRACK_GENRES : DEFAULT_GENRES_MESSAGE,
		});
	}
	else {
		initialView.show();
		functionalView.hide();
	}
}

/**
 * Runs once the site is refreshed/loaded.
 */
function main() {
	// TODO figure out how to best skip this on reload
	const { access_token, refresh_token, error } = getHashParameters(window.location.hash);
	env.ACCESS_TOKEN = access_token;
	env.REFRESH_TOKEN = refresh_token;

	let updateInterval;

	switch (error) {
		case 'invalid_token':
			refreshAccessToken()
			break;
		case undefined:
			break;

		default:
			alert(`There was an error during the authentication: ${error}`);
			return;
	}

	if (access_token) {
		// logged in, start up getting genres
		$.get({
			url: 'https://api.spotify.com/v1/me',
			headers: {
				'Authorization': `Bearer ${access_token}`,
			},
			/**
			 * 
			 * @param {*} data 
			 */
			success: function (data) {
				env.DISPLAY_NAME = data.display_name;
				env.CONNECTED = true;
			}
		});
		updateInterval = setInterval(update, REFRESH_INTERVAL);
	} else {
		// not logged in yet, render initial screen
		env.CONNECTED = false;
		window.clearInterval(updateInterval);
	}

	update();
}

main();
//#endregion