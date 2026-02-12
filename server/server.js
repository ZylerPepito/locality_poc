const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const routes = require("./script");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(session({
  secret: "change_this_to_a_random_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

// Allow login assets without auth
const publicPaths = ["/login.html", "/login.css", "/login.js"];

// Auth guard
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) return next();
  if (publicPaths.includes(req.path)) return next();

  if (!req.session.userId) {
    return res.redirect("/login.html");
  }

  const adminAssets = ["/admin-create", "/admin-create.html", "/admin-create.js", "/admin-create.css"];
  if (adminAssets.includes(req.path) && req.session.username !== "poc@admin") {
    return res.status(403).send("Not authorized");
  }
  next();
});

// Admin page route
app.get("/admin-create", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin-create.html"));
});

// API routes
app.use("/api", routes);

// Serve frontend
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});