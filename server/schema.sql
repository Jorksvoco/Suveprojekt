CREATE TABLE IF NOT EXISTS cpus (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  socket TEXT,
  cores INTEGER,
  threads INTEGER,
  base_clock REAL,
  boost_clock REAL,
  tdp INTEGER,
  integrated_graphics INTEGER,
  memory_type TEXT,
  price REAL
);

CREATE TABLE IF NOT EXISTS gpus (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  chipset TEXT,
  vram INTEGER,
  memory_type TEXT,
  board_power INTEGER,
  length_mm INTEGER,
  price REAL
);

CREATE TABLE IF NOT EXISTS motherboards (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  socket TEXT,
  chipset TEXT,
  form_factor TEXT,
  memory_type TEXT,
  memory_slots INTEGER,
  max_memory INTEGER,
  wifi INTEGER,
  price REAL
);

CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  capacity_gb INTEGER,
  modules INTEGER,
  speed_mt INTEGER,
  cas_latency INTEGER,
  price REAL
);

CREATE TABLE IF NOT EXISTS storage (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  capacity_gb INTEGER,
  interface TEXT,
  form_factor TEXT,
  read_speed INTEGER,
  write_speed INTEGER,
  price REAL
);

CREATE TABLE IF NOT EXISTS psus (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  wattage INTEGER,
  efficiency TEXT,
  modular INTEGER,
  form_factor TEXT,
  price REAL
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  form_factor_support TEXT,
  max_gpu_length_mm INTEGER,
  max_cooler_height_mm INTEGER,
  price REAL
);

CREATE TABLE IF NOT EXISTS coolers (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  socket_support TEXT,
  height_mm INTEGER,
  radiator_size_mm INTEGER,
  price REAL
);
