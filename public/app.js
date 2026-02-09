// employee data

let employees = [];
let employeeId = null;

// Unarchive employee by ID
function unarchiveEmployee(employeeId) {
  fetch(`/api/unarchive/${employeeId}`, {
    method: "PUT"
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to unarchive employee");
    }
    return response.json();
  })  
  .then(data => {
    alert(data.message);
    loadEmployees(); // Refresh the list
  }
  )
  .catch(error => {
    console.error("Error unarchiving employee:", error);
    alert("Could not unarchive employee: " + error.message);
  }); 
} 

// Confirm delete employee
function confirmDelete(employeeId) {
  if (confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
    deleteEmployee(employeeId);
  }
}

// Delete employee by ID
function deleteEmployee(employeeId) {
  fetch(`/api/delete/${employeeId}`, {
    method: "DELETE"
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to delete employee");
    }
    return response.json();
  })
  .then(data => {
    alert(data.message);
    loadEmployees(); // Refresh the list
  })
  .catch(error => {
    console.error("Error deleting employee:", error);
    alert("Could not delete employee: " + error.message);
  });
}

// Open edit modal with employee data
function openEditModal(employee) {
  employeeId = employee.id;
  document.getElementById("name").value = employee.name;
  document.getElementById("position").value = employee.position;
  document.getElementById("address").value = employee.address;
  exactAddressInput.value = employee.exact_address || "";
  document.getElementById("latitude").value = employee.latitude;
  document.getElementById("longitude").value = employee.longitude;
  currentPhotoData = employee.photo_data || null;
  currentPhotoName = employee.photo_name || null;
  if (photoInput) photoInput.value = "";
  modal.style.display = "flex";
  initMiniMap();
  if (miniMap && miniMapMarker) {
    miniMap.setView([employee.latitude, employee.longitude], 16);
    miniMapMarker.setLatLng([employee.latitude, employee.longitude]);
  }
}

// Update employee by ID
function updateEmployee() {
  const name = document.getElementById("name").value.trim();
  const position = document.getElementById("position").value.trim();

  const address = document.getElementById("address").value.trim();
  const exactAddress = exactAddressInput.value.trim();
  const latitude = parseFloat(document.getElementById("latitude").value);
  const longitude = parseFloat(document.getElementById("longitude").value);
  fetch(`/api/edit/${employeeId}`, {
    method: "PUT",
    headers: {  
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      position,
      address,
      exactAddress,
      latitude,
      longitude
    })
  }) 
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to update employee");
    }
    return response.json();
  } )
  .then(data => {
    alert(data.message);       
    employeeForm.reset();
    modal.style.display = "none";
    loadEmployees(); // Refresh the list
  })
  .catch(error => {
    console.error("Error updating employee:", error);
    alert("Could not update employee: " + error.message);
  });     
}

// archive employee by ID
function archiveEmployee(employeeId) {
  fetch(`/api/archive/${employeeId}`, {
    method: "PUT"
  })        
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to archive employee");
    }
    return response.json();
  }
  ) 
  .then(data => {
    alert(data.message);
    loadEmployees(); // Refresh the list
  }   
  )
  .catch(error => {
    console.error("Error archiving employee:", error);
    alert("Could not archive employee: " + error.message);
  } 
  );  

} 


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

async function loadArchivedEmployees() {
  try {
    const response = await fetch('/api/employees/archived');
    if (!response.ok) throw new Error('Failed to fetch archived employees');
    const data = await response.json();
    const archiveEmployees = data;
    renderArchivedList(archiveEmployees);
  
  } catch (error ) {
    console.error('Error loading archived employees:', error);
    alert('Could not load archived employees from database');
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

function convertDate(dateString) {
  const date = new Date(dateString.replace(" ", "T"));

  const options = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true};
  return date.toLocaleDateString("en-ph", options);
}

function renderMarkers(data) {
  clearMarkers();

  data.forEach(emp => {
    const exactAddress = emp.exact_address || emp.address || "";
    const photoLink = emp.photo_data
      ? `<br><a href="${emp.photo_data}" download="${emp.photo_name || "employee-photo"}">Download picture</a>`
      : "";

    const marker = L.marker([emp.latitude, emp.longitude])
      .addTo(map) 
      .bindPopup(`<strong>${emp.name}</strong><br>${exactAddress} <br> ${convertDate(emp.created_at)} <br><br>
  <a 
    href="https://www.google.com/maps?q=${emp.latitude},${emp.longitude}" 
    target="_blank"
    rel="noopener noreferrer"
  >
    📍 Open in Google Maps
  </a> ${photoLink}`);

    marker.employeeId = emp.id;
    markers.push(marker);
  });
}

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// EMPLOYEE LIST
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const listEl = document.querySelector(".employee-list");


function renderList(data) {
  listEl.innerHTML = "";

  data.forEach(emp => {
    const li = document.createElement("li");
    li.className = "employee";

    // Name
    const nameSpan = document.createElement("span");
    nameSpan.className = "employee-name";
    nameSpan.textContent = emp.name;

    // Actions container
    const actions = document.createElement("div");
    actions.className = "employee-actions";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "✏️";
    editBtn.title = "Edit";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete";

    // Archive button
    const archiveBtn = document.createElement("button");
    archiveBtn.className = "archive-btn";
    archiveBtn.textContent = "🗃️";
    archiveBtn.title = "Unarchive";


    // === EVENTS ===
    

    // Clicking the name focuses the map
    nameSpan.addEventListener("click", () => {
      map.setView([emp.latitude, emp.longitude], 17);

      markers.forEach(marker => {
        if (marker.employeeId === emp.id) {
          marker.openPopup();
        }
      });
    });

    // Edit
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // IMPORTANT
      openEditModal(emp);
      loadEmployees(); // Refresh the list
    });

    // Delete
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // IMPORTANT
      confirmDelete(emp.id);
    });

    archiveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      archiveEmployee(emp.id);
      loadEmployees(); // Refresh the list
      loadArchivedEmployees(); // Refresh archived list
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(archiveBtn);

    li.appendChild(nameSpan);
    li.appendChild(actions);

    listEl.appendChild(li);
  });


}


// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   // Archived List
   // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const archivedListEl = document.querySelector(".archived-list");
    
function renderArchivedList(data) {
   archivedListEl.innerHTML = "";
    data.filter(emp => emp.is_archived).forEach(emp => {
      const li = document.createElement("li");
      li.className = "employee archived";
      li.textContent = emp.name;
      archivedListEl.appendChild(li);

      // Actions container
    const actions = document.createElement("div");
    actions.className = "archive-actions";

    // un archive
    const archiveBtn = document.createElement("button");
    archiveBtn.className = "archive-btn";
    archiveBtn.textContent = "↺";
    archiveBtn.title = "Unarchive";

    actions.appendChild(archiveBtn);
    li.appendChild(actions);

    archiveBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // IMPORTANT
      unarchiveEmployee(emp.id);
      loadEmployees(); // Refresh the list
      loadArchivedEmployees(); // Refresh archived list
    });

    });
   
}
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// SEARCH & FILTER
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

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


// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// MODAL
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const modal = document.querySelector(".modal");
const openModalBtn = document.querySelector(".add-btn");
const closeModalBtn = document.querySelector(".close-button");
const employeeForm = document.querySelector(".employee-form");
const addressInput = document.getElementById("address");
const suggestionsEl = document.getElementById("address-suggestions");
const latInput = document.getElementById("latitude");
const lngInput = document.getElementById("longitude");
const exactAddressInput = document.getElementById("exact-address");
const photoInput = document.getElementById("photo");

let currentPhotoData = null;
let currentPhotoName = null;

let miniMap = null;
let miniMapMarker = null;

function readPhotoFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve({ photoData: null, photoName: null });
    const reader = new FileReader();
    reader.onload = () => resolve({ photoData: reader.result, photoName: file.name });
    reader.onerror = () => resolve({ photoData: null, photoName: null });
    reader.readAsDataURL(file);
  });
}

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// Initialize mini map when modal opens
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

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

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// PRINT MAP TO PDF
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

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

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// Address autocomplete using Nominatim (via backend proxy)
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

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

// Form submission - adding employee

employeeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const position = document.getElementById("position").value.trim();
  const address = addressInput.value.trim();
  const exactAddress = exactAddressInput.value.trim();
  const latitude = parseFloat(latInput.value);
  const longitude = parseFloat(lngInput.value);

  if (!name || !position || !address || !exactAddress || !latitude || !longitude) {
    alert("Please fill in all fields and select a location on the map");
    return;
  }

  let photoData = currentPhotoData;
  let photoName = currentPhotoName;

  if (photoInput && photoInput.files && photoInput.files[0]) {
    const photoResult = await readPhotoFile(photoInput.files[0]);
    photoData = photoResult.photoData;
    photoName = photoResult.photoName;
  } else if (!employeeId) {
    photoData = null;
    photoName = null;
  }

  try {

    let response;
    let message = "Employee added successfully!";

    if (employeeId) {

       response = await fetch(`/api/edit/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json" 
        }, body: JSON.stringify({
          name,
          position,
          address,
          exactAddress,
          latitude,
          longitude,
          photoData,
          photoName
        })
      }) 

    } else {

        response = await fetch("/api/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          position,
          address,
          exactAddress,
          latitude,
          longitude,
          photoData,
          photoName
        })
      });

      message = "Employee added successfully!";

    }  
    

    if (!response.ok) {
      throw new Error("Failed to add employee");
    }

    alert(message);
    employeeForm.reset();
    modal.style.display = "none";
    loadEmployees(); // Refresh the list
    loadArchivedEmployees(); // Refresh archived list

  } catch (error) {
    console.error("Error adding employee:", error);
    alert("Could not add employee: " + error.message);
  }
});

openModalBtn.onclick = function() {
  employeeId = null;
  currentPhotoData = null;
  currentPhotoName = null;
  if (exactAddressInput) exactAddressInput.value = "";
  if (photoInput) photoInput.value = "";
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



// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// INITIAL LOAD
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

loadEmployees();
loadArchivedEmployees()