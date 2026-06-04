const fs = require("fs");
const path = require("path");

function readJson(relativePath) {
  const fullPath = path.join(__dirname, "..", relativePath);
  if (!fs.existsSync(fullPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  } catch (err) {
    console.error(`Failed to parse JSON at ${relativePath}:`, err.message);
    return [];
  }
}

function writeJson(relativePath, data) {
  const fullPath = path.join(__dirname, "..", relativePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Wrote ${Array.isArray(data) ? data.length : 0} items to ${relativePath}`);
}

function slugify(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = {
  readJson,
  writeJson,
  slugify
};
