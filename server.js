// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// Allow all origins (important for studio.mybuddymobile.com)
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

// ROUTES
const generateRoute = require("./generate");   // ZIP creation route
const publishRoute = require("./publish");     // Auto-publish route

app.use("/generate", generateRoute);
app.use("/publish", publishRoute);

// Root message
app.get("/", (req, res) => {
  res.send("MyBuddy PWA Generator API is running.");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
