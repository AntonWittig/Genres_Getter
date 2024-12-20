//#region Global variables
const SHOW_GENRE_AMOUNT = 5;
const SUPPORTED_GENRES = Object.freeze([
	'acoustic', 'alternative', 'ambient', 'blues',
	'chill', 'classical', 'commedy', 'core',
	'country', 'dance', 'disco', 'dubstep',
	'easy listening', 'electro', 'emo', 'folk',
	'funk', 'grunge', 'hard', 'heavy',
	'hip-hop', 'house', 'indie', 'instrumental',
	'jazz', 'kpop', 'latin', 'lo-fi',
	'lullaby', 'metal', 'pop', 'polka',
	'progressive', 'punk', 'rap', 'reggae',
	'religious', 'rock', 'rnb', 'soul',
	'swing', 'vocal', 'wave', 'world',
])
//#endregion

//#region General functions
/**
 * Obtains parameters from the hash of the current URL.
 * @param {string} hash The hash from which the parameters are extracted
 * @returns {object} The hash parameters
 */
export function getHashParameters(hash) {
	const parameters = {};
	const parameterFilter = new RegExp(/([^&;=]+)=?([^&;]*)/, "g");
	const pureHashContent = hash.substring(1);

	let match;
	while ((match = parameterFilter.exec(pureHashContent))) {
		parameters[match[1]] = decodeURIComponent(match[2]);
	}
	return parameters;
}

/**
 * Generates a random string containing numbers and letters of a specified length.
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
export function generateRandomString(length) {
	let text = '';
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

/**
 * Filters the supplied music genres for matches with the supported music genres.
 * @param {string[]} genres The original music genres
 * @returns {string[]} The filtered music genres
 */
export function filterGenres(genres) {
	genres = genres.map((genre) => genre.name.toLowerCase());

	const filteredGenres = [];
	for (const genre of genres) {

		// Check if any of the supported genres are contained in the genre
		const containsSupportedGenre = SUPPORTED_GENRES.some(
			(supported_genre) => genre.includes(supported_genre));

		// Add genre only if its not a duplicate 
		if (containsSupportedGenre &&
			!filteredGenres.includes(genre))
			filteredGenres.push(genre);

		if (filteredGenres.length >= SHOW_GENRE_AMOUNT)
			break;
	}

	return filteredGenres;
}

/**
 * Handles incoming errors.
 * Sends errors to view as query parameter.
 * @param {*} error The error that has occured
 * @param {*} response The response to the initial API request
 */
export function handleError(error, response) {
	response.redirect(`/#error=${error}`);
}

/**
 * Sends access and refresh token to view as query parameters.
 * @param {object} data The response body of the API request
 * @param {*} response The response to the initial API request
 */
export function handleAuthorizationSuccess(data, response) {
	response.redirect('/#' +
		new URLSearchParams({
			access_token: data.access_token,
			refresh_token: data.refresh_token,
		}).toString()
	);
}
//#endregion