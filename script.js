/* https://glitch.com/~spotify-fetch */

const SCOPES = [
	'user-read-currently-playing',
	'user-read-playback-state',
	'user-modify-playback-state',
];
const CLIENT_ID = '55241705cb7544cebe06e969f181539b';
const REDIRECT_URI =
	'https://jonasjohansson.github.io/spotify-create-playlist/';

let accessToken;

const tracklist = document.querySelector('#tracklist');
const trimlist = document.querySelector('#trimlist');
const playlist = document.querySelector('#playlist');
const connectButton = document.querySelector('#connectButton');
const getButton = document.querySelector('#getButton');

connectButton.addEventListener('click', function () {
	accessToken = getAccessToken();
});

var tracks = [];
var fetchCounter = 0;

window.trimList = function () {
	var lines = tracklist.value.split('\n');

	trimlist.value = '';

	for (let i = 0; i < lines.length; i++) {
		lines[i] = lines[i].replace('&', ''); // remove ampersands
		lines[i] = lines[i].replace(/-/g, ''); // remove hypens
		lines[i] = lines[i].replace(/\s*\(.*?\)\s*/g, ''); // remove ()
		lines[i] = lines[i].replace(/\s*\[.*?\]\s*/g, ''); // remove []
		n = lines[i].indexOf('feat');
		lines[i] = lines[i].substring(0, n != -1 ? n : lines[i].length);
		lines[i] = lines[i].trim(); // remove whitespace
	}

	// loop through lines, skip the header data and only look at every third group
	for (let i = 0; i < lines.length - 1; i = i + 3) {
		let track = lines[i + 1].toLowerCase();
		let artist = lines[i + 2].toLowerCase();

		// if either the track or the artist has yet to be identified, skip!
		if (track === '') i--;
		if (artist === '') i--;
		if (
			track === 'id' ||
			artist === 'id' ||
			track === 'unknown' ||
			artist === 'unknown'
		) {
			continue;
		}
		trimlist.value += artist + ' ' + track + '\r\n';
	}
};

window.getTracks = () => {
	// get lines from textarea
	tracks = trimlist.value.split('\n');

	// start counter from 0
	fetchCounter = 0;

	// reset playlist entries
	playlist.value = '';
	// tracklist.value = '';

	// fetch each track from the Spotify API
	fetchTrack(tracks[fetchCounter]);
};

const fetchTrack = (term) => {
	// tracklist.value += term + '\n';
	fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.then((data) => {
			// check if the search found something
			if (data.tracks !== undefined && data.tracks.items.length > 0) {
				// get the track object from the first search hit
				let track = data.tracks.items[0];

				// log it out!
				console.log(track);

				// add the track URI to the playlist textarea
				playlist.value += `${track.uri}\n`;
			}
			// increase the counter, and check if there are still tracks in the list
			if (++fetchCounter < tracks.length) {
				// iterate
				fetchTrack(tracks[fetchCounter]);
			}
		});
};

function getAccessToken() {
	if (accessToken) {
		return accessToken;
	}

	const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
	const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
	if (accessTokenMatch && expiresInMatch) {
		accessToken = accessTokenMatch[1];
		const expiresIn = Number(expiresInMatch[1]);
		window.setTimeout(() => (accessToken = ''), expiresIn * 1000);
		window.history.pushState('Access Token', null, '/'); // This clears the parameters, allowing us to grab a new access token when it expires.
		getButton.disabled = false;

		return accessToken;
	} else {
		const accessUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&scope=${SCOPES.join(
			'%20'
		)}&redirect_uri=${REDIRECT_URI}`;
		window.location = accessUrl;
	}
}
