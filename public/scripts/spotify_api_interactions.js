import { env } from 'node:process';

export function refreshAccessToken() {
	$.get({
		url: '/refresh_token',
	});
}

function getGenres(track, artist) {
	$.get({
		url: '/get_genres', // TODO correct string
		data: {
			track: track,
			artist: artist, // TODO rethink necessity
		},
		success: (data) => { } //TODO implement new genre getting
	})
}

function gatherTrackInformation(data) {
	env.TRACK_NAME = data.item.name;
	env.TRACK_ARTISTS = data.item.artists.join(', ');

	try {
		getGenres(); // TODO create
	}
	catch {
		console.log('Error fetching genres');
	}
	finally {
		// TODO place track infos into html via track template
		// infoPlaceholder.innerHTML = infoTemplate({
		// 	track: info_track,
		// 	artists: artistsnames,
		// });
	}
}

export function getCurrentlyPlayingTrack() {
	return $.get({
		url: 'https://api.spotify.com/v1/me/player',
		headers: {
			'Authorization': `Bearer ${access_token}`,
			'Content-Type': 'application/json',
		},
		success: gatherTrackInformation,
		error: refreshAccessToken,
	})
}