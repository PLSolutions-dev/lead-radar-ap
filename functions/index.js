// index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");

// Require the 'cors' package and initialize it.
// This is the main part of the fix.
const cors = require("cors")({ origin: true });

admin.initializeApp();

/**
 * A proxy function to query the Google Places API.
 * This is necessary to hide the API key from the client-side code.
 */
exports.placesTextSearch = functions.https.onRequest((req, res) => {
  // This line applies the CORS middleware to your function.
  // It will handle the preflight requests and add the necessary headers.
  cors(req, res, () => {
    const query = req.query.query;
    if (!query) {
      return res.status(400).send("Missing 'query' parameter.");
    }

    const apiKey = functions.config().google.api_key;
    if (!apiKey) {
      console.error("Google API key not set in Firebase Functions config.");
      return res.status(500).send("Server configuration error.");
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    https.get(url, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => {
        data += chunk;
      });
      apiRes.on("end", () => {
        // Forward the Content-Type header from the Google API response
        res.setHeader("Content-Type", apiRes.headers["content-type"]);
        res.send(data);
      });
    }).on("error", (err) => {
      console.error("Error calling Google Places API:", err.message);
      res.status(500).send("Failed to fetch data from Google Places API.");
    });
  });
});

/**
 * A proxy function to query the Google PageSpeed Insights API.
 */
exports.pageSpeedProxy = functions.https.onRequest((req, res) => {
  // Apply CORS middleware to this function as well.
  cors(req, res, () => {
    const urlToTest = req.query.url;
    if (!urlToTest) {
      return res.status(400).send("Missing 'url' parameter.");
    }

    const apiKey = functions.config().google.api_key;
     if (!apiKey) {
      console.error("Google API key not set in Firebase Functions config.");
      return res.status(500).send("Server configuration error.");
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(urlToTest)}&key=${apiKey}`;

    https.get(apiUrl, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => {
        data += chunk;
      });
      apiRes.on("end", () => {
        res.setHeader("Content-Type", apiRes.headers["content-type"]);
        res.send(data);
      });
    }).on("error", (err) => {
      console.error("Error calling PageSpeed API:", err.message);
      res.status(500).send("Failed to fetch data from PageSpeed API.");
    });
  });
});

