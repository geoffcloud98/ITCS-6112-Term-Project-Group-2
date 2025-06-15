// Initialize the map
const map = L.map('map').setView([35.247727668226794, -80.868673179224388], 12); // Center map at some location, zoom level 12

// Add a tile layer (this is the background of the map)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Fetch data from JSON files
Promise.all([
    fetch('data/entrances.json').then(response => response.json()),
    fetch('data/milemarkers.json').then(response => response.json()),
    fetch('data/trails.json').then(response => response.json())
])
    .then(([entrancesData, mileMarkersData, trailsData]) => {
        // Process and render each type of data on the map
        renderMapData(entrancesData.features, mileMarkersData.features, trailsData.features);
    })
    .catch(error => {
        console.error('Error loading data:', error);
    });

// Function to render map data (Entrances, Mile Markers, and Trails)
function renderMapData(entrances, mileMarkers, trails) {
    // Render Entrances as markers
    entrances.forEach(entrance => {
        const lat = entrance.geometry.coordinates[1];
        const lon = entrance.geometry.coordinates[0];

        const popupContent = `
            <div class="info-card">
                <h4>${entrance.properties.entname}</h4>
                <p><strong>Greenway:</strong> ${entrance.properties.greenway}</p>
                <p><strong>Type:</strong> ${entrance.properties.ent_type}</p>
                <p><strong>Access Type:</strong> ${entrance.properties.accesstype}</p>
                <p><strong>Address:</strong> ${entrance.properties.ent_road}</p>
            </div>
        `;

        L.marker([lat, lon])
            .addTo(map)
            .bindPopup(popupContent);
    });

    // Render Mile Markers as circles (since mile markers are usually points)
    mileMarkers.forEach(marker => {
        const lat = marker.geometry.coordinates[1];
        const lon = marker.geometry.coordinates[0];

        const popupContent = `
            <div class="info-card">
                <h4>Trail: ${marker.properties.trail_name}</h4>
                <p><strong>Segment:</strong> ${marker.properties.segment}</p>
                <p><strong>Distance:</strong> ${marker.properties.distance} miles</p>
                <p><strong>Installed:</strong> ${marker.properties.installed}</p>
            </div>
        `;

        L.circleMarker([lat, lon], { color: 'blue' })
            .addTo(map)
            .bindPopup(popupContent);
    });

    // Render Trails as lines (use GeoJSON data for the trails)
    trails.forEach(trail => {
        const trailGeoJSON = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": trail.geometry
            }]
        };

        const trailPopupContent = `
            <div class="info-card">
                <h4>${trail.properties.name}</h4>
                <p><strong>Type:</strong> ${trail.properties.trail_type}</p>
                <p><strong>Surface:</strong> ${trail.properties.trail_surf}</p>
                <p><strong>Length:</strong> ${trail.properties.length} miles</p>
                <p><strong>Owner:</strong> ${trail.properties.trailowner}</p>
                <p><strong>Description:</strong> ${trail.properties.trail_desc || "No description available"}</p>
            </div>
        `;

        L.geoJSON(trailGeoJSON)
            .addTo(map)
            .bindPopup(trailPopupContent);
    });
}
