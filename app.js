/**
 * This is the GenreGetter node.js backend.
 * It performs the Authorization Code oAuth2 flow 
 * to authenticate against the Spotify Account API.
 * It also performs the getting of genres for the
 * currently playing track.
 */

//#region Imports

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { $ } from './external_scripts/jquery-3.7.1.min';
import { generateRandomString } from './public/scripts/utility';

//#endregion

//#region Global variables
const SPOTIFY_CLIENT_ID = '71fef7bf04154244983a0f920c1c4064';
const SPOTIFY_CLIENT_SECRET = '********';
const ENCODED_CREDENTIALS = new Buffer
    .from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
    .toString('base64');
const AUTH_STATE_KEY = 'spotify_auth_state';

const LASTFM_API_KEY = '53a170f816b7dc8552d657154a07c672';

const PORT = 8383;
module.exports.PORT = PORT;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
//#endregion

/**
 * Handles incoming errors.
 * Sends errors to view as query parameter.
 * @param {*} error The error that has occured
 * @param {*} response The response to the initial API request
 */
function handleError(error, response) {
    response.redirect(`/#error=${error}`);
}

/**
 * Sends access and refresh token to view as query parameters.
 * @param {Map<string>} data The response body of the API request
 * @param {*} response The response to the initial API request
 */
function handleAuthorizationSuccess(data, response) {
    response.redirect('/#' +
        new URLSearchParams({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
        }).toString()
    );
}

const app = express();

app.use([
    express.static('public'),
    cors(),
    cookieParser()
]);

//#region Spotify authentication
/**
 * Initiate standard Spotify authentication flow.
 * Stores authorization state as a cookie.
 */
app.get('/login', function (request, response) {

    const state = generateRandomString(16);
    const scope = 'user-read-playback-state';

    response.cookie(AUTH_STATE_KEY, state);

    response.redirect(
        'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: REDIRECT_URI,
            state: state,
        }).toString()
    );
});

/**
 * Handle Spotify authentication callback.
 * Assert state equality and handle authentication errors.
 */
app.get('/callback', function (request, response) {

    const returnedState = request?.query?.state;
    const originalState = request?.cookies[AUTH_STATE_KEY];

    if (returnedState === undefined ||
        returnedState !== originalState) {

        handleError('state_mismatch', response);
    }

    const returnedError = request?.query?.error;

    if (returnedError) {

        handleError(returnedError, response)
    }

    response.clearCookie(AUTH_STATE_KEY);

    const authorizationCode = request?.query?.code;

    // request access and refresh token using authorization code
    $.post({
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${ENCODED_CREDENTIALS}`,
        },
        data: {
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: REDIRECT_URI,
        },
        success: function (data) {
            handleAuthorizationSuccess(data, response);
        },
        error: function (xhr) {
            handleError(`${xhr.status}_${xhr.statusText}`, response);
        },
    });
});

/**
 * Request access token using refresh token.
 */
app.get('/refresh_token', function (request, response) {

    $.post({
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${ENCODED_CREDENTIALS}`,
        },
        data: {
            grant_type: 'refresh_token',
            refresh_token: env.REFRESH_TOKEN,
        },
        success: function (data) {
            handleAuthorizationSuccess(data, response);
        },
        error: function (xhr) {
            handleError(`${xhr.status}_${xhr.statusText}`, response);
        },
    });
});

/**
 * Request Spotify current track information using access token.
 */
app.get('/track_information', function (request, response) {

    $.get({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {
            'Authorization': `Bearer ${env.ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        success: async function (data) {
            response.send(data);
        },
        error: function (xhr) {
            handleError(`${xhr.status}_${xhr.statusText}`, response);
        },
    })
});
//#endregion

//#region lastfm genres
/**
 * Request Lastfm tags/genres for currently playing track.
 */
app.get('/get_genres', function (request, response) {
    $.get({
        url: 'https://ws.audioscrobbler.com/2.0/?' +
            new URLSearchParams({
                method: 'track.gettoptags',
                artist: env.TRACK_ARTISTS,
                track: env.TRACK_NAME,
                autocorrect: "1",
                api_key: LASTFM_API_KEY,
                format: 'json',
            }),
        success: function (data) {
            response.send({ genres: data?.toptags?.tag });
        },
        error: function (xhr) {
            handleError(`${xhr.status}_${xhr.statusText}`, response);
        },
    });
});
//#endregion

app.listen(PORT, function () {
    console.log(`listening on http://localhost:${PORT}`);
});