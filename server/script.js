const express = require("express");
const router = express.Router();
const db = require("./db");

// GET all employees that are not archived
router.get("/employees", (req, res) => {
  const sql = "SELECT * FROM employees WHERE is_archived = 0"; // only ones that are not archived
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET all archived employees

router.get("/employees/archived", (req, res) => {
  const sql = "SELECT * FROM employees WHERE is_archived = 1";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// UNARCHIVE - unarchive employee by ID 

router.put("/unarchive/:id", (req, res) => {
  const employeeId = req.params.id;
  const sql = "UPDATE employees SET is_archived = 0 WHERE id = ?";
  db.query(sql, [employeeId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee unarchived", affectedRows: result.affectedRows });
  }
);
} );  

// POST - Add new employee
router.post("/add", (req, res) => {
  const { name, position, address, exactAddress, latitude, longitude, photoData, photoName } = req.body;

  console.log("Received data:", { name, position, address, exactAddress, latitude, longitude });

  if (!name || !position || !address || !exactAddress || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO employees (name, position, address, exact_address, latitude, longitude, photo_data, photo_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [name, position, address, exactAddress, latitude, longitude, photoData || null, photoName || null];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message || "Database error" });
    }
    res.status(201).json({ 
      id: result.insertId,
      name,
      position,
      address,
      exactAddress,
      latitude,
      longitude,
      photoData: photoData || null,
      photoName: photoName || null
    });
  });
});

// DELETE - delete employee by ID

router.delete("/delete/:id", (req, res) => {
  const employeeId = req.params.id;
  const sql = "DELETE FROM employees WHERE id = ?";
  db.query(sql, [employeeId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee deleted", affectedRows: result.affectedRows });
  });
}); 

// EDIT - update employee by ID

router.put("/edit/:id", (req, res) => {
  const employeeId = req.params.id;
  const { name, position, address, exactAddress, latitude, longitude, photoData, photoName } = req.body;
  const sql = "UPDATE employees SET name = ?, position = ?, address = ?, exact_address = ?, latitude = ?, longitude = ?, photo_data = ?, photo_name = ? WHERE id = ?";

  db.query(sql, [name, position, address, exactAddress, latitude, longitude, photoData || null, photoName || null, employeeId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee updated", affectedRows: result.affectedRows });
  }
  );  
});

// ARCHIVE - archive employee by ID (soft delete)

router.put("/archive/:id", (req, res) => {
  const employeeId = req.params.id;
  const sql = "UPDATE employees SET is_archived = 1 WHERE id = ?";

  db.query(sql, [employeeId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee archived", affectedRows: result.affectedRows });
  }

);  
} );

// SUGGESTIONS FOR ADDRESS INPUT  geocoding endpoint using nominatim (only cebu)
router.get("/geocode", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Query parameter required" });
  }

  try {
    // Cebu-biased viewbox (soft bias: still allows global results)
    const viewbox = "123.6,10.5,124.2,9.9"; // west, north, east, south
    const url =
      `https://nominatim.openstreetmap.org/search?format=json` +
      `&q=${encodeURIComponent(query)}` +
      `&limit=5` +
      `&viewbox=${viewbox}` +
      `&bounded=0` +
      `&accept-language=en`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "employee-map-app/1.0"
      }
    });
    const results = await response.json();
    res.json(results);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

module.exports = router;