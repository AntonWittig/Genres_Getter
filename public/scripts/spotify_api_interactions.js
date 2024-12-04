import { env } from 'node:process';

const SHOW_GENRE_AMOUNT = 5;
const SUPPORTED_GENRES = Object.freeze([
	'acoustic',
	'alternative',
	'ambient',
	'blues',
	'chill',
	'classical',
	'commedy',
	'core',
	'country',
	'dance',
	'disco',
	'dubstep',
	'easy listening',
	'electro',
	'emo',
	'folk',
	'funk',
	'grunge',
	'hard',
	'heavy',
	'hip-hop',
	'house',
	'indie',
	'instrumental',
	'jazz',
	'kpop',
	'latin',
	'lo-fi',
	'lullaby',
	'metal',
	'pop',
	'polka',
	'progressive',
	'punk',
	'rap',
	'reggae',
	'religious',
	'rock',
	'rnb',
	'soul',
	'swing',
	'vocal',
	'wave',
	'world',
])

export function refreshAccessToken() {
	$.get({
		url: '/refresh_token',
	});
}

function filterGenres(genres) {
	genres = genres.map((genre) => genre.name.toLowerCase());
	genres = genres.flat();

	const filteredGenres = [];
	for (const genre of genres) {
		if (SUPPORTED_GENRES.some((supported_genre) => genre.includes(supported_genre)) &&
			!filteredGenres.includes(genre)) {

			filteredGenres.push(genre);
		}
	}

	return filteredGenres;
}

function gatherTrackInformation(data) {
	if (data.item.name === env.TRACK_NAME &&
		data.item.artists.join(', ') === env.TRACK_ARTISTS) {

		return;
	}

	env.TRACK_NAME = data.item.name;
	env.TRACK_ARTISTS = data.item.artists.join(', ');

	$.get({
		url: '/get_genres',
		success: function (data) {
			if (data?.genres &&
				data.genres.length > 0) {

				const genres = filterGenres(data.genres);
				genres.splice(SHOW_GENRE_AMOUNT);
				env.TRACK_GENRES = genres.join(', ');
			}
		}
	});
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