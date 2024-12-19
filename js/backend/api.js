/**
 * This is the GenreGetter node.js backend.
 * It performs the Authorization Code oAuth2 flow 
 * to authenticate against the Spotify Account API.
 * It also performs the getting of genres for the
 * currently playing track.
 */

//#region Imports

import { generateRandomString, handleAuthorizationSuccess, handleError } from '../utility.js';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import $ from 'jquery';

//#endregion

//#region Global variables
const SPOTIFY_CLIENT_ID = '71fef7bf04154244983a0f920c1c4064';
const SPOTIFY_CLIENT_SECRET = '********';
const ENCODED_CREDENTIALS = new Buffer
    .from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
    .toString('base64');
const AUTH_STATE_KEY = 'spotify_auth_state';

const LASTFM_API_KEY = '53a170f816b7dc8552d657154a07c672';

export const PORT = 8383;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
//#endregion

export const api = express();

api.use([
    express.static('.'),
    cors(),
    cookieParser()
]);

//#region Spotify authentication
/**
 * Initiate standard Spotify authentication flow.
 * Stores authorization state as a cookie.
 */
api.get('/login', function (request, response) {

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
api.get('/callback', function (request, response) {

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
api.get('/refresh_token', function (request, response) {

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
 * Request Spotify profile information using access token.
 */
api.get('/profile_information', function (request, response) {

    $.get({
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': `Bearer ${access_token}`,
        },
        success: function (data) {
            response.send(data);
        }
    });
});

/**
 * Request Spotify current track information using access token.
 */
api.get('/track_information', function (request, response) {

    $.get({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {
            'Authorization': `Bearer ${env.ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        success: function (data) {
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
api.get('/get_genres', function (request, response) {
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

api.listen(PORT, function () {
    console.log(`listening on http://localhost:${PORT}`);
});