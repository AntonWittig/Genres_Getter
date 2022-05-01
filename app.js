/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require("express"), // Express web server framework
    request = require("request"), // "Request" library
    cors = require("cors"),
    cookieParser = require("cookie-parser");
const { json } = require("express/lib/response");

var spotify_client_id = "71fef7bf04154244983a0f920c1c4064", // Your client id
    spotify_client_secret = "client secret", // Your secret
    lastfm_api_key = "53a170f816b7dc8552d657154a07c672",
    lastfm_shared_secret = "shared secret",
    port = 8383, // Port to listen on
    redirect_uri = "http://localhost:" + port + "/callback"; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
    var text = "";
    var possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = "spotify_auth_state";

var app = express();

app
    .use(express.static(__dirname + "/public"))
    .use(cors())
    .use(cookieParser());

app.get("/login", function(req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = "user-read-playback-state";
    res.redirect(
        "https://accounts.spotify.com/authorize?" +
        new URLSearchParams({
            response_type: "code",
            client_id: spotify_client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
        }).toString()
    );
});

app.get("/callback", function(req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect(
            "/#" +
            new URLSearchParams({
                error: "state_mismatch",
            }).toString()
        );
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: "https://accounts.spotify.com/api/token",
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: "authorization_code",
            },
            headers: {
                Authorization: "Basic " +
                    Buffer.from(spotify_client_id + ":" + spotify_client_secret).toString(
                        "base64"
                    ),
            },
            json: true,
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
                    url: "https://api.spotify.com/v1/me",
                    headers: { Authorization: "Bearer " + access_token },
                    json: true,
                };

                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect(
                    "/#" +
                    new URLSearchParams({
                        access_token: access_token,
                        refresh_token: refresh_token,
                    }).toString()
                );
            } else {
                res.redirect(
                    "/#" +
                    new URLSearchParams({
                        error: "invalid_token",
                    }).toString()
                );
            }
        });
    }
});

app.get("/refresh_token", function(req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
            Authorization: "Basic " +
                Buffer.from(spotify_client_id + ":" + spotify_client_secret).toString(
                    "base64"
                ),
        },
        form: {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        },
        json: true,
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                access_token: access_token,
            });
            res.redirect(
                "/#" +
                new URLSearchParams({
                    access_token: access_token,
                    refresh_token: refresh_token,
                }).toString()
            );
        }
    });
});

app.get("/get_genres", function(req, res) {
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
        request.get(options, function(error, response, body) {
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

console.log("Listening on " + port);
app.listen(port);