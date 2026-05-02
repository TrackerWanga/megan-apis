const { getSpotifyToken } = require('./totp');
getSpotifyToken()
  .then(token => { process.stdout.write(JSON.stringify({ token })); })
  .catch(e => { process.stdout.write(JSON.stringify({ error: e.message })); });
