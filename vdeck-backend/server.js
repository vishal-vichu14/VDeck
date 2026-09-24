const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/database");

const eventsRoutes = require("./routes/events.routes");
const organizationsRoutes = require("./routes/organizations.routes");
const exhibitorsRoutes = require("./routes/exhibitors.routes");
const visitorsRoutes = require("./routes/visitors.routes");
const connectionsRoutes = require("./routes/connections.routes");
const exhibitorAssetsRoutes = require("./routes/exhibitorAssets.routes");
const stallsRoutes = require("./routes/stalls.routes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* =========================================
   STATIC UPLOADS
========================================= */

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);
// ===============================
// API ROUTES
// ===============================

app.use("/api/events", eventsRoutes);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/exhibitors", exhibitorsRoutes);
app.use("/api/visitors", visitorsRoutes);
app.use("/api/connections", connectionsRoutes);
app.use("/api/exhibitor-assets",exhibitorAssetsRoutes);
app.use("/api/stalls", stallsRoutes);

// ===============================
// BASIC TEST ROUTE
// ===============================

app.get("/", (req, res) => {
    res.send("VDeck Backend is running!");
});

// ===============================
// DATABASE TEST
// ===============================

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "Database connected successfully.",
            database_time: result.rows[0].now
        });

    } catch (error) {
        console.error("Database test error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed."
        });
    }
});

// ===============================
// SHOW TABLES
// ===============================

app.get("/tables", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        res.json({
            success: true,
            tables: result.rows
        });

    } catch (error) {
        console.error("Error fetching tables:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch tables."
        });
    }
});

// ===============================
// SHOW TABLE STRUCTURE
// ===============================

app.get("/tables/structure", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                table_name,
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `);

        res.json({
            success: true,
            structure: result.rows
        });

    } catch (error) {
        console.error("Error fetching table structure:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch table structure."
        });
    }
});

// ===============================
// SHOW ALL TABLE DATA
// ===============================

app.get("/tables/data", async (req, res) => {
    try {

        const tables = [
            "organizations",
            "events",
            "exhibitors",
            "visitors",
            "vdeck_user",
            "user_assets",
            "event_assets"
        ];

        const allData = {};

        for (const table of tables) {

            const result = await pool.query(
                `SELECT * FROM "${table}";`
            );

            allData[table] = result.rows;
        }

        res.json({
            success: true,
            data: allData
        });

    } catch (error) {
        console.error("Error fetching table data:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch table data."
        });
    }
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(`VDeck Backend running at http://localhost:${PORT}`);
});