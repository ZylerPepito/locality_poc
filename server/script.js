const express = require("express");
const router = express.Router();
const db = require("./db");

// GET all employees
router.get("/employees", (req, res) => {
  const sql = "SELECT * FROM employees";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// POST - Add new employee
router.post("/add", (req, res) => {
  const { name, position, address, latitude, longitude } = req.body;

  console.log("Received data:", { name, position, address, latitude, longitude });

  if (!name || !position || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO employees (name, position, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)";
  const values = [name, position, address, latitude, longitude];

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
      latitude,
      longitude
    });
  });
});


// GET - Geocode address (using Nominatim)
router.get("/geocode", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Query parameter required" });
  }

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const results = await response.json();
    res.json(results);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

module.exports = router;
