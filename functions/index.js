const functions = require("firebase-functions");
const fetch = require("node-fetch");
const cors = require("cors")({origin: true});

exports.placesTextSearch = functions.https.onRequest((req, res) => {
  // CORRECT: Load the key securely from the environment when the function is called.
  const GOOGLE_PLACES_API_KEY = functions.config().google.apikey;

  cors(req, res, async () => {
    const query = req.query.query;
    if (!query) {
      return res.status(400).send("Missing query param");
    }

    // CORRECT: Use the variable holding the secure key.
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      res.status(200).json(data);
    } catch (err) {
      console.error("Error fetching Google Places:", err);
      res.status(500).send("Server error");
    }
  });
});