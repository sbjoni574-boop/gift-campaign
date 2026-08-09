const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Website files
app.use(express.static(path.join(__dirname)));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

// Create table
async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(30) NOT NULL,
        dob DATE NOT NULL,
        district VARCHAR(100) NOT NULL,
        secret_code VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        secret_submitted_at TIMESTAMP
      )
    `);

    console.log("Database table ready ✅");

  } catch (error) {
    console.error("Database table error:", error.message);
  }
}

// ------------------------------------
// FORM 1
// Save Name, Mobile, DOB, District
// ------------------------------------

app.post("/api/register", async (req, res) => {

  try {

    const {
      name,
      mobile,
      dob,
      district
    } = req.body;

    if (!name || !mobile || !dob || !district) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO participants
      (name, mobile, dob, district)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        name,
        mobile,
        dob,
        district
      ]
    );

    const entryId = result.rows[0].id;

    console.log(
      "Form 1 saved. Entry ID:",
      entryId
    );

    res.json({
      success: true,
      entryId: entryId
    });

  } catch (error) {

    console.error(
      "Form 1 save error:",
      error.message
    );

    res.status(500).json({
      message: "Could not save registration."
    });

  }

});


// ------------------------------------
// FORM 2
// Save Campaign Secret Code
// ------------------------------------

app.post("/api/secret-code", async (req, res) => {

  try {

    const {
      entryId,
      secretCode
    } = req.body;

    if (!entryId || !secretCode) {
      return res.status(400).json({
        message: "Entry ID and Secret Code are required."
      });
    }

    const result = await pool.query(
      `
      UPDATE participants
      SET
        secret_code = $1,
        secret_submitted_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
      `,
      [
        secretCode,
        entryId
      ]
    );

    if (result.rowCount === 0) {

      return res.status(404).json({
        message: "Entry not found."
      });

    }

    console.log(
      "Form 2 saved. Entry ID:",
      entryId
    );

    res.json({
      success: true,
      entryId: entryId
    });

  } catch (error) {

    console.error(
      "Form 2 save error:",
      error.message
    );

    res.status(500).json({
      message: "Could not save secret code."
    });

  }

});


// ------------------------------------
// Health check
// ------------------------------------

app.get("/api/health", async (req, res) => {

  try {

    await pool.query("SELECT 1");

    res.json({
      status: "OK",
      database: "connected"
    });

  } catch (error) {

    res.status(500).json({
      status: "ERROR",
      database: "not connected"
    });

  }

});


// ------------------------------------
// Start server
// ------------------------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async () => {

  console.log(
    `Server running on port ${PORT}`
  );

  await createTable();

});
