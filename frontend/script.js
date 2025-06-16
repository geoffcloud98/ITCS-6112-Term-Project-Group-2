// Initialize the map
const map = L.map('map').setView([35.247727668226794, -80.868673179224388], 12);

// Add a tile layer (this is the background of the map)
const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variables to hold map layers and markers
let entrancesLayer = null;
let mileMarkersLayer = null;
let trailsLayer = null;
let entrancesMarkers = [];
let mileMarkersMarkers = [];
let trailsMarkers = [];

// Fetch data from JSON files
Promise.all([
    fetch('data/entrances.json').then(response => response.json()),
    fetch('data/milemarkers.json').then(response => response.json()),
    fetch('data/trails.json').then(response => response.json())
])
    .then(([entrancesData, mileMarkersData, trailsData]) => {
        // Process and render each type of data on the map
        entrancesLayer = renderMapData(entrancesData.features, mileMarkersData.features, trailsData.features);

        // Initially, add all layers (entrances, mile markers, trails) to the map
        entrancesLayer.entrancesGroup.addTo(map);
        entrancesLayer.mileMarkersGroup.addTo(map);
        entrancesLayer.trailsGroup.addTo(map);
    })
    .catch(error => {
        console.error('Error loading data:', error);
    });

// Function to render map data (Entrances, Mile Markers, and Trails)
function renderMapData(entrances, mileMarkers, trails) {
    // Layer groups for each data type
    const entrancesGroup = L.layerGroup();
    const mileMarkersGroup = L.layerGroup();
    const trailsGroup = L.layerGroup();

    // Store markers for searching later
    entrancesMarkers = entrances.map(entrance => {
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

        const entranceIcon = L.icon({
        iconUrl: 'flag-red.png',
        iconSize: [20, 20],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        });

        const marker = L.marker([lat, lon], { icon: entranceIcon })
            .addTo(entrancesGroup)
            .bindPopup(popupContent);
        
        return { marker, name: entrance.properties.entname.toLowerCase() };
    });

    mileMarkersMarkers = mileMarkers.map(marker => {
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

        const circleMarker = L.circleMarker([lat, lon], {
            color: '#005035',
            fillColor: '#005035',
            fillOpacity: 0.6,
            radius: 5,
            weight: 2
        })
        .addTo(mileMarkersGroup)
        .bindPopup(popupContent);
        
        return { marker: circleMarker, name: marker.properties.trail_name.toLowerCase() };
    });

    trailsMarkers = trails.map(trail => {
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

        const geoJsonLayer = L.geoJSON(trailGeoJSON, {
            style: {
                color: '#101820',
                weight: 3,
                opacity: 0.7
            }
        })
        .addTo(trailsGroup)
        .bindPopup(trailPopupContent);
        
        return { marker: geoJsonLayer, name: trail.properties.name.toLowerCase() };
    });

    // Return the groups for later control
    return {
        entrancesGroup,
        mileMarkersGroup,
        trailsGroup
    };
}

// Handle data layer change
document.getElementById('dataLayerSelect').addEventListener('change', (event) => {
    const selectedLayer = event.target.value;

    // Remove all the layers first
    map.eachLayer(layer => {
        if (layer !== tileLayer) {
            map.removeLayer(layer);
        }
    });

    // Show all layers if "Show All" is selected
    if (selectedLayer === 'all') {
        entrancesLayer.entrancesGroup.addTo(map);
        entrancesLayer.mileMarkersGroup.addTo(map);
        entrancesLayer.trailsGroup.addTo(map);
    } 
    // Add the selected layer to the map
    else if (selectedLayer === 'entrances') {
        entrancesLayer.entrancesGroup.addTo(map);
    } else if (selectedLayer === 'milemarkers') {
        entrancesLayer.mileMarkersGroup.addTo(map);
    } else if (selectedLayer === 'trails') {
        entrancesLayer.trailsGroup.addTo(map);
    }
});

// Search functionality
document.getElementById('searchBar').addEventListener('input', (event) => {
    const searchQuery = event.target.value.toLowerCase();

    // Filter entrances
    entrancesMarkers.forEach(entrance => {
        if (entrance.name.includes(searchQuery)) {
            entrancesLayer.entrancesGroup.addLayer(entrance.marker); // Show the marker
        } else {
            entrancesLayer.entrancesGroup.removeLayer(entrance.marker); // Hide the marker
        }
    });

    // Filter mile markers
    mileMarkersMarkers.forEach(marker => {
        if (marker.name.includes(searchQuery)) {
            entrancesLayer.mileMarkersGroup.addLayer(marker.marker); // Show the marker
        } else {
            entrancesLayer.mileMarkersGroup.removeLayer(marker.marker); // Hide the marker
        }
    });

    // Filter trails
    trailsMarkers.forEach(trail => {
        if (trail.name.includes(searchQuery)) {
            entrancesLayer.trailsGroup.addLayer(trail.marker); // Show the trail
        } else {
            entrancesLayer.trailsGroup.removeLayer(trail.marker); // Hide the trail
        }
    });
});
