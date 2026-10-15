/**
 * plugins/wikidata/index.ts
 *
 * High-level Wikidata plugin API.
 * Combines search, SPARQL enrichment, mapping, and DB ingest.
 */

import { wikidataClient } from "./client";
import { mapWikidataMovie } from "./mapper";
import { ingestMovie } from "../ingester";
import type { IngestResult } from "shared-types";

export interface WikidataIngestOptions {
  overwrite?: boolean;
}

export async function ingestMovieBySearch(query: string, options?: WikidataIngestOptions): Promise<IngestResult> {
  // 1. Search for entity
  const searchResults = await wikidataClient.searchEntities(query);
  if (!searchResults.length) {
    throw new Error(`No Wikidata entity found for "${query}"`);
  }

  // Find the first one that looks like a film
  const entity = searchResults.find(r => 
    r.description?.toLowerCase().includes("film") || 
    r.description?.toLowerCase().includes("movie")
  ) || searchResults[0];

  const qid = entity.id;

  // 2. SPARQL enrichment
  const sparql = `
    SELECT ?film ?filmLabel ?imdbId ?tmdbId ?year ?runtime ?poster ?origLangLabel
           (GROUP_CONCAT(DISTINCT ?directorLabel; SEPARATOR="|") AS ?directors)
           (GROUP_CONCAT(DISTINCT ?castLabel; SEPARATOR="|") AS ?cast)
           (GROUP_CONCAT(DISTINCT ?genreLabel; SEPARATOR="|") AS ?genres)
           (GROUP_CONCAT(DISTINCT ?companyLabel; SEPARATOR="|") AS ?companies)
    WHERE {
      BIND(wd:${qid} AS ?film)
      # Ensure it's a film (Q11424) or 3D film (Q229390) etc. We won't strictly filter if we already found the QID,
      # but let's just get the props.
      
      OPTIONAL { ?film wdt:P345 ?imdbId }
      OPTIONAL { ?film wdt:P4947 ?tmdbId }
      OPTIONAL { ?film wdt:P18 ?poster }
      OPTIONAL { ?film wdt:P2047 ?runtime }
      OPTIONAL { ?film wdt:P577 ?pubDate. BIND(YEAR(?pubDate) AS ?year) }
      OPTIONAL { ?film wdt:P364 ?origLang }
      
      OPTIONAL { ?film wdt:P57 ?directorEntity }
      OPTIONAL { ?film wdt:P161 ?castEntity }
      OPTIONAL { ?film wdt:P136 ?genreEntity }
      OPTIONAL { ?film wdt:P272 ?companyEntity }
      
      SERVICE wikibase:label { 
        bd:serviceParam wikibase:language "en". 
        ?directorEntity rdfs:label ?directorLabel.
        ?castEntity rdfs:label ?castLabel.
        ?genreEntity rdfs:label ?genreLabel.
        ?companyEntity rdfs:label ?companyLabel.
        ?origLang rdfs:label ?origLangLabel.
      }
    }
    GROUP BY ?film ?filmLabel ?imdbId ?tmdbId ?year ?runtime ?poster ?origLangLabel
    LIMIT 1
  `;

  const rows = await wikidataClient.querySparql(sparql);
  if (!rows.length) {
    throw new Error(`Wikidata SPARQL returned no data for ${qid}`);
  }

  // 3. Map
  const payload = mapWikidataMovie(rows[0]);

  // 4. Ingest
  return ingestMovie(payload, options);
}
