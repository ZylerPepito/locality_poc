const express = require("express");
const cors = require("cors");
const routes = require("./script");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API routes
app.use("/api", routes);

// Serve frontend
app.use(express.static("public"));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
