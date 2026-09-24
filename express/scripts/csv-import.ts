/**
 * scripts/csv-import.ts
 *
 * Bulk imports movies from the TMDB Kaggle CSV dataset into the Blueberry DB.
 * Reads the file in a streaming fashion — never loads the full 632MB into memory.
 *
 * Usage:
 *   npx ts-node scripts/csv-import.ts [OPTIONS]
 *
 * Options:
 *   --file <path>        Path to CSV file (default: ~/Downloads/TMDB_movie_dataset_v11.csv)
 *   --limit <n>          Max movies to import (default: 10000, 0 = all passing filters)
 *   --min-votes <n>      Min vote_count to include (default: 50)
 *   --min-rating <n>     Min vote_average to include (default: 4.0)
 *   --language <codes>   Comma-separated ISO codes to filter e.g. "en,hi,fr" (default: all)
 *   --top                Sort by popularity before limiting (loads filtered set into memory first)
 *   --no-overwrite       Skip movies already in DB (default: overwrite/update)
 *   --dry-run            Parse and filter only, don't write to DB
 *
 * Examples:
 *   # Import top 5000 English movies by popularity with ≥100 votes
 *   npx ts-node scripts/csv-import.ts --limit 5000 --language en --min-votes 100 --top
 *
 *   # Import all movies with ≥50 votes (full quality corpus)
 *   npx ts-node scripts/csv-import.ts --limit 0 --min-votes 50
 *
 *   # Import top 2000 Hindi + Tamil movies
 *   npx ts-node scripts/csv-import.ts --limit 2000 --language hi,ta --top
 *
 *   # Dry-run to see how many would pass your filters
 *   npx ts-node scripts/csv-import.ts --min-votes 200 --dry-run
 */

import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { parse } from "csv-parse";
import { ingestMovie } from "../src/plugins/ingester";
import { mapCSVRow, type CSVRow } from "../src/plugins/csv/mapper";

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(flag: string, defaultVal: string): string {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : defaultVal;
}

function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

const CSV_FILE = getArg("--file", path.join(os.homedir(), "Downloads", "TMDB_movie_dataset_v11.csv"));
const LIMIT = parseInt(getArg("--limit", "10000"));
const MIN_VOTES = parseInt(getArg("--min-votes", "50"));
const MIN_RATING = parseFloat(getArg("--min-rating", "4.0"));
const LANG_FILTER = getArg("--language", "").split(",").map(s => s.trim()).filter(Boolean);
const SORT_BY_POPULARITY = hasFlag("--top");
const NO_OVERWRITE = hasFlag("--no-overwrite");
const DRY_RUN = hasFlag("--dry-run");

// ── Stats ─────────────────────────────────────────────────────────────────────
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

// ── Filter function ───────────────────────────────────────────────────────────
function passesFilter(row: CSVRow): boolean {
  const voteCount = parseInt(row.vote_count || "0");
  const rating = parseFloat(row.vote_average || "0");

  if (voteCount < MIN_VOTES) return false;
  if (rating < MIN_RATING) return false;
  if (row.adult?.toLowerCase() === "true") return false;
  if (LANG_FILTER.length > 0 && !LANG_FILTER.includes(row.original_language)) return false;

  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`\n❌ CSV file not found: ${CSV_FILE}`);
    console.error(`   Use --file <path> to specify location.\n`);
    process.exit(1);
  }

  const fileSizeMB = (fs.statSync(CSV_FILE).size / 1024 / 1024).toFixed(0);
  console.log(`\n🫐 Blueberry CSV Importer`);
  console.log(`   File    : ${CSV_FILE} (${fileSizeMB} MB)`);
  console.log(`   Filters : vote_count ≥ ${MIN_VOTES} | rating ≥ ${MIN_RATING} | lang: ${LANG_FILTER.length ? LANG_FILTER.join(",") : "all"}`);
  console.log(`   Limit   : ${LIMIT === 0 ? "unlimited" : LIMIT.toLocaleString()}`);
  console.log(`   Mode    : ${DRY_RUN ? "DRY RUN" : SORT_BY_POPULARITY ? "top by popularity" : "sequential"}`);
  console.log(`   Overwrite: ${NO_OVERWRITE ? "no" : "yes"}\n`);

  // ── Phase 1: Read and filter ──────────────────────────────────────────────
  console.log("📖 Reading CSV...\n");

  let filtered: { row: CSVRow; popularity: number }[] = [];

  await new Promise<void>((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: false,
    });

    const fileStream = fs.createReadStream(CSV_FILE, { encoding: "utf8" });

    parser.on("readable", () => {
      let row: CSVRow;
      while ((row = parser.read()) !== null) {
        stats.read++;

        if (stats.read % 10000 === 0) printProgress();

        if (passesFilter(row)) {
          filtered.push({ row, popularity: parseFloat(row.popularity || "0") });
          stats.filtered++;

          // If not sorting by popularity, stop early once we have enough
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

  // ── Phase 2: Sort if requested ───────────────────────────────────────────
  if (SORT_BY_POPULARITY) {
    console.log(`\n🔀 Sorting ${stats.filtered.toLocaleString()} movies by popularity...`);
    filtered.sort((a, b) => b.popularity - a.popularity);
  }

  // Apply limit
  const toImport = LIMIT > 0 ? filtered.slice(0, LIMIT) : filtered;
  console.log(`\n📦 Movies to import: ${toImport.length.toLocaleString()}`);

  if (DRY_RUN) {
    console.log(`\n✅ DRY RUN complete — no writes performed.`);
    console.log(`   Top 5 by popularity:`);
    toImport.slice(0, 5).forEach((m) => {
      console.log(`   • ${m.row.title} (${m.row.release_date?.substring(0, 4)}) [pop: ${parseFloat(m.row.popularity).toFixed(1)}]`);
    });
    return;
  }

  // ── Phase 3: Ingest ───────────────────────────────────────────────────────
  console.log(`\n🚀 Ingesting...\n`);
  stats.startTime = Date.now();

  const BATCH_LOG = 250;

  for (let i = 0; i < toImport.length; i++) {
    const { row } = toImport[i];

    try {
      const payload = mapCSVRow(row);
      if (!payload) {
        stats.skipped++;
        continue;
      }

      const result = ingestMovie(payload, { overwrite: !NO_OVERWRITE });

      if (result.action === "created") stats.created++;
      else if (result.action === "updated") stats.updated++;
      else stats.skipped++;

    } catch (err: any) {
      stats.failed++;
      if (stats.failed <= 10) {
        console.error(`\n   ❌ [${row.id}] ${row.title}: ${err.message}`);
      }
    }

    if ((i + 1) % BATCH_LOG === 0) printProgress();
  }

  printProgress(true);

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rate = (toImport.length / Math.max(1, parseFloat(totalTime))).toFixed(0);

  console.log(`\n✨ Import complete!`);
  console.log(`   Created  : ${stats.created.toLocaleString()}`);
  console.log(`   Updated  : ${stats.updated.toLocaleString()}`);
  console.log(`   Skipped  : ${stats.skipped.toLocaleString()}`);
  console.log(`   Failed   : ${stats.failed.toLocaleString()}`);
  console.log(`   Time     : ${totalTime}s @ ${rate} movies/s\n`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
