/**
 * tmdb-seed.ts
 *
 * Standalone script to ingest real TMDB data for development/testing.
 * Run with: npx ts-node scripts/tmdb-seed.ts [--movies] [--tv] [--pages N]
 *           or: npx ts-node scripts/tmdb-seed.ts --movie 157336  (specific TMDB ID)
 *               npx ts-node scripts/tmdb-seed.ts --show 1396
 *
 * Requires TMDB_API_KEY in express/.env
 */

import "dotenv/config";
import { ingestMovieByTMDBId, ingestTVByTMDBId, ingestPopularMovies, ingestPopularTV, tmdbClient } from "../src/plugins/tmdb";

// ── CLI argument parsing ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {
  movies: args.includes("--movies"),
  tv: args.includes("--tv"),
  movie: args.includes("--movie") ? parseInt(args[args.indexOf("--movie") + 1]) : null,
  show: args.includes("--show") ? parseInt(args[args.indexOf("--show") + 1]) : null,
  topRated: args.includes("--top-rated"),
  pages: args.includes("--pages") ? parseInt(args[args.indexOf("--pages") + 1]) : 1,
};

// Default: ingest popular movies AND TV if no flags provided
const runAll = !flags.movies && !flags.tv && !flags.movie && !flags.show;

// ── Curated list of must-have movies (TMDB IDs) ───────────────────────────────
const CURATED_MOVIES = [
  157336,  // Interstellar
  27205,   // Inception
  278,     // The Shawshank Redemption
  238,     // The Godfather
  550,     // Fight Club
  19995,   // Avatar
  872585,  // Oppenheimer
  346698,  // Barbie
  808,     // Shrek
  240,     // The Godfather Part II
  424,     // Schindler's List
  637,     // Life is Beautiful
  13,      // Forrest Gump
  769,     // Goodfellas
  680,     // Pulp Fiction
  601,     // Se7en
  274,     // The Silence of the Lambs
  497,     // The Green Mile
  77338,   // The Intouchables
  129,     // Spirited Away (ja)
  311,     // Dilwale Dulhania Le Jayenge (hi)
  1891,    // The Empire Strikes Back
  120,     // The Lord of the Rings: The Fellowship
  122,     // The Return of the King
  11,      // Star Wars: Episode IV
  4935,    // Howl's Moving Castle
  149,     // The Dark Knight (already in dummy, will update)
  114,     // The Dark Knight (double check)
  533535,  // Deadpool & Wolverine
  912649,  // Venom: The Last Dance
];

// ── Curated list of must-have TV shows (TMDB IDs) ────────────────────────────
const CURATED_TV = [
  1396,    // Breaking Bad
  1399,    // Game of Thrones
  60625,   // Rick and Morty
  63926,   // Mr. Robot
  66732,   // Stranger Things
  76479,   // The Boys
  90462,   // Chainsaw Man
  95479,   // Jujutsu Kaisen
  113988,  // Invincible
  94605,   // Arcane
  46648,   // Dark
  79242,   // The Last of Us (now 100770)
  100770,  // The Last of Us
  84958,   // Loki
  88396,   // The Falcon and the Winter Soldier
  1403,    // Agents of S.H.I.E.L.D.
  85552,   // Euphoria
  75006,   // Succession
  1412,    // Arrow
  71912,   // The Witcher
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!tmdbClient.isConfigured()) {
    console.error("\n❌ TMDB_API_KEY is not set in express/.env\n");
    console.error("   Add: TMDB_API_KEY=your_api_key_here\n");
    console.error("   Get a free key at: https://www.themoviedb.org/settings/api\n");
    process.exit(1);
  }

  console.log("🫐 Blueberry TMDB Seeder\n");

  // Specific movie
  if (flags.movie) {
    if (isNaN(flags.movie)) { console.error("Invalid --movie ID"); process.exit(1); }
    console.log(`\n📽  Ingesting movie TMDB:${flags.movie}...`);
    const r = await ingestMovieByTMDBId(flags.movie);
    console.log(`   ✅ ${r.action}: ${r.title}`);
    return;
  }

  // Specific show
  if (flags.show) {
    if (isNaN(flags.show)) { console.error("Invalid --show ID"); process.exit(1); }
    console.log(`\n📺 Ingesting show TMDB:${flags.show}...`);
    const r = await ingestTVByTMDBId(flags.show);
    console.log(`   ✅ ${r.action}: ${r.title}`);
    return;
  }

  const results: { action: string; title: string; type: string }[] = [];

  // Curated movies
  if (runAll || flags.movies) {
    console.log(`\n📽  Ingesting ${CURATED_MOVIES.length} curated movies...\n`);
    for (const id of CURATED_MOVIES) {
      try {
        const r = await ingestMovieByTMDBId(id);
        console.log(`   ${r.action === "created" ? "✅" : "↺"} ${r.action.padEnd(7)} movie: ${r.title}`);
        results.push({ action: r.action, title: r.title, type: "movie" });
        // Small delay to avoid hammering TMDB rate limits (40 req/10s)
        await new Promise((ok) => setTimeout(ok, 260));
      } catch (err: any) {
        console.error(`   ❌ FAILED movie ${id}: ${err.message}`);
      }
    }

    // Also pull popular movies for depth
    console.log(`\n📽  Pulling ${flags.pages} page(s) of popular movies...\n`);
    const popular = await ingestPopularMovies(flags.pages);
    popular.forEach((r) => results.push({ action: r.action, title: r.title, type: "movie" }));
  }

  // Curated TV
  if (runAll || flags.tv) {
    console.log(`\n📺 Ingesting ${CURATED_TV.length} curated TV shows...\n`);
    for (const id of CURATED_TV) {
      try {
        const r = await ingestTVByTMDBId(id);
        console.log(`   ${r.action === "created" ? "✅" : "↺"} ${r.action.padEnd(7)} show:  ${r.title}`);
        results.push({ action: r.action, title: r.title, type: "tv" });
        await new Promise((ok) => setTimeout(ok, 260));
      } catch (err: any) {
        console.error(`   ❌ FAILED show ${id}: ${err.message}`);
      }
    }

    // Popular TV for depth
    console.log(`\n📺 Pulling ${flags.pages} page(s) of popular TV shows...\n`);
    const popular = await ingestPopularTV(flags.pages);
    popular.forEach((r) => results.push({ action: r.action, title: r.title, type: "tv" }));
  }

  // Summary
  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;
  const skipped = results.filter((r) => r.action === "skipped").length;
  console.log(`\n✨ Done!`);
  console.log(`   Created : ${created}`);
  console.log(`   Updated : ${updated}`);
  console.log(`   Skipped : ${skipped}`);
  console.log(`   Total   : ${results.length}\n`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
