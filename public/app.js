
// EMPLOYEE DATA FROM DATABASE

let employees = [];

// Fetch employees from the database
async function loadEmployees() {
  try {
    const response = await fetch('/api/employees');
    if (!response.ok) throw new Error('Failed to fetch employees');
    const data = await response.json();
    employees = data;
    renderList(employees);
    renderMarkers(employees);
  } catch (error) {
    console.error('Error loading employees:', error);
    alert('Could not load employees from database');
  }
}

// MAP INITIALIZATION

const map = L.map("map").setView([10.31, 123.90], 14);

// OpenStreetMap tile layer

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// MARKERS

let markers = [];

function clearMarkers() {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
}

function renderMarkers(data) {
  clearMarkers();

  data.forEach(emp => {
    const marker = L.marker([emp.latitude, emp.longitude])
      .addTo(map) 
      .bindPopup(`<strong>${emp.name}</strong><br>${emp.address}`);

    marker.employeeId = emp.id;
    markers.push(marker);
  });
}


// EMPLOYEE LIST

const listEl = document.querySelector(".employee-list");

function renderList(data) {
  listEl.innerHTML = "";

  data.forEach(emp => {
    const li = document.createElement("li");
    li.className = "employee";
    li.textContent = emp.name;

    li.addEventListener("click", () => {
      map.setView([emp.latitude, emp.longitude], 17);

      markers.forEach(marker => {
        if (marker.employeeId === emp.id) {
          marker.openPopup();
        }
      });
    });

    listEl.appendChild(li);
  });
}

// SEARCH & FILTER

const searchInput = document.querySelector(".search");

function applyFilters() {
  const searchValue = searchInput.value.toLowerCase();
  const filtered = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchValue)
  );

  renderList(filtered);
  renderMarkers(filtered);
}

searchInput.addEventListener("input", applyFilters);


// INITIAL LOAD

loadEmployees();


// MODAL

const modal = document.querySelector(".modal");
const openModalBtn = document.querySelector(".add-btn");
const closeModalBtn = document.querySelector(".close-button");
const employeeForm = document.querySelector(".employee-form");
const addressInput = document.getElementById("address");
const suggestionsEl = document.getElementById("address-suggestions");
const latInput = document.getElementById("latitude");
const lngInput = document.getElementById("longitude");

let miniMap = null;
let miniMapMarker = null;

// Initialize mini map when modal opens
function initMiniMap() {
  if (miniMap) return; // Already initialized
  
  setTimeout(() => {
    const miniMapContainer = document.getElementById("mini-map");
    miniMap = L.map("mini-map").setView([10.31, 123.90], 14);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(miniMap);

    miniMapMarker = L.marker([10.31, 123.90], { draggable: true }).addTo(miniMap);
    miniMapMarker.bindPopup("Drag to adjust location");

    // Update coordinates when marker is dragged
    miniMapMarker.on("dragend", function() {
      const latlng = miniMapMarker.getLatLng();
      latInput.value = latlng.lat.toFixed(7);
      lngInput.value = latlng.lng.toFixed(7);
    });

    miniMap.invalidateSize();
  }, 10);
}

// Address autocomplete using Nominatim (via backend proxy)
addressInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  
  if (query.length < 3) {
    suggestionsEl.classList.remove("active");
    return;
  }

  try {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }
    
    const results = await response.json();

    suggestionsEl.innerHTML = "";

    if (results.length > 0) {
      results.forEach(result => {
        const li = document.createElement("li");
        li.textContent = result.display_name;
        li.addEventListener("click", () => {
          addressInput.value = result.display_name;
          latInput.value = result.lat;
          lngInput.value = result.lon;
          suggestionsEl.classList.remove("active");

          // Update mini map marker position
          if (miniMap && miniMapMarker) {
            const newLat = parseFloat(result.lat);
            const newLng = parseFloat(result.lon);
            miniMap.setView([newLat, newLng], 16);
            miniMapMarker.setLatLng([newLat, newLng]);
          }
        });
        suggestionsEl.appendChild(li);
      });
      suggestionsEl.classList.add("active");
    } else {
      suggestionsEl.classList.remove("active");
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    suggestionsEl.classList.remove("active");
  }
});

// Close suggestions when clicking elsewhere
document.addEventListener("click", (e) => {
  if (e.target !== addressInput) {
    suggestionsEl.classList.remove("active");
  }
});

// Form submission
employeeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const position = document.getElementById("position").value.trim();
  const address = addressInput.value.trim();
  const latitude = parseFloat(latInput.value);
  const longitude = parseFloat(lngInput.value);

  if (!name || !position || !address || !latitude || !longitude) {
    alert("Please fill in all fields and select a location on the map");
    return;
  }

  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        position,
        address,
        latitude,
        longitude
      })
    });

    if (!response.ok) {
      throw new Error("Failed to add employee");
    }

    alert("Employee added successfully!");
    employeeForm.reset();
    modal.style.display = "none";
    loadEmployees(); // Refresh the list

  } catch (error) {
    console.error("Error adding employee:", error);
    alert("Could not add employee: " + error.message);
  }
});

openModalBtn.onclick = function() {
  modal.style.display = "flex";
  initMiniMap();
} 

closeModalBtn.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}


// PRINT MAP TO PDF

const printBtn = document.querySelector(".print-btn");
const mapContainer = document.getElementById("map");

if (printBtn) {
  printBtn.addEventListener("click", async function() {
    printBtn.disabled = true;
    const originalText = printBtn.textContent;
    printBtn.textContent = "Processing...";

    try {
      const mapEl = document.getElementById("map");
      if (!mapEl) throw new Error("Map element not found");

      // Capture the map container (tiles, markers, popups)
      const canvas = await html2canvas(mapEl, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;

      const pdf = new jsPDF({
        orientation: canvas.height > canvas.width ? "portrait" : "landscape",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("map.pdf");

      printBtn.textContent = "Downloaded";
    } catch (err) {
      console.error("Print error:", err);
      alert("Could not generate PDF. If tiles are blocked by CORS, try a different method (leaflet-image) or enable CORS on tile server.");
      printBtn.textContent = originalText;
    } finally {
      printBtn.disabled = false;
      setTimeout(() => { printBtn.textContent = originalText; }, 1200);
    }
  });
}