/**
 * This is the GenreGetter node.js backend.
 * It performs the Authorization Code oAuth2 flow 
 * to authenticate against the Spotify Account API.
 * It also performs the getting of genres for the
 * currently playing song.
 */

//#region Imports

import { $ } from './external_scripts/jquery-3.7.1.min';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

//#endregion

//#region Global variables
const CLIENT_ID = '71fef7bf04154244983a0f920c1c4064'
const CLIENT_SECRET = '********'
const ENCODED_CREDENTIALS = new Buffer
    .from(`${CLIENT_ID}:${CLIENT_SECRET}`)
    .toString('base64');
const AUTH_STATE_KEY = 'spotify_auth_state';

const SERVER_PORT = 8383
const REDIRECT_URI = `http://localhost:${SERVER_PORT}/callback`;
//#endregion

// TODO move utility functions to separate file
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
    var text = '';
    var possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

/**
 * Handles incoming errors.
 * Sends errors to view as query parameter.
 */
function errorHandler(error, response) {
    response.redirect(`/#error=${error}`);
}

const app = express();

app.use([
    express.static('/public'),
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
            client_id: CLIENT_ID,
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

        errorHandler('state_mismatch', response);
    }

    const returnedError = request?.query?.error;

    if (returnedError) {

        errorHandler(returnedError, response)
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
            // send access and refresh token to view as query parameters
            response.redirect('/#' +
                new URLSearchParams({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                }).toString()
            );
        },
        error: function (xhr) {
            errorHandler(`${xhr.status}_${xhr.statusText}`, response);
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
            // send access and refresh token to view as query parameters
            response.redirect('/#' +
                new URLSearchParams({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                }).toString()
            );
        },
        error: function (xhr) {
            errorHandler(`${xhr.status}_${xhr.statusText}`, response);
        },
    });
});
//#endregion

//#region Spotify genres
app.get('/get_genres', function (req, res) {
    // TODO develop new genre flow via recommendations
    var options = {
        url: "https://ws.audioscrobbler.com/2.0/?" +
            new URLSearchParams({
                method: "track.gettoptags",
                artist: req.query.artist,
                track: req.query.track,
                autocorrect: "1",
                api_key: lastfm_api_key,
                format: "json",
            }),
    };
    if (req.query.artist && req.query.track) {
        get(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var jsonbody = JSON.parse(body);

                var genres = jsonbody.toptags.tag;
                res.send({
                    genres: genres,
                });
            }
        });
    } else {
        res.status(400).send("Bad Request");
    }
});
//#endregion

app.listen(SERVER_PORT);