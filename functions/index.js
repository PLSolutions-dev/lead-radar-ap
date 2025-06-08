const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const axios = require("axios");

exports.placesTextSearch = functions.https.onRequest((req, res) => {
  // Use the cors middleware
  cors(req, res, async () => {
    try {
      const query = req.query.query;
      if (!query) {
        return res.status(400).send("Missing 'query' parameter.");
      }

      // --- SECURITY FIX ---
      // Securely get the API key from Firebase configuration
      // instead of hardcoding it.
      const apiKey = functions.config().google.api_key;
      
      if (!apiKey) {
        console.error("Google API key not set in Firebase Functions config.");
        return res.status(500).send("Server configuration error.");
      }

      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

      const response = await axios.get(url);
      res.status(200).send(response.data);

    } catch (error) {
      console.error("Error during Google Places API call:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
