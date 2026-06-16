const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";
const API_KEY = "9507b0a863a21cc46c164d276aac6129";

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB returned ${res.status}`);
  return res.json();
}

function imageUrl(path: string | null, size = "w500"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// ─── SEARCH ──────────────────────────────────────────
export async function searchMovies(query: string, page = 1) {
  const data = await tmdbFetch("/search/movie", { query, page: String(page) });
  return {
    success: true,
    query,
    page: data.page,
    totalResults: data.total_results,
    totalPages: data.total_pages,
    results: data.results.map((m: any) => ({
      id: m.id,
      title: m.title,
      originalTitle: m.original_title,
      overview: m.overview,
      poster: imageUrl(m.poster_path),
      backdrop: imageUrl(m.backdrop_path),
      releaseDate: m.release_date,
      rating: m.vote_average,
      votes: m.vote_count,
      popularity: m.popularity,
      language: m.original_language,
    })),
  };
}

export async function searchTV(query: string, page = 1) {
  const data = await tmdbFetch("/search/tv", { query, page: String(page) });
  return {
    success: true,
    query,
    page: data.page,
    totalResults: data.total_results,
    results: data.results.map((t: any) => ({
      id: t.id,
      name: t.name,
      originalName: t.original_name,
      overview: t.overview,
      poster: imageUrl(t.poster_path),
      backdrop: imageUrl(t.backdrop_path),
      firstAirDate: t.first_air_date,
      rating: t.vote_average,
      votes: t.vote_count,
      popularity: t.popularity,
      language: t.original_language,
    })),
  };
}

export async function searchPeople(query: string, page = 1) {
  const data = await tmdbFetch("/search/person", { query, page: String(page) });
  return {
    success: true,
    query,
    page: data.page,
    totalResults: data.total_results,
    results: data.results.map((p: any) => ({
      id: p.id,
      name: p.name,
      profile: imageUrl(p.profile_path),
      knownFor: p.known_for_department,
      popularity: p.popularity,
      knownForTitles: (p.known_for || []).map((m: any) => m.title || m.name),
    })),
  };
}

// ─── TRENDING ────────────────────────────────────────
export async function getTrending(mediaType: "movie" | "tv" | "person" = "movie", timeWindow: "day" | "week" = "day") {
  const data = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
  return {
    success: true,
    mediaType,
    timeWindow,
    results: data.results.slice(0, 20).map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      overview: item.overview,
      poster: imageUrl(item.poster_path || item.profile_path),
      backdrop: imageUrl(item.backdrop_path),
      rating: item.vote_average,
      releaseDate: item.release_date || item.first_air_date,
    })),
  };
}

// ─── POPULAR ─────────────────────────────────────────
export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch("/movie/popular", { page: String(page) });
  return {
    success: true,
    page: data.page,
    results: data.results.map((m: any) => ({
      id: m.id, title: m.title, overview: m.overview,
      poster: imageUrl(m.poster_path), backdrop: imageUrl(m.backdrop_path),
      releaseDate: m.release_date, rating: m.vote_average, votes: m.vote_count,
    })),
  };
}

export async function getPopularTV(page = 1) {
  const data = await tmdbFetch("/tv/popular", { page: String(page) });
  return {
    success: true,
    page: data.page,
    results: data.results.map((t: any) => ({
      id: t.id, name: t.name, overview: t.overview,
      poster: imageUrl(t.poster_path), backdrop: imageUrl(t.backdrop_path),
      firstAirDate: t.first_air_date, rating: t.vote_average, votes: t.vote_count,
    })),
  };
}

// ─── NOW PLAYING / ON AIR ────────────────────────────
export async function getNowPlaying(page = 1) {
  const data = await tmdbFetch("/movie/now_playing", { page: String(page) });
  return { success: true, page: data.page, results: data.results.map((m: any) => ({
    id: m.id, title: m.title, overview: m.overview,
    poster: imageUrl(m.poster_path), releaseDate: m.release_date, rating: m.vote_average,
  }))};
}

export async function getOnAir(page = 1) {
  const data = await tmdbFetch("/tv/on_the_air", { page: String(page) });
  return { success: true, page: data.page, results: data.results.map((t: any) => ({
    id: t.id, name: t.name, overview: t.overview,
    poster: imageUrl(t.poster_path), firstAirDate: t.first_air_date, rating: t.vote_average,
  }))};
}

// ─── DETAILS ─────────────────────────────────────────
export async function getMovieDetails(movieId: number) {
  const data = await tmdbFetch(`/movie/${movieId}`);
  return { success: true,
    id: data.id, title: data.title, tagline: data.tagline, overview: data.overview,
    poster: imageUrl(data.poster_path), backdrop: imageUrl(data.backdrop_path, "original"),
    releaseDate: data.release_date, runtime: data.runtime, rating: data.vote_average,
    genres: data.genres?.map((g: any) => g.name),
    budget: data.budget, revenue: data.revenue,
    homepage: data.homepage, imdbId: data.imdb_id,
    productionCompanies: data.production_companies?.map((c: any) => c.name),
  };
}

export async function getTVDetails(tvId: number) {
  const data = await tmdbFetch(`/tv/${tvId}`);
  return { success: true,
    id: data.id, name: data.name, tagline: data.tagline, overview: data.overview,
    poster: imageUrl(data.poster_path), backdrop: imageUrl(data.backdrop_path, "original"),
    firstAirDate: data.first_air_date, lastAirDate: data.last_air_date,
    seasons: data.number_of_seasons, episodes: data.number_of_episodes,
    rating: data.vote_average, status: data.status,
    genres: data.genres?.map((g: any) => g.name),
    networks: data.networks?.map((n: any) => n.name),
    createdBy: data.created_by?.map((c: any) => c.name),
  };
}

// ─── GENRES ──────────────────────────────────────────
export async function getMovieGenres() {
  const data = await tmdbFetch("/genre/movie/list");
  return { success: true, genres: data.genres };
}

export async function getTVGenres() {
  const data = await tmdbFetch("/genre/tv/list");
  return { success: true, genres: data.genres };
}

export async function getMoviesByGenre(genreId: number, page = 1) {
  const data = await tmdbFetch("/discover/movie", { with_genres: String(genreId), page: String(page), sort_by: "popularity.desc" });
  return { success: true, genreId, page: data.page, results: data.results.map((m: any) => ({
    id: m.id, title: m.title, overview: m.overview,
    poster: imageUrl(m.poster_path), rating: m.vote_average, releaseDate: m.release_date,
  }))};
}

// ─── CREDITS (CAST & CREW) ──────────────────────────
export async function getMovieCredits(movieId: number) {
  const data = await tmdbFetch(`/movie/${movieId}/credits`);
  return { success: true, id: movieId,
    cast: (data.cast || []).slice(0, 20).map((c: any) => ({
      id: c.id, name: c.name, character: c.character,
      profile: imageUrl(c.profile_path), order: c.order,
    })),
    crew: (data.crew || []).filter((c: any) => ["Director", "Writer", "Producer"].includes(c.job)).map((c: any) => ({
      id: c.id, name: c.name, job: c.job, department: c.department,
    })),
  };
}

export async function getTVCredits(tvId: number) {
  const data = await tmdbFetch(`/tv/${tvId}/credits`);
  return { success: true, id: tvId,
    cast: (data.cast || []).slice(0, 20).map((c: any) => ({
      id: c.id, name: c.name, character: c.character,
      profile: imageUrl(c.profile_path),
    })),
  };
}

// ─── VIDEOS (TRAILERS) ──────────────────────────────
export async function getMovieVideos(movieId: number) {
  const data = await tmdbFetch(`/movie/${movieId}/videos`);
  return { success: true, id: movieId,
    videos: (data.results || []).map((v: any) => ({
      id: v.id, name: v.name, key: v.key, site: v.site,
      type: v.type, official: v.official,
      url: v.site === "YouTube" ? `https://www.youtube.com/watch?v=${v.key}` : null,
    })),
  };
}

