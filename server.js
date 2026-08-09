const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();


// ====================================
// MIDDLEWARE
// ====================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ====================================
// STATIC WEBSITE
// ====================================

app.use(express.static(path.join(__dirname)));


// ====================================
// POSTGRESQL CONNECTION
// ====================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? {
        rejectUnauthorized: false
      }
    : false
});


// ====================================
// DATABASE TABLE
// ====================================

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

    await pool.query(`
      ALTER TABLE participants
      ADD COLUMN IF NOT EXISTS secret_code VARCHAR(100)
    `);

    await pool.query(`
      ALTER TABLE participants
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    await pool.query(`
      ALTER TABLE participants
      ADD COLUMN IF NOT EXISTS secret_submitted_at TIMESTAMP
    `);

    console.log("Database table ready ✅");

  } catch (error) {

    console.error(
      "Database table error:",
      error
    );

  }
}


// ====================================
// HOME
// ====================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});


// ====================================
// FORM 1 - REGISTRATION
// ====================================

app.post("/api/register", async (req, res) => {

  try {

    const {
      name,
      mobile,
      dob,
      district
    } = req.body;

    if (
      !name ||
      !mobile ||
      !dob ||
      !district
    ) {

      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });

    }

    const result = await pool.query(
      `
      INSERT INTO participants
      (
        name,
        mobile,
        dob,
        district
      )
      VALUES
      ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        name,
        mobile,
        dob,
        district
      ]
    );

    const entryId =
      result.rows[0].id;

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
      error
    );

    res.status(500).json({
      success: false,
      message: "Could not save registration."
    });

  }

});


// ====================================
// FORM 2 - SECRET CODE
// ====================================

app.post("/api/secret", async (req, res) => {

  try {

    const {
      entryId,
      secretCode
    } = req.body;

    if (
      !entryId ||
      !secretCode
    ) {

      return res.status(400).json({
        success: false,
        message: "Secret code is required."
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

    if (result.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Registration not found."
      });

    }

    console.log(
      "Form 2 saved. Entry ID:",
      entryId
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(
      "Form 2 save error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Could not save secret code."
    });

  }

});


// ====================================
// ADMIN LOGIN
// ====================================

app.post("/api/admin/login", async (req, res) => {

  try {

    const {
      password
    } = req.body;

    if (
      !process.env.ADMIN_PASSWORD ||
      password !== process.env.ADMIN_PASSWORD
    ) {

      return res.status(401).json({
        success: false,
        message: "Wrong password."
      });

    }

    res.json({
      success: true
    });

  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error."
    });

  }

});


// ====================================
// ADMIN DATA
// ====================================

app.post("/api/admin/data", async (req, res) => {

  try {

    const {
      password
    } = req.body;

    // Check admin password
    if (
      !process.env.ADMIN_PASSWORD ||
      password !== process.env.ADMIN_PASSWORD
    ) {

      return res.status(401).json({
        success: false,
        message: "Unauthorized."
      });

    }

    // IMPORTANT:
    // Campaign coupon/secret code is returned
    // directly instead of being masked.
    const result = await pool.query(`
      SELECT
        id,
        name,
        mobile,
        dob,
        district,
        secret_code,
        created_at,
        secret_submitted_at
      FROM participants
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      participants: result.rows
    });

  } catch (error) {

    console.error(
      "Admin data error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Could not load data."
    });

  }

});


// ====================================
// HEALTH CHECK
// ====================================

app.get("/api/health", async (req, res) => {

  try {

    await pool.query("SELECT 1");

    res.json({
      status: "OK",
      database: "connected"
    });

  } catch (error) {

    console.error(
      "Health check error:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      database: "not connected"
    });

  }

});


// ====================================
// 404 API
// ====================================

app.use("/api", (req, res) => {

  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });

});


// ====================================
// ERROR HANDLER
// ====================================

app.use((error, req, res, next) => {

  console.error(
    "Server error:",
    error
  );

  res.status(500).json({
    success: false,
    message: "Internal server error."
  });

});


// ====================================
// START SERVER
// ====================================

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  "0.0.0.0",
  async () => {

    console.log(
      `Server running on port ${PORT}`
    );

    await createTable();

  }
);
