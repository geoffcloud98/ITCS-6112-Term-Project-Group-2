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

        // Helper to fill select with unique sorted values
        function populateFilterSelect(selectId, valuesArray) {
            const select = document.getElementById(selectId);
            const uniqueValues = [...new Set(valuesArray.filter(v => v && v.trim() !== ""))].sort();
            uniqueValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        }

        // Populate trail filters
        populateFilterSelect('trailSurfaceSelect', trailsData.features.map(f => f.properties.trail_surf));
        populateFilterSelect('trailTypeSelect', trailsData.features.map(f => f.properties.trail_type));
        populateFilterSelect('trailOwnerSelect', trailsData.features.map(f => f.properties.trailowner));

        // Populate mile marker filter
        populateFilterSelect('installedSelect', mileMarkersData.features.map(f => f.properties.installed));

        // Populate entrance filters
        populateFilterSelect('accessTypeSelect', entrancesData.features.map(f => f.properties.accesstype));
        populateFilterSelect('entranceTypeSelect', entrancesData.features.map(f => f.properties.ent_type));
        populateFilterSelect('regionSelect', entrancesData.features.map(f => f.properties.parkregion));

        // Initially, add only the entrances layer to the map
        entrancesLayer.entrancesGroup.addTo(map);
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
        
        return { marker, name: entrance.properties.entname.toLowerCase(), ...entrance.properties };
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
        
        return { marker: circleMarker, name: marker.properties.trail_name.toLowerCase(), ...marker.properties };
    });

    trailsMarkers = trails.map(trail => {
         // Convert length from feet to miles if length exists
        let lengthInMiles = trail.properties.length != null ? trail.properties.length / 5280 : null;
        const lengthDisplay = lengthInMiles != null ? lengthInMiles.toFixed(2) : "Unknown";

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
                <p><strong>Length:</strong> ${lengthDisplay} miles</p>
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
        
        return { marker: geoJsonLayer, name: trail.properties.name.toLowerCase(), ...trail.properties };
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

    // Add only the selected layer
    if (selectedLayer === 'entrances') {
        entrancesLayer.entrancesGroup.addTo(map);
    } else if (selectedLayer === 'milemarkers') {
        entrancesLayer.mileMarkersGroup.addTo(map);
    } else if (selectedLayer === 'trails') {
        entrancesLayer.trailsGroup.addTo(map);
    }

    // After switching layers, re-apply filters so only relevant markers show
    applyFilters();
});

// Search functionality
document.getElementById('searchBar').addEventListener('input', applyFilters);

// Add event listeners to the distance inputs
document.getElementById('distanceMin').addEventListener('input', applyFilters);
document.getElementById('distanceMax').addEventListener('input', applyFilters);

// Apply the filters when the page loads
applyFilters();

// Filter by other properties (Trail Surface, Trail Type, etc.)
function applyFilters() {
    const searchQuery = document.getElementById('searchBar').value.toLowerCase();
    const trailSurface = document.getElementById('trailSurfaceSelect').value.toLowerCase();
    const trailType = document.getElementById('trailTypeSelect').value.toLowerCase();
    const trailOwner = document.getElementById('trailOwnerSelect').value.toLowerCase();
    const installedStatus = document.getElementById('installedSelect').value.toLowerCase();
    const accessType = document.getElementById('accessTypeSelect').value.toLowerCase();
    const entranceType = document.getElementById('entranceTypeSelect').value.toLowerCase();
    const region = document.getElementById('regionSelect').value.toLowerCase();
    const distanceMinInput = document.getElementById('distanceMin');
    const distanceMaxInput = document.getElementById('distanceMax');
    
    const distanceMin = distanceMinInput && !isNaN(parseFloat(distanceMinInput.value)) 
                        ? parseFloat(distanceMinInput.value) 
                        : 0;  // Default to 0 if input is empty or invalid
    const distanceMax = distanceMaxInput && !isNaN(parseFloat(distanceMaxInput.value)) 
                        ? parseFloat(distanceMaxInput.value) 
                        : Infinity;  // Default to Infinity if input is empty or invalid

    // Filter entrances
    entrancesMarkers.forEach(entrance => {
        const matchesSearch = entrance.name.includes(searchQuery);
        const matchesFilter = (
            (!trailSurface || (entrance.trail_surf && entrance.trail_surf.toLowerCase().includes(trailSurface))) &&
            (!trailType || (entrance.trail_type && entrance.trail_type.toLowerCase().includes(trailType))) &&
            (!trailOwner || (entrance.trailowner && entrance.trailowner.toLowerCase().includes(trailOwner))) &&
            (!accessType || (entrance.accesstype && entrance.accesstype.toLowerCase().includes(accessType))) &&
            (!entranceType || (entrance.ent_type && entrance.ent_type.toLowerCase().includes(entranceType))) &&
            (!region || (entrance.parkregion && entrance.parkregion.toLowerCase().includes(region)))
        );

        if (matchesSearch && matchesFilter) {
            entrancesLayer.entrancesGroup.addLayer(entrance.marker);
        } else {
            entrancesLayer.entrancesGroup.removeLayer(entrance.marker);
        }
    });

    // Filter mile markers
    mileMarkersMarkers.forEach(marker => {
        const matchesSearch = marker.name.includes(searchQuery);
        const matchesInstalled = (!installedStatus || (marker.installed && marker.installed.toLowerCase().includes(installedStatus)));

        if (matchesSearch && matchesInstalled) {
            entrancesLayer.mileMarkersGroup.addLayer(marker.marker);
        } else {
            entrancesLayer.mileMarkersGroup.removeLayer(marker.marker);
        }
    });

    // Filter trails
    trailsMarkers.forEach(trail => {
        const matchesSearch = trail.name.includes(searchQuery);
        const surfaceMatch = !trailSurface || (trail.trail_surf && trail.trail_surf.toLowerCase().includes(trailSurface));
        const typeMatch = !trailType || (trail.trail_type && trail.trail_type.toLowerCase().includes(trailType));
        const ownerMatch = !trailOwner || (trail.trailowner && trail.trailowner.toLowerCase().includes(trailOwner));

        const dist = trail.length ? parseFloat(trail.length) / 5280 : NaN;
        const matchesDistance = (isNaN(distanceMin) || dist >= distanceMin) && 
                                (isNaN(distanceMax) || dist <= distanceMax);

        const matchesFilter = surfaceMatch && typeMatch && ownerMatch && matchesDistance;

        if (matchesSearch && matchesFilter) {
            entrancesLayer.trailsGroup.addLayer(trail.marker);
        } else {
            entrancesLayer.trailsGroup.removeLayer(trail.marker);
        }
    });
}

// Listen for changes to the filter options
document.querySelectorAll('.filters-container select').forEach(select => {
    select.addEventListener('change', applyFilters);
});

// Get references to the dropdown and filter fieldsets
const dataLayerSelect = document.getElementById('dataLayerSelect');
const trailFilters = document.getElementById('trailFilters');
const mileMarkerFilters = document.getElementById('mileMarkerFilters');
const entranceFilters = document.getElementById('entranceFilters');

// Helper to show/hide filter groups
function setVisibility(element, isVisible) {
  if (!element) return; // Safety check
  element.style.display = isVisible ? 'block' : 'none';
  element.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
}

// Update visibility when selection changes
function updateFilterVisibility() {
  const value = dataLayerSelect.value;

  setVisibility(trailFilters, value === 'trails' || value === 'all');
  setVisibility(mileMarkerFilters, value === 'milemarkers' || value === 'all');
  setVisibility(entranceFilters, value === 'entrances' || value === 'all');
}

// Initialize visibility when page loads
updateFilterVisibility();

// Attach change event listener
dataLayerSelect.addEventListener('change', updateFilterVisibility);
