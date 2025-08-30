// Backend/lib/imageIndex.js
const fs = require("fs/promises");
const path = require("path");

// If your images are NOT inside the backend project, set ITEM_IMAGE_DIR to the absolute folder.
const IMAGE_DIR = process.env.ITEM_IMAGE_DIR || path.resolve(__dirname, "../uploads/qr/items");
// Public URL prefix your frontend can fetch from (ensure Express or your webserver serves this path).
const PUBLIC_PREFIX = process.env.ITEM_IMAGE_PUBLIC_PREFIX || "/uploads/qr/items";

const ALLOWED = new Set([".jpg",".jpeg",".png",".webp",".gif",".bmp"]);
const TTL_MS = 6 * 60 * 60 * 1000; // cache folder scan for 10 minutes
let cache = null, cachedAt = 0;

async function walk(dir, base = "") {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(base, e.name);
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...await walk(full, rel));
    } else if (ALLOWED.has(path.extname(e.name).toLowerCase())) {
      out.push({
        baseNoExt: e.name.replace(/\.[^.]+$/, ""),
        url: path.posix.join(PUBLIC_PREFIX, rel.split(path.sep).join("/")),
      });
    }
  }
  return out;
}

function escapeReg(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function matches(code, baseNoExt) {
  // Prefer word-ish boundaries to avoid '123' matching '1234'
  const re = new RegExp(`(^|[^a-z0-9])${escapeReg(String(code))}([^a-z0-9]|$)`, "i");
  return re.test(baseNoExt) || baseNoExt.toLowerCase().includes(String(code).toLowerCase());
}

async function getIndex(force = false) {
  const now = Date.now();
  if (force || !cache || now - cachedAt > TTL_MS) {
    cache = await walk(IMAGE_DIR);
    cachedAt = now;
  }
  return cache;
}

async function findByCode(code) {
  if (!code) return [];
  const files = await getIndex();
  return files.filter(f => matches(code, f.baseNoExt)).map(f => f.url);
}

module.exports = { findByCode, getIndex };