export async function getTVVideos(tvId: number) {
  const data = await tmdbFetch(`/tv/${tvId}/videos`);
  return { success: true, id: tvId,
    videos: (data.results || []).map((v: any) => ({
      id: v.id, name: v.name, key: v.key, site: v.site, type: v.type,
      url: v.site === "YouTube" ? `https://www.youtube.com/watch?v=${v.key}` : null,
    })),
  };
}

// ─── WATCH PROVIDERS (STREAMING) ────────────────────
export async function getMovieWatchProviders(movieId: number) {
  const data = await tmdbFetch(`/movie/${movieId}/watch/providers`);
  const ke = data.results?.KE || data.results?.US || {};
  return { success: true, id: movieId,
    providers: {
      flatrate: (ke.flatrate || []).map((p: any) => ({ name: p.provider_name, logo: imageUrl(p.logo_path, "w45") })),
      rent: (ke.rent || []).map((p: any) => ({ name: p.provider_name, logo: imageUrl(p.logo_path, "w45") })),
      buy: (ke.buy || []).map((p: any) => ({ name: p.provider_name, logo: imageUrl(p.logo_path, "w45") })),
      link: ke.link,
    },
  };
}

export async function getTVWatchProviders(tvId: number) {
  const data = await tmdbFetch(`/tv/${tvId}/watch/providers`);
  const ke = data.results?.KE || data.results?.US || {};
  return { success: true, id: tvId,
    providers: {
      flatrate: (ke.flatrate || []).map((p: any) => ({ name: p.provider_name })),
      link: ke.link,
    },
  };
}

// ─── SIMILAR & RECOMMENDATIONS ──────────────────────
export async function getSimilarMovies(movieId: number) {
  const data = await tmdbFetch(`/movie/${movieId}/similar`);
  return { success: true, id: movieId, results: data.results.map((m: any) => ({
    id: m.id, title: m.title, overview: m.overview,
    poster: imageUrl(m.poster_path), rating: m.vote_average, releaseDate: m.release_date,
  }))};
}

