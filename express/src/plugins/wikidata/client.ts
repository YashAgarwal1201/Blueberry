/**
 * plugins/wikidata/client.ts
 *
 * HTTP wrappers for Wikidata APIs:
 * 1. wbsearchentities (Search API)
 * 2. query.wikidata.org (SPARQL endpoint)
 */

import crypto from "crypto";

const WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php";
const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

const USER_AGENT = "BlueberryApp/1.0 (dev; yash)";

export interface WikidataSearchResult {
  id: string; // e.g., "Q25188"
  title: string;
  label: string;
  description?: string;
}

export interface SparqlBinding {
  type: string;
  value: string;
  "xml:lang"?: string;
  datatype?: string;
}

export type SparqlRow = Record<string, SparqlBinding>;

export interface SparqlResponse {
  head: { vars: string[] };
  results: { bindings: SparqlRow[] };
}

/**
 * Helper to compute Wikimedia Commons image URL from filename
 */
export function wikimediaCommonsUrl(filename: string): string {
  const normalized = filename.replace(/ /g, "_");
  const hash = crypto.createHash("md5").update(normalized).digest("hex");
  return `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.substring(0, 2)}/${encodeURIComponent(normalized)}`;
}

export const wikidataClient = {
  /**
   * Search for an entity by title
   */
  async searchEntities(query: string, limit = 5): Promise<WikidataSearchResult[]> {
    const url = new URL(WIKIDATA_API_URL);
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("search", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    url.searchParams.set("type", "item");
    url.searchParams.set("limit", limit.toString());

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      throw new Error(`Wikidata API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as any;
    if (data.error) {
      throw new Error(`Wikidata API error: ${data.error.info}`);
    }

    return (data.search || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      label: item.label,
      description: item.description,
    }));
  },

  /**
   * Run a SPARQL query against Wikidata
   */
  async querySparql(sparql: string): Promise<SparqlRow[]> {
    const url = new URL(WIKIDATA_SPARQL_URL);
    url.searchParams.set("query", sparql);

    const res = await fetch(url.toString(), {
      headers: {
        "Accept": "application/sparql-results+json",
        "User-Agent": USER_AGENT,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Wikidata SPARQL error: ${res.status} ${text}`);
    }

    const data = await res.json() as SparqlResponse;
    return data.results.bindings;
  }
};
