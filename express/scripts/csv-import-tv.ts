/**
 * scripts/csv-import-tv.ts
 *
 * Bulk imports TV shows from the TMDB Kaggle CSV dataset into the Blueberry DB.
 *
 * Usage:
 *   npx ts-node scripts/csv-import-tv.ts [OPTIONS]
 */

import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { parse } from "csv-parse";
import { ingestTVShow } from "../src/plugins/ingester";
import { mapTVCSVRow, type TVCSVRow } from "../src/plugins/csv/mapper";

const args = process.argv.slice(2);

function getArg(flag: string, defaultVal: string): string {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : defaultVal;
}

function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

const CSV_FILE = getArg("--file", path.join(os.homedir(), "Downloads", "TMDB_tv_dataset_v3.csv"));
const LIMIT = parseInt(getArg("--limit", "10000"));
const MIN_VOTES = parseInt(getArg("--min-votes", "50"));
const MIN_RATING = parseFloat(getArg("--min-rating", "4.0"));
const LANG_FILTER = getArg("--language", "").split(",").map(s => s.trim()).filter(Boolean);
const SORT_BY_POPULARITY = hasFlag("--top");
const NO_OVERWRITE = hasFlag("--no-overwrite");
const DRY_RUN = hasFlag("--dry-run");

const stats = {
  read: 0,
  filtered: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  startTime: Date.now(),
};

function printProgress(final = false) {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rate = (stats.filtered / Math.max(1, parseFloat(elapsed))).toFixed(1);
  const marker = final ? "✨" : "⏳";
  process.stdout.write(
    `\r${marker} Read: ${stats.read.toLocaleString()} | ` +
    `Passed filter: ${stats.filtered.toLocaleString()} | ` +
    `Created: ${stats.created} | Updated: ${stats.updated} | ` +
    `Failed: ${stats.failed} | ` +
    `${elapsed}s @ ${rate} rows/s   `
  );
  if (final) console.log();
}

function passesFilter(row: TVCSVRow): boolean {
  const voteCount = parseInt(row.vote_count || "0");
  const rating = parseFloat(row.vote_average || "0");

  if (voteCount < MIN_VOTES) return false;
  if (rating < MIN_RATING) return false;
  if (row.adult?.toLowerCase() === "true") return false;
  if (LANG_FILTER.length > 0 && !LANG_FILTER.includes(row.original_language)) return false;

  return true;
}

async function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`\n❌ CSV file not found: ${CSV_FILE}`);
    console.error(`   Use --file <path> to specify location.\n`);
    process.exit(1);
  }

  const fileSizeMB = (fs.statSync(CSV_FILE).size / 1024 / 1024).toFixed(0);
  console.log(`\n📺 Blueberry TV CSV Importer`);
  console.log(`   File    : ${CSV_FILE} (${fileSizeMB} MB)`);
  console.log(`   Filters : vote_count ≥ ${MIN_VOTES} | rating ≥ ${MIN_RATING} | lang: ${LANG_FILTER.length ? LANG_FILTER.join(",") : "all"}`);
  console.log(`   Limit   : ${LIMIT === 0 ? "unlimited" : LIMIT.toLocaleString()}`);
  console.log(`   Mode    : ${DRY_RUN ? "DRY RUN" : SORT_BY_POPULARITY ? "top by popularity" : "sequential"}`);
  console.log(`   Overwrite: ${NO_OVERWRITE ? "no" : "yes"}\n`);

  console.log("📖 Reading CSV...\n");

  let filtered: { row: TVCSVRow; popularity: number }[] = [];

  await new Promise<void>((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: false,
    });

    const fileStream = fs.createReadStream(CSV_FILE, { encoding: "utf8" });

    parser.on("readable", () => {
      let row: TVCSVRow;
      while ((row = parser.read()) !== null) {
        stats.read++;

        if (stats.read % 10000 === 0) printProgress();

        if (passesFilter(row)) {
          filtered.push({ row, popularity: parseFloat(row.popularity || "0") });
          stats.filtered++;

          if (!SORT_BY_POPULARITY && LIMIT > 0 && filtered.length >= LIMIT) {
            fileStream.destroy();
            return;
          }
        }
      }
    });

    parser.on("error", reject);
    parser.on("end", resolve);
    fileStream.on("close", resolve);
    fileStream.on("error", reject);
    fileStream.pipe(parser);
  });

  console.log(`\n   Rows read      : ${stats.read.toLocaleString()}`);
  console.log(`   Passed filters : ${stats.filtered.toLocaleString()}`);

  if (SORT_BY_POPULARITY) {
    console.log(`\n🔀 Sorting ${stats.filtered.toLocaleString()} TV shows by popularity...`);
    filtered.sort((a, b) => b.popularity - a.popularity);
  }

  const toImport = LIMIT > 0 ? filtered.slice(0, LIMIT) : filtered;
  console.log(`\n📦 TV Shows to import: ${toImport.length.toLocaleString()}`);

  if (DRY_RUN) {
    console.log(`\n✅ DRY RUN complete — no writes performed.`);
    console.log(`   Top 5 by popularity:`);
    toImport.slice(0, 5).forEach((m) => {
      console.log(`   • ${m.row.name} (${m.row.first_air_date?.substring(0, 4)}) [pop: ${parseFloat(m.row.popularity).toFixed(1)}]`);
    });
    return;
  }

  console.log(`\n🚀 Ingesting...\n`);
  stats.startTime = Date.now();

  const BATCH_LOG = 250;

  for (let i = 0; i < toImport.length; i++) {
    const { row } = toImport[i];

    try {
      const payload = mapTVCSVRow(row);
      if (!payload) {
        stats.skipped++;
        continue;
      }

      const result = ingestTVShow(payload, { overwrite: !NO_OVERWRITE });

      if (result.action === "created") stats.created++;
      else if (result.action === "updated") stats.updated++;
      else stats.skipped++;

    } catch (err: any) {
      stats.failed++;
      if (stats.failed <= 10) {
        console.error(`\n   ❌ [${row.id}] ${row.name}: ${err.message}`);
      }
    }

    if ((i + 1) % BATCH_LOG === 0) printProgress();
  }

  printProgress(true);

  const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rate = (toImport.length / Math.max(1, parseFloat(totalTime))).toFixed(0);

  console.log(`\n✨ Import complete!`);
  console.log(`   Created  : ${stats.created.toLocaleString()}`);
  console.log(`   Updated  : ${stats.updated.toLocaleString()}`);
  console.log(`   Skipped  : ${stats.skipped.toLocaleString()}`);
  console.log(`   Failed   : ${stats.failed.toLocaleString()}`);
  console.log(`   Time     : ${totalTime}s @ ${rate} shows/s\n`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
