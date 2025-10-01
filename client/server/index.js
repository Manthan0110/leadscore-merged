const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/", (req, res) => {
  res.send({ message: "LeadScore Lite server is running!" });
});

// Example POST endpoint for leads
app.post("/api/leads", (req, res) => {
  const lead = req.body;
  console.log("Received lead:", lead);

  // TODO: save to DB or forward to FastAPI
  res.status(201).json({
    message: "Lead received successfully",
    data: lead,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
