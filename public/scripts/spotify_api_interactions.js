import { env } from "node:process";

function refreshAccessToken() {
	$.get({
		url: "/refresh_token", // TODO correct string
		data: { refresh_token: env.REFRESH_TOKEN }, // TODO correct string
		success: (data) => env.ACCESS_TOKEN = data.access_token
	});
}

function getGenres(track, artist) {
	$.get({
		url: "/get_genres", // TODO correct string
		data: {
			track: track,
			artist: artist, // TODO rethink necessity
		},
		success: () => { } //TODO implement new genre getting
	})
}

function gatherTrackInformation(data) {
	env.TRACK_NAME = data.item.name;
	env.TRACK_ARTISTS = data.item.artists.join(", ");

	try {
		getGenres(); // TODO create
	}
	catch {
		console.log("Error fetching genres");
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
	return $.ajax({
		type: "GET",
		url: "https://api.spotify.com/v1/me/player",
		headers: {
			Authorization: "Bearer " + access_token,
			"Content-Type": "application/json",
		},
		success: gatherTrackInformation,
		error: refreshAccessToken
	})
}