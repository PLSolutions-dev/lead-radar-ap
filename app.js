// app.js

// IMPORTANT: Replace with your project's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "leadradar-99bac",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DOM Elements ---
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');
const resultsDiv = document.getElementById('results');
const loader = document.getElementById('loader');
const saveAllBtn = document.getElementById('save-all-btn');

let currentLeads = []; // To hold the current search results

// --- Event Listeners ---
searchBtn.addEventListener('click', searchBusinesses);
saveAllBtn.addEventListener('click', saveAllLeads);


// --- Functions ---

function initMapPlaceholder() {
    const mapDiv = document.getElementById('map-placeholder');
    const dallas = { lat: 32.7767, lng: -96.7970 };
    const map = new google.maps.Map(mapDiv, {
        center: dallas,
        zoom: 10,
    });
    new google.maps.Marker({
        position: dallas,
        map: map,
        title: 'Map will update with search results.',
    });
}

async function searchBusinesses() {
    const businessType = document.getElementById('business-type').value;
    const location = document.getElementById('location').value;
    const query = `${businessType} in ${location}`;

    if (!businessType || !location) {
        alert("Please enter both a business type and a location.");
        return;
    }

    resultsContainer.style.display = 'block';
    resultsDiv.innerHTML = '';
    loader.style.display = 'block';
    saveAllBtn.style.display = 'none';
    currentLeads = []; // Clear previous leads

    try {
        // Use the Firebase Function proxy to call the Places API
        const functionUrl = `https://us-central1-leadradar-99bac.cloudfunctions.net/placesTextSearch?query=${encodeURIComponent(query)}`;
        const response = await fetch(functionUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results) {
            currentLeads = data.results; // Store leads
            displayResults(data.results);
            if(data.results.length > 0) {
                saveAllBtn.style.display = 'block';
            }
        } else {
            resultsDiv.innerHTML = '<p class="text-gray-500">No results found.</p>';
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        resultsDiv.innerHTML = `<p class="text-red-500">Failed to fetch data. See console for details.</p>`;
    } finally {
        loader.style.display = 'none';
    }
}

function displayResults(places) {
    resultsDiv.innerHTML = ''; // Clear previous results
    if (!places || places.length === 0) {
        resultsDiv.innerHTML = '<p>No results found.</p>';
        return;
    }
    places.forEach(place => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 p-4 rounded-lg border border-gray-200';
        card.innerHTML = `
            <h3 class="font-bold text-lg">${place.name}</h3>
            <p class="text-sm text-gray-600">${place.formatted_address}</p>
            <p class="text-sm text-yellow-500 mt-1">Rating: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)</p>
        `;
        resultsDiv.appendChild(card);
    });
}

async function saveAllLeads() {
    if (currentLeads.length === 0) {
        alert("No leads to save.");
        return;
    }

    const batch = db.batch();
    currentLeads.forEach(lead => {
        const leadRef = db.collection('leads').doc(lead.place_id);
        batch.set(leadRef, {
            name: lead.name,
            address: lead.formatted_address,
            rating: lead.rating || null,
            ratings_total: lead.user_ratings_total || 0,
            place_id: lead.place_id,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    });

    try {
        await batch.commit();
        alert(`${currentLeads.length} leads saved successfully!`);
    } catch (error) {
        console.error("Error saving leads: ", error);
        alert("Failed to save leads. Please try again.");
    }
}
