const axios = require("axios");
const cheerio = require("cheerio");
const { readJson, writeJson, slugify } = require("./utils");

function mergeById(existing, incoming) {
  const map = new Map();

  for (const item of existing) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);

  return Array.from(map.values());
}

async function fetchPage(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });
  return response.data;
}

function parseSampleCPUPage(html) {
  const $ = cheerio.load(html);
  const items = [];

  $(".product-card").each((_, el) => {
    const brand = $(el).find(".brand").text().trim();
    const name = $(el).find(".name").text().trim();
    const socket = $(el).find(".socket").text().trim();
    const cores = Number($(el).find(".cores").text().trim()) || null;
    const threads = Number($(el).find(".threads").text().trim()) || null;
    const baseClock = Number($(el).find(".base-clock").text().trim()) || null;
    const boostClock = Number($(el).find(".boost-clock").text().trim()) || null;
    const tdp = Number($(el).find(".tdp").text().trim()) || null;
    const memoryType = $(el).find(".memory-type").text().trim();
    const price = Number($(el).find(".price").text().replace(/[^0-9.]/g, "")) || null;

    if (!brand || !name) return;

    items.push({
      id: `cpu-${slugify(brand)}-${slugify(name)}`,
      brand,
      name,
      socket: socket || null,
      cores,
      threads,
      base_clock: baseClock,
      boost_clock: boostClock,
      tdp,
      integrated_graphics: true,
      memory_type: memoryType || null,
      price
    });
  });

  return items;
}

async function importCPUsFromUrl(url) {
  const html = await fetchPage(url);
  const parsed = parseSampleCPUPage(html);

  const existing = readJson("data/cpus.json");
  const merged = mergeById(existing, parsed);
  writeJson("data/cpus.json", merged);

  console.log(`Imported ${parsed.length} CPU(s) from ${url}`);
}

async function run() {
  const targetUrl = process.argv[2];

  if (!targetUrl) {
    console.log("Usage: node server/scraper.js <url>");
    process.exit(0);
  }

  try {
    await importCPUsFromUrl(targetUrl);
    console.log("Scrape/import complete.");
  } catch (err) {
    console.error("Scraper failed:", err.message);
  }
}

run();
