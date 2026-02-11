const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");

const ADMIN_USERNAME = "poc@admin";

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.username) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.session.username !== ADMIN_USERNAME) {
    return res.status(403).json({ error: "Not authorized" });
  }
  next();
}

// AUTH: login only
router.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT id, username, password_hash FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ message: "Login successful" });
  });
});

// AUTH: logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// ADMIN - list users
router.get("/admin/users", requireAdmin, (req, res) => {
  const sql = "SELECT id, username, created_at FROM users ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// ADMIN - create user
router.post("/admin/users", requireAdmin, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
    db.query(sql, [username, hash], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Username already exists" });
        }
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({ id: result.insertId, username });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// ADMIN - update user (username and/or password)
router.put("/admin/users/:id", requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const { username, password } = req.body;

  if (!username && !password) {
    return res.status(400).json({ error: "Username or password required" });
  }

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      const sql = username
        ? "UPDATE users SET username = ?, password_hash = ? WHERE id = ?"
        : "UPDATE users SET password_hash = ? WHERE id = ?";
      const values = username ? [username, hash, userId] : [hash, userId];
      db.query(sql, values, (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Username already exists" });
          }
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "User updated" });
      });
    } else {
      const sql = "UPDATE users SET username = ? WHERE id = ?";
      db.query(sql, [username, userId], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Username already exists" });
          }
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "User updated" });
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ADMIN - delete user
router.delete("/admin/users/:id", requireAdmin, (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "User deleted", affectedRows: result.affectedRows });
  });
});

// GET all employees that are not archived
router.get("/employees", (req, res) => {
  const sql = "SELECT * FROM employees WHERE is_archived = 0";
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
  });
});

// POST - Add new employee
router.post("/add", (req, res) => {
  const { name, position, address, exactAddress, latitude, longitude, photoData, photoName } = req.body;

  if (!name || !position || !address || !exactAddress || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO employees (name, position, address, exact_address, latitude, longitude, photo_data, photo_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [name, position, address, exactAddress, latitude, longitude, photoData || null, photoName || null];

  db.query(sql, values, (err, result) => {
    if (err) {
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
  });
});

// ARCHIVE - archive employee by ID
router.put("/archive/:id", (req, res) => {
  const employeeId = req.params.id;
  const sql = "UPDATE employees SET is_archived = 1 WHERE id = ?";

  db.query(sql, [employeeId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Employee archived", affectedRows: result.affectedRows });
  });
});

// GET - Geocode address (using Nominatim)
router.get("/geocode", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Query parameter required" });
  }

  try {
    const viewbox = "123.6,10.5,124.2,9.9";
    const url =
      `https://nominatim.openstreetmap.org/search?format=json` +
      `&q=${encodeURIComponent(query)}` +
      `&limit=5` +
      `&viewbox=${viewbox}` +
      `&bounded=0` +
      `&accept-language=en`;

    const response = await fetch(url, {
      headers: { "User-Agent": "employee-map-app/1.0" }
    });
    const results = await response.json();
    res.json(results);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

module.exports = router;