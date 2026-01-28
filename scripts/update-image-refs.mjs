import fs from "node:fs";
import path from "node:path";

const mapPath = process.argv[2] || "./tmp/image-map.json";
if (!fs.existsSync(mapPath)) {
  console.log(`No existe el mapa: ${mapPath}`);
  process.exit(1);
}

const mappings = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
const byBasename = new Map();

Object.entries(mappings).forEach(([originalPath, url]) => {
  const base = path.basename(originalPath);
  byBasename.set(base, url);
});

const getFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return getFiles(full);
    if (full.endsWith(".astro")) return [full];
    return [];
  });

const files = getFiles("./src");
let updated = 0;

files.forEach((file) => {
  const original = fs.readFileSync(file, "utf-8");
  let content = original;

  for (const [base, url] of byBasename.entries()) {
    const patterns = [
      new RegExp(`(["'])\\/(${base.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&")})\\1`, "g"),
      new RegExp(`(["'])\\./(${base.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&")})\\1`, "g"),
    ];

    patterns.forEach((regex) => {
      content = content.replace(regex, `$1${url}$1`);
    });
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    updated += 1;
  }
});

console.log(`Archivos actualizados: ${updated}`);
