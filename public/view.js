import { getCurrentlyPlayingTrack, refreshAccessToken } from './scripts/spotify_api_interactions';

import TrackTemplate from './templates/track.handlebars';
import UserTemplate from './templates/user.handlebars';
import { env } from 'node:process';

const REFRESH_INTERVAL = 1000 // ms

// Get important document elements
const initialView = document.getElementById('initialView');
const functionalView = document.getElementById('functionalView');
const userContainer = document.getElementById('userContainer');
const trackContainer = document.getElementById('infoContainer');

async function update() {
	// TODO show loading text while not handled User Profile success
	if (env.CONNECTED) {
		initialView.hide();
		functionalView.show();

		userContainer.innerHTML = UserTemplate({
			display_name: env.DISPLAY_NAME
		});

		await getCurrentlyPlayingTrack();
		trackContainer.innerHTML = TrackTemplate({
			track: env.TRACK_NAME,
			artists: env.TRACK_ARTISTS,
			genres: env.TRACK_GENRES
		});
	}
	else {
		initialView.show();
		functionalView.hide();
	}
}

function handleUserProfileSuccess(data) {
	env.DISPLAY_NAME = data.display_name;
	env.CONNECTED = true;
}

function main() {
	const { access_token, refresh_token, error } = getHashParameters();
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
			success: handleUserProfileSuccess
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