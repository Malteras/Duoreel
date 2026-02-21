/**
 * Paginated KV helpers
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase PostgREST has a server-level "Max Rows" cap (default 1000, currently
 * set to 10 000 in the project dashboard). The built-in kv.getByPrefix() issues
 * a single query and is therefore silently limited to that cap.
 *
 * These helpers paginate with .range() so they always return every matching row,
 * regardless of how large the collection grows.
 *
 * Two variants are provided:
 *   getByPrefixPaginated  – returns the full stored VALUES (array of objects)
 *   getKeysByPrefixPaginated – returns only the KEY strings (much lighter;
 *                              use when you only need IDs extracted from key suffixes)
 */

import { createClient } from "npm:@supabase/supabase-js";

const TABLE = "kv_store_5623fde1";
const PAGE_SIZE = 1000; // Fetch 1 000 rows per round-trip

function client() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Returns ALL stored values whose keys start with `prefix`.
 * Automatically issues multiple queries if the result set exceeds PAGE_SIZE.
 */
export async function getByPrefixPaginated(prefix: string): Promise<any[]> {
  const supabase = client();
  let allResults: { key: string; value: any }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("key, value")
      .like("key", prefix + "%")
      .range(from, from + PAGE_SIZE - 1)
      .order("key", { ascending: true });

    if (error) {
      throw new Error(`getByPrefixPaginated('${prefix}'): ${error.message}`);
    }

    if (!data || data.length === 0) break;

    allResults = allResults.concat(data);

    // Fewer rows than PAGE_SIZE → this was the last page
    if (data.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  console.log(`getByPrefixPaginated('${prefix}'): ${allResults.length} total rows`);
  return allResults.map((d) => d.value);
}

/**
 * Returns ALL matching KEY strings for the given prefix.
 * No value data is fetched — use this when you only need IDs extracted from
 * key suffixes (e.g. "watched:{userId}:{movieId}" → movieId).
 * Much lighter than getByPrefixPaginated for large collections.
 */
export async function getKeysByPrefixPaginated(prefix: string): Promise<string[]> {
  const supabase = client();
  let allKeys: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("key")
      .like("key", prefix + "%")
      .range(from, from + PAGE_SIZE - 1)
      .order("key", { ascending: true });

    if (error) {
      throw new Error(`getKeysByPrefixPaginated('${prefix}'): ${error.message}`);
    }

    if (!data || data.length === 0) break;

    allKeys = allKeys.concat(data.map((d: any) => d.key));

    if (data.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  console.log(`getKeysByPrefixPaginated('${prefix}'): ${allKeys.length} keys`);
  return allKeys;
}
