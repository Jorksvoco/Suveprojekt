const fs = require("fs");
const path = require("path");
const db = require("./db");

const schemaPath = path.join(__dirname, "schema.sql");
const dataDir = path.join(__dirname, "..", "data");

function readJson(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file: ${filename}`);
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${filename}:`, err.message);
    return [];
  }
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function execQuery(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function insertMany(table, rows, mapFn) {
  if (!rows.length) {
    console.log(`No rows to insert for ${table}`);
    return;
  }

  console.log(`Seeding ${rows.length} rows into ${table}...`);

  for (const row of rows) {
    const mapped = mapFn(row);
    const columns = Object.keys(mapped);
    const values = Object.values(mapped);
    const placeholders = columns.map(() => "?").join(", ");

    const sql = `
      INSERT OR REPLACE INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders})
    `;

    await runQuery(sql, values);
  }
}

async function main() {
  try {
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await execQuery(schema);
    console.log("Schema created successfully.");

    await insertMany("cpus", readJson("cpus.json"), (cpu) => ({
      id: cpu.id,
      brand: cpu.brand,
      name: cpu.name,
      socket: cpu.socket || null,
      cores: cpu.cores || null,
      threads: cpu.threads || null,
      base_clock: cpu.base_clock || null,
      boost_clock: cpu.boost_clock || null,
      tdp: cpu.tdp || null,
      integrated_graphics: cpu.integrated_graphics ? 1 : 0,
      memory_type: cpu.memory_type || null,
      price: cpu.price || null
    }));

    await insertMany("gpus", readJson("gpus.json"), (gpu) => ({
      id: gpu.id,
      brand: gpu.brand,
      name: gpu.name,
      chipset: gpu.chipset || null,
      vram: gpu.vram || null,
      memory_type: gpu.memory_type || null,
      board_power: gpu.board_power || null,
      length_mm: gpu.length_mm || null,
      price: gpu.price || null
    }));

    await insertMany("motherboards", readJson("motherboards.json"), (mb) => ({
      id: mb.id,
      brand: mb.brand,
      name: mb.name,
      socket: mb.socket || null,
      chipset: mb.chipset || null,
      form_factor: mb.form_factor || null,
      memory_type: mb.memory_type || null,
      memory_slots: mb.memory_slots || null,
      max_memory: mb.max_memory || null,
      wifi: mb.wifi ? 1 : 0,
      price: mb.price || null
    }));

    await insertMany("memory", readJson("memory.json"), (ram) => ({
      id: ram.id,
      brand: ram.brand,
      name: ram.name,
      type: ram.type || null,
      capacity_gb: ram.capacity_gb || null,
      modules: ram.modules || null,
      speed_mt: ram.speed_mt || null,
      cas_latency: ram.cas_latency || null,
      price: ram.price || null
    }));

    await insertMany("storage", readJson("storage.json"), (drive) => ({
      id: drive.id,
      brand: drive.brand,
      name: drive.name,
      type: drive.type || null,
      capacity_gb: drive.capacity_gb || null,
      interface: drive.interface || null,
      form_factor: drive.form_factor || null,
      read_speed: drive.read_speed || null,
      write_speed: drive.write_speed || null,
      price: drive.price || null
    }));

    await insertMany("psus", readJson("psus.json"), (psu) => ({
      id: psu.id,
      brand: psu.brand,
      name: psu.name,
      wattage: psu.wattage || null,
      efficiency: psu.efficiency || null,
      modular: psu.modular ? 1 : 0,
      form_factor: psu.form_factor || null,
      price: psu.price || null
    }));

    await insertMany("cases", readJson("cases.json"), (pcCase) => ({
      id: pcCase.id,
      brand: pcCase.brand,
      name: pcCase.name,
      form_factor_support: JSON.stringify(pcCase.form_factor_support || []),
      max_gpu_length_mm: pcCase.max_gpu_length_mm || null,
      max_cooler_height_mm: pcCase.max_cooler_height_mm || null,
      price: pcCase.price || null
    }));

    await insertMany("coolers", readJson("coolers.json"), (cooler) => ({
      id: cooler.id,
      brand: cooler.brand,
      name: cooler.name,
      type: cooler.type || null,
      socket_support: JSON.stringify(cooler.socket_support || []),
      height_mm: cooler.height_mm || null,
      radiator_size_mm: cooler.radiator_size_mm || null,
      price: cooler.price || null
    }));

    console.log("Seeding complete.");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    db.close(() => {
      console.log("Database connection closed.");
    });
  }
}

main();
