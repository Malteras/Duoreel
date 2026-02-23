export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CrewMember {
  job: string;
  name: string;
}

export interface CastMember {
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  overview: string;
  original_language?: string;
  popularity?: number;

  // Enriched fields (added after TMDB detail fetch)
  director?: string;
  actors?: string[];
  genres?: Genre[];
  genre_ids?: number[];
  runtime?: number;
  tagline?: string;
  budget?: number;
  revenue?: number;
  status?: string;
  homepage?: string;
  imdbRating?: string;

  external_ids?: {
    imdb_id?: string;
  };

  'watch/providers'?: {
    results?: {
      US?: {
        flatrate?: WatchProvider[];
      };
    };
  };

  // Credits (returned from detail endpoint, used during enrichment)
  credits?: {
    crew?: CrewMember[];
    cast?: CastMember[];
  };
}