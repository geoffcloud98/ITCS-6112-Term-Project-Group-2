<h1>Mecklenburg County Park & Greenway Explorer</h1>
This project is a web-based interactive mapping application built to visualize and explore publicly available parks and recreation data in Mecklenburg County, NC. The frontend is powered by Leaflet.js for dynamic map rendering and geospatial layer control. Users can:
<ul>
  <li>Filter data by feature-specific attributes</li>
  <li>Search by keyword (e.g., trail or park name)</li>
  <li>Input an address and perform radius-based spatial searches</li>
</ul>


The backend is built with Node.js and Express.js, and integrates OpenStreetMap (via Nominatim API) and ArcGIS REST services to provide geocoding and real-time data. This tool helps residents, outdoor enthusiasts, and tourists navigate the county’s trail, park, and greenway networks with ease.

<p>This link will bring you to the web app: <a href="http://159.65.190.244:3000/" target="_blank">Mecklenburg County Park & Greenway Explorer</a></p>



<h2>System Decomposition</h2>

<h3>Frontend</h3>
<p>The frontend is responsible for the user interface and interacting with backend services. It includes the following components:</p>

<h4>Map Display and Interactivity</h4>
<ul>
  <li>Displays the map and renders geospatial data (entrances, mile markers, trails) using <code>Leaflet.js</code>.</li>
  <li>Supports interactions such as zoom, pan, and click events to show feature details.</li>
</ul>

<h4>Filters and Search Functionality</h4>
<ul>
  <li>Provides filtering for features based on user-selected attributes (e.g., access type, trail surface, installation status).</li>
  <li>Includes a search bar for filtering map items by name.</li>
</ul>

<h4>Address Search & Radius Filter</h4>
<ul>
  <li>Uses <code>OpenStreetMap's Nominatim API</code> to geocode user input into latitude and longitude.</li>
  <li>Allows users to define a radius for locating nearby features (entrances, mile markers, trails).</li>
</ul>

<h4>Dynamic Map Updates</h4>
<ul>
  <li>Applies filters and search inputs to dynamically update visible map features in real time.</li>
</ul>

<h3>Backend</h3>
<p>The backend handles data processing, storage, and serves geospatial information to the frontend. It includes:</p>

<h4>External Services and APIs</h4>
<ul>
  <li><strong>ArcGIS REST API</strong>: Queries Mecklenburg County’s API to retrieve trails, entrances, and mile markers.</li>
  <li><strong>OpenStreetMap (Nominatim API)</strong>: Geocodes user-entered addresses into geographic coordinates for spatial filtering.</li>
</ul>

<h4>API Endpoints for Data Sync</h4>
<ul>
  <li>Fetches and synchronizes geospatial data (entrances, mile markers, trails) from external GIS services to the database.</li>
</ul>

<h4>Database Management</h4>
<ul>
  <li>Uses <code>PostgreSQL</code> with the <code>PostGIS</code> extension to store and manage spatial data.</li>
</ul>

<h4>Data Access API</h4>
<ul>
  <li>Provides RESTful endpoints to retrieve spatial features for map rendering and interaction.</li>
</ul>

<h4>Geometry Handling and Validation</h4>
<ul>
  <li>Validates and transforms geometries (e.g., <code>LineString</code>, <code>MultiLineString</code>) using PostGIS functions to ensure data consistency.</li>
</ul>

<h4>Server and Connection Management</h4>
<ul>
  <li>Manages HTTP requests via <code>Express.js</code> and handles database connections using the <code>pg</code> library.</li>
</ul>