export async function getMovieRecommendations(movieId: number) {
  const data = await tmdbFetch(`/movie/${movieId}/recommendations`);
  return { success: true, id: movieId, results: data.results.map((m: any) => ({
    id: m.id, title: m.title, overview: m.overview,
    poster: imageUrl(m.poster_path), rating: m.vote_average, releaseDate: m.release_date,
  }))};
}

// ─── IMAGES ─────────────────────────────────────────
export async function getMovieImages(movieId: number) {
  const data = await tmdbFetch(`/movie/${movieId}/images`);
  return { success: true, id: movieId,
    backdrops: (data.backdrops || []).slice(0, 10).map((b: any) => imageUrl(b.file_path, "original")),
    posters: (data.posters || []).slice(0, 10).map((p: any) => imageUrl(p.file_path, "w500")),
  };
}

// ─── DISCOVER ───────────────────────────────────────
export async function discoverMovies(params: Record<string, string>) {
  const data = await tmdbFetch("/discover/movie", { ...params, sort_by: params.sort_by || "popularity.desc" });
  return { success: true, page: data.page, totalResults: data.total_results, results: data.results.map((m: any) => ({
    id: m.id, title: m.title, overview: m.overview,
    poster: imageUrl(m.poster_path), backdrop: imageUrl(m.backdrop_path),
    rating: m.vote_average, releaseDate: m.release_date, genreIds: m.genre_ids,
  }))};
}

export async function discoverTV(params: Record<string, string>) {
  const data = await tmdbFetch("/discover/tv", { ...params, sort_by: params.sort_by || "popularity.desc" });
  return { success: true, page: data.page, totalResults: data.total_results, results: data.results.map((t: any) => ({
    id: t.id, name: t.name, overview: t.overview,
    poster: imageUrl(t.poster_path), backdrop: imageUrl(t.backdrop_path),
    rating: t.vote_average, firstAirDate: t.first_air_date, genreIds: t.genre_ids,
  }))};
}

// ─── SEASONS ────────────────────────────────────────
export async function getTVSeason(tvId: number, seasonNum: number) {
  const data = await tmdbFetch(`/tv/${tvId}/season/${seasonNum}`);
  return { success: true, id: tvId, season: seasonNum, name: data.name, overview: data.overview,
    poster: imageUrl(data.poster_path), airDate: data.air_date,
    episodes: (data.episodes || []).map((ep: any) => ({
      id: ep.id, name: ep.name, overview: ep.overview,
      episodeNumber: ep.episode_number, seasonNumber: ep.season_number,
      still: imageUrl(ep.still_path), airDate: ep.air_date, rating: ep.vote_average,
    })),
  };
}

// ─── PERSON ─────────────────────────────────────────
export async function getPersonDetails(personId: number) {
  const data = await tmdbFetch(`/person/${personId}`);
  return { success: true,
    id: data.id, name: data.name, biography: data.biography?.slice(0, 500),
    birthday: data.birthday, deathday: data.deathday,
    birthplace: data.place_of_birth, profile: imageUrl(data.profile_path),
    knownFor: data.known_for_department, popularity: data.popularity,
    homepage: data.homepage, imdbId: data.imdb_id,
  };
}

export async function getPersonMovies(personId: number) {
  const data = await tmdbFetch(`/person/${personId}/movie_credits`);
  return { success: true, id: personId,
    cast: (data.cast || []).sort((a: any, b: any) => b.popularity - a.popularity).slice(0, 30).map((m: any) => ({
      id: m.id, title: m.title, character: m.character,
      poster: imageUrl(m.poster_path), rating: m.vote_average, releaseDate: m.release_date,
    })),
  };
}

// ─── UPCOMING ───────────────────────────────────────
export async function getUpcoming(page = 1) {
  const data = await tmdbFetch("/movie/upcoming", { page: String(page) });
  return { success: true, page: data.page, totalResults: data.total_results,
    results: data.results.map((m: any) => ({
      id: m.id, title: m.title, overview: m.overview,
      poster: imageUrl(m.poster_path), backdrop: imageUrl(m.backdrop_path),
      releaseDate: m.release_date, rating: m.vote_average,
    })),
  };
}

// ─── TOP RATED ──────────────────────────────────────
export async function getTopRated(page = 1) {
  const data = await tmdbFetch("/movie/top_rated", { page: String(page) });
  return { success: true, page: data.page, totalResults: data.total_results,
    results: data.results.map((m: any) => ({
      id: m.id, title: m.title, overview: m.overview,
      poster: imageUrl(m.poster_path), rating: m.vote_average, votes: m.vote_count,
      releaseDate: m.release_date,
    })),
  };
}

// ─── REVIEWS ────────────────────────────────────────
export async function getMovieReviews(movieId: number, page = 1) {
  const data = await tmdbFetch(`/movie/${movieId}/reviews`, { page: String(page) });
  return { success: true, id: movieId, page: data.page, totalResults: data.total_results,
    reviews: (data.results || []).map((r: any) => ({
      id: r.id, author: r.author, content: r.content?.slice(0, 500),
      rating: r.author_details?.rating, url: r.url, createdAt: r.created_at,
    })),
  };
}
