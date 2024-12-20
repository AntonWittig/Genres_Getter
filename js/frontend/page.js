//#region Imports

import { filterGenres, getHashParameters } from '../utility';
import { getCurrentlyPlayingTrack, getProfileInformation, refreshAccessToken } from './scripts/spotify_api_interactions';

import { env } from 'node:process';
import NoTrackTemplate from './templates/no-track.handlebars';
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

		if (trackInformation?.is_playing) {

			env.TRACK_NAME = trackInformation.name;
			env.TRACK_ARTISTS = trackInformation.artists.join(', ');
			env.TRACK_GENRES = filterGenres(trackInformation.genres).join(', ');
			env.TRACK_IMAGE_URL = trackInformation.images[0].url;

			trackContainer.innerHTML = TrackTemplate({
				track: env.TRACK_NAME,
				artists: env.TRACK_ARTISTS,
				genres: env.TRACK_GENRES.length > 0 ? env.TRACK_GENRES : DEFAULT_GENRES_MESSAGE,
				imageUrl: env.TRACK_IMAGE_URL,
			});
		}
		else {
			trackContainer.innerHTML = NoTrackTemplate();
		}
	}
	else {
		initialView.show();
		functionalView.hide();
	}
}

/**
 * Runs on startup, authorization success, or backend request error.
 */
async function main() {
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

		await getProfileInformation();
		updateInterval = setInterval(update, REFRESH_INTERVAL);
	} else {
		// not logged in yet, render initial screen
		env.CONNECTED = false;
		window.clearInterval(updateInterval);
	}

	update();
}

await main();
//#endregion