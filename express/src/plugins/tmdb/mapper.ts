/**
 * tmdb/mapper.ts
 *
 * Maps raw TMDB API responses into the normalized PluginMoviePayload / PluginTVPayload
 * that the ingester understands. No DB access here — pure data transformation.
 */

import type {
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBCastMember,
  TMDBCrewMember,
  TMDBVideoResult,
  TMDBProductionCompany,
} from "./client";
import type { PluginMoviePayload, PluginTVPayload, CastRole, CompanyType } from "shared-types";

// ── Genre slug normalization ──────────────────────────────────────────────────
// Maps TMDB genre names to our slug format.
// We use the slug from our genres table (all lowercase, hyphenated).
function tmdbGenreToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+&\s+|\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

// ── Movie status normalization ────────────────────────────────────────────────
function mapMovieStatus(status: string): PluginMoviePayload["status"] {
  switch (status.toLowerCase()) {
    case "released": return "released";
    case "in production": return "in_production";
    case "planned":
    case "announced": return "upcoming";
    case "cancelled":
    case "canceled": return "cancelled";
    default: return "released";
  }
}

// ── TV status normalization ───────────────────────────────────────────────────
function mapTVStatus(status: string): PluginTVPayload["status"] {
  switch (status.toLowerCase()) {
    case "returning series": return "returning_series";
    case "ended": return "ended";
    case "canceled":
    case "cancelled": return "canceled";
    case "in production": return "in_production";
    case "planned": return "planned";
    case "pilot": return "pilot";
    default: return "returning_series";
  }
}

// ── Cast/Crew role mapping ────────────────────────────────────────────────────
function mapCrewRole(job: string): CastRole | null {
  switch (job.toLowerCase()) {
    case "director": return "director";
    case "screenplay":
    case "story":
    case "writer": return "writer";
    case "producer":
    case "executive producer": return "producer";
    case "director of photography":
    case "cinematography": return "cinematographer";
    case "original music composer":
    case "composer": return "composer";
    case "editor": return "editor";
    case "creator": return "creator";
    default: return null;
  }
}

function mapCompanyRole(company: TMDBProductionCompany): CompanyType {
  // TMDB doesn't distinguish streaming vs distribution vs production,
  // so we default to production. The user can update via the UI.
  return "production";
}

// ── Pick the best YouTube trailer key ────────────────────────────────────────
function pickTrailerKey(videos?: { results: TMDBVideoResult[] }): string | undefined {
  if (!videos?.results?.length) return undefined;
  const trailer =
    videos.results.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    videos.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.results.find((v) => v.site === "YouTube");
  return trailer?.key;
}

// ── Main mappers ─────────────────────────────────────────────────────────────

export function mapTMDBMovie(raw: TMDBMovieDetails): PluginMoviePayload {
  const releaseYear = raw.release_date ? parseInt(raw.release_date.substring(0, 4)) : undefined;

  // Cast: take top 20 actors (sorted by order), then key crew
  const castPayload: PluginMoviePayload["cast"] = [];

  (raw.credits?.cast ?? []).slice(0, 20).forEach((m: TMDBCastMember, i: number) => {
    castPayload.push({
      name: m.name,
      tmdb_id: m.id,
      role: "actor",
      character: m.character || undefined,
      display_order: i,
      tmdb_profile_path: m.profile_path ?? undefined,
    });
  });

  (raw.credits?.crew ?? []).forEach((m: TMDBCrewMember) => {
    const role = mapCrewRole(m.job);
    if (!role) return;
    // Avoid duplicate (same person, same role)
    const already = castPayload.find((c) => c.tmdb_id === m.id && c.role === role);
    if (!already) {
      castPayload.push({
        name: m.name,
        tmdb_id: m.id,
        role,
        display_order: 1000, // crew comes after cast in sort
        tmdb_profile_path: m.profile_path ?? undefined,
      });
    }
  });

  return {
    title: raw.title,
    original_title: raw.original_title !== raw.title ? raw.original_title : undefined,
    tmdb_id: raw.id,
    imdb_id: raw.external_ids?.imdb_id ?? raw.imdb_id ?? undefined,
    wikidata_id: raw.external_ids?.wikidata_id ?? undefined,

    release_year: releaseYear,
    runtime: raw.runtime ?? undefined,
    tagline: raw.tagline?.trim() || undefined,
    description: raw.overview?.trim() || undefined,
    status: mapMovieStatus(raw.status),
    origin_country: raw.production_countries?.[0]?.iso_3166_1 ?? undefined,
    original_language: raw.spoken_languages?.find((l) => l.iso_639_1)?.iso_639_1 ?? undefined,
    budget: raw.budget || undefined,
    box_office: raw.revenue || undefined,
    rating_imdb: raw.vote_average > 0 ? raw.vote_average : undefined,
    keywords: raw.keywords?.keywords?.map((k) => k.name).slice(0, 20) ?? undefined,

    tmdb_poster_path: raw.poster_path ?? undefined,
    tmdb_backdrop_path: raw.backdrop_path ?? undefined,
    tmdb_trailer_key: pickTrailerKey(raw.videos),

    genre_slugs: raw.genres?.map((g) => tmdbGenreToSlug(g.name)) ?? [],
    language_codes: raw.spoken_languages?.map((l) => l.iso_639_1) ?? [],
    cast: castPayload,
    companies: raw.production_companies?.slice(0, 5).map((c) => ({
      name: c.name,
      tmdb_id: c.id,
      role: mapCompanyRole(c),
    })) ?? [],
  };
}

export function mapTMDBTV(raw: TMDBTVDetails): PluginTVPayload {
  const castPayload: PluginTVPayload["cast"] = [];

  // For TV we use aggregate_credits (includes recurring cast across episodes)
  (raw.aggregate_credits?.cast ?? []).slice(0, 20).forEach((m, i) => {
    const character = m.roles?.[0]?.character;
    castPayload.push({
      name: m.name,
      tmdb_id: m.id,
      role: "actor",
      character: character || undefined,
      display_order: m.order ?? i,
      tmdb_profile_path: m.profile_path ?? undefined,
    });
  });

  (raw.aggregate_credits?.crew ?? []).forEach((m) => {
    m.jobs?.forEach((j) => {
      const role = mapCrewRole(j.job);
      if (!role) return;
      const already = castPayload.find((c) => c.tmdb_id === m.id && c.role === role);
      if (!already) {
        castPayload.push({
          name: m.name,
          tmdb_id: m.id,
          role,
          display_order: 1000,
          tmdb_profile_path: m.profile_path ?? undefined,
        });
      }
    });
  });

  const avgRuntime = raw.episode_run_time?.length > 0
    ? Math.round(raw.episode_run_time.reduce((a, b) => a + b, 0) / raw.episode_run_time.length)
    : undefined;

  return {
    title: raw.name,
    original_title: raw.original_name !== raw.name ? raw.original_name : undefined,
    tmdb_id: raw.id,
    imdb_id: raw.external_ids?.imdb_id ?? undefined,
    wikidata_id: raw.external_ids?.wikidata_id ?? undefined,

    tagline: raw.tagline?.trim() || undefined,
    description: raw.overview?.trim() || undefined,
    status: mapTVStatus(raw.status),
    first_air_date: raw.first_air_date || undefined,
    last_air_date: raw.last_air_date || undefined,
    network: raw.networks?.[0]?.name ?? undefined,
    origin_country: raw.origin_country?.[0] ?? undefined,
    original_language: raw.original_language ?? undefined,
    episode_count: raw.number_of_episodes ?? 0,
    season_count: raw.number_of_seasons ?? 0,
    runtime_per_episode: avgRuntime,
    rating_imdb: raw.vote_average > 0 ? raw.vote_average : undefined,
    keywords: raw.keywords?.results?.map((k) => k.name).slice(0, 20) ?? undefined,

    tmdb_poster_path: raw.poster_path ?? undefined,
    tmdb_backdrop_path: raw.backdrop_path ?? undefined,

    genre_slugs: raw.genres?.map((g) => tmdbGenreToSlug(g.name)) ?? [],
    language_codes: raw.spoken_languages?.map((l) => l.iso_639_1) ?? [],
    cast: castPayload,
    companies: raw.production_companies?.slice(0, 5).map((c) => ({
      name: c.name,
      tmdb_id: c.id,
      role: "production" as CompanyType,
    })) ?? [],
  };
}
