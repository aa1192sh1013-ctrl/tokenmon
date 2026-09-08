import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const source = path.resolve(process.argv[2] || "../AnimalBot/character-concepts/mid");
const destination = path.resolve("public/species");
const aliases = { rhinoceros: "rhino", "manta-ray": "manta", "stag-beetle": "stagbeetle", tyrannosaurus: "tyranno", triceratops: "tricera", velociraptor: "raptor", ankylosaurus: "anky", pteranodon: "ptera" };
const folders = fs.readdirSync(source).filter(name => /^\d{2}_/.test(name));
if (folders.length !== 60) throw new Error(`Expected 60 species, found ${folders.length}`);
const jobs = folders.flatMap(folder => {
  const animalId = folder.replace(/^\d{2}_/, "");
  const id = aliases[animalId] || animalId;
  if (!fs.existsSync(path.join(destination, id))) throw new Error(`Unknown species: ${id}`);
  return Array.from({ length: 21 }, (_, level) => ({ id, level, input: path.join(source, folder, `${folder}_lv${level}.png`) }));
});
for (const job of jobs) if (!fs.existsSync(job.input)) throw new Error(`Missing: ${job.input}`);
const manifest = { version: "animalbot-20260908", canvas: 640, images: [] };
for (const job of jobs) {
  const buffer = fs.readFileSync(job.input);
  const meta = await sharp(buffer).metadata();
  if (!meta.hasAlpha) throw new Error(`Missing alpha: ${job.input}`);
  const output = path.join(destination, job.id, `${job.level}.webp`);
  const tmp = output + ".tmp";
  await sharp(buffer).resize(608, 608, { fit: "contain", withoutEnlargement: true, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, alphaQuality: 100 }).toFile(tmp);
  fs.renameSync(tmp, output);
  manifest.images.push({ species: job.id, level: job.level, source: path.relative(source, job.input).replaceAll("\\", "/"), sha256: crypto.createHash("sha256").update(buffer).digest("hex") });
  if (job.level === 20) console.log(`Imported ${job.id}: Lv.0–20`);
}
fs.writeFileSync("public/species-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`Verified sources and imported ${jobs.length} images.`);
