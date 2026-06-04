const fs = require("fs");
const path = require("path");
const express = require("express");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client")));

function runSchemaIfNeeded() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  db.exec(schema, (err) => {
    if (err) {
      console.error("Failed to initialize schema:", err.message);
    } else {
      console.log("Schema ensured.");
    }
  });
}

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function buildFilters(query, allowedFields) {
  const clauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (query[field] !== undefined) {
      clauses.push(`${field} = ?`);
      params.push(query[field]);
    }
  }

  if (query.search) {
    clauses.push(`(brand LIKE ? OR name LIKE ?)`);
    params.push(`%${query.search}%`, `%${query.search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

async function getTableRows(table, orderBy = "brand, name", query = {}, allowedFields = []) {
  const { where, params } = buildFilters(query, allowedFields);
  const sql = `SELECT * FROM ${table} ${where} ORDER BY ${orderBy}`;
  return queryAll(sql, params);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

app.get("/api/parts", async (req, res) => {
  try {
    const [cpus, gpus, motherboards, memory, storage, psus, cases, coolers] = await Promise.all([
      getTableRows("cpus"),
      getTableRows("gpus"),
      getTableRows("motherboards"),
      getTableRows("memory"),
      getTableRows("storage"),
      getTableRows("psus"),
      getTableRows("cases"),
      getTableRows("coolers")
    ]);

    res.json({
      cpus,
      gpus,
      motherboards,
      memory,
      storage,
      psus,
      cases: cases.map(row => ({
        ...row,
        form_factor_support: JSON.parse(row.form_factor_support || "[]")
      })),
      coolers: coolers.map(row => ({
        ...row,
        socket_support: JSON.parse(row.socket_support || "[]")
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/cpus", async (req, res) => {
  try {
    const rows = await getTableRows("cpus", "brand, name", req.query, ["brand", "socket", "memory_type"]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/gpus", async (req, res) => {
  try {
    const rows = await getTableRows("gpus", "brand, name", req.query, ["brand", "memory_type"]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/motherboards", async (req, res) => {
  try {
    const rows = await getTableRows(
      "motherboards",
      "brand, name",
      req.query,
      ["brand", "socket", "chipset", "form_factor", "memory_type", "wifi"]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/memory", async (req, res) => {
  try {
    const rows = await getTableRows("memory", "brand, name", req.query, ["brand", "type", "capacity_gb", "modules"]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/storage", async (req, res) => {
  try {
    const rows = await getTableRows("storage", "brand, name", req.query, ["brand", "type", "interface", "form_factor"]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/psus", async (req, res) => {
  try {
    const rows = await getTableRows("psus", "brand, name", req.query, ["brand", "efficiency", "modular", "form_factor"]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/cases", async (req, res) => {
  try {
    const rows = await getTableRows("cases", "brand, name", req.query, ["brand"]);
    res.json(
      rows.map(row => ({
        ...row,
        form_factor_support: JSON.parse(row.form_factor_support || "[]")
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/parts/coolers", async (req, res) => {
  try {
    const rows = await getTableRows("coolers", "brand, name", req.query, ["brand", "type"]);
    res.json(
      rows.map(row => ({
        ...row,
        socket_support: JSON.parse(row.socket_support || "[]")
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

runSchemaIfNeeded();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
