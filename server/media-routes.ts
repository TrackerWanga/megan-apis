import type { Express, Request, Response } from "express";
import * as tmdb from "../lib/downloaders/tmdb-api";
import * as funContent from "../lib/downloaders/fun-content";
import * as localTools from "../lib/downloaders/local-tools";

export function registerMediaRoutes(app: Express): void {
  
  // ─── TMDB SEARCH ──────────────────────────────────
  app.get("/api/tmdb/search/movies", async (req: Request, res: Response) => {
    try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" });
    const page = parseInt(req.query.page as string) || 1;
    const result = await tmdb.searchMovies(q, page); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/search/tv", async (req: Request, res: Response) => {
    try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" });
    const result = await tmdb.searchTV(q); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/search/people", async (req: Request, res: Response) => {
    try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" });
    const result = await tmdb.searchPeople(q); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB TRENDING ────────────────────────────────
  app.get("/api/tmdb/trending/:type/:time", async (req: Request, res: Response) => {
    try { const result = await tmdb.getTrending(req.params.type as any, req.params.time as any); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB POPULAR / NOW PLAYING / ON AIR ──────────
  app.get("/api/tmdb/popular/movies", async (req: Request, res: Response) => {
    try { const page = parseInt(req.query.page as string) || 1; const result = await tmdb.getPopularMovies(page); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/popular/tv", async (req: Request, res: Response) => {
    try { const page = parseInt(req.query.page as string) || 1; const result = await tmdb.getPopularTV(page); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/now-playing", async (req: Request, res: Response) => {
    try { const result = await tmdb.getNowPlaying(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/on-air", async (req: Request, res: Response) => {
    try { const result = await tmdb.getOnAir(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB DETAILS ─────────────────────────────────
  app.get("/api/tmdb/movie/:id", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMovieDetails(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/tv/:id", async (req: Request, res: Response) => {
    try { const result = await tmdb.getTVDetails(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB CREDITS / VIDEOS / PROVIDERS / SIMILAR ──
  app.get("/api/tmdb/movie/:id/credits", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMovieCredits(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/movie/:id/videos", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMovieVideos(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/movie/:id/providers", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMovieWatchProviders(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/movie/:id/similar", async (req: Request, res: Response) => {
    try { const result = await tmdb.getSimilarMovies(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/movie/:id/recommendations", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMovieRecommendations(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/movie/:id/images", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMovieImages(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/movie/:id/reviews", async (req: Request, res: Response) => {
    try { const page = parseInt(req.query.page as string) || 1; const result = await tmdb.getMovieReviews(parseInt(req.params.id), page); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB PERSON ──────────────────────────────────
  app.get("/api/tmdb/person/:id", async (req: Request, res: Response) => {
    try { const result = await tmdb.getPersonDetails(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/person/:id/movies", async (req: Request, res: Response) => {
    try { const result = await tmdb.getPersonMovies(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB UPCOMING / TOP RATED ────────────────────
  app.get("/api/tmdb/upcoming", async (req: Request, res: Response) => {
    try { const page = parseInt(req.query.page as string) || 1; const result = await tmdb.getUpcoming(page); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/top-rated", async (req: Request, res: Response) => {
    try { const page = parseInt(req.query.page as string) || 1; const result = await tmdb.getTopRated(page); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB GENRES ──────────────────────────────────
  app.get("/api/tmdb/genres/movies", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMovieGenres(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/genres/tv", async (req: Request, res: Response) => {
    try { const result = await tmdb.getTVGenres(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/genre/:id/movies", async (req: Request, res: Response) => {
    try { const result = await tmdb.getMoviesByGenre(parseInt(req.params.id)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/discover/movie", async (req: Request, res: Response) => {
    try { const result = await tmdb.discoverMovies(req.query as any); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tmdb/discover/tv", async (req: Request, res: Response) => {
    try { const result = await tmdb.discoverTV(req.query as any); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TMDB SEASONS ─────────────────────────────────
  app.get("/api/tmdb/tv/:id/season/:num", async (req: Request, res: Response) => {
    try { const result = await tmdb.getTVSeason(parseInt(req.params.id), parseInt(req.params.num)); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── FUN CONTENT ──────────────────────────────────
  app.get("/api/content/meme", async (req: Request, res: Response) => {
    try { const result = await funContent.getMeme(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/content/memes/:count", async (req: Request, res: Response) => {
    try { const result = await funContent.getMemes(parseInt(req.params.count) || 5); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/content/quote", async (req: Request, res: Response) => {
    try { const result = await funContent.getQuote(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/content/fact", async (req: Request, res: Response) => {
    try { const result = await funContent.getFact(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/content/cat-fact", async (req: Request, res: Response) => {
    try { const result = await funContent.getCatFact(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/content/riddle", async (req: Request, res: Response) => {
    try { const result = await funContent.getRiddle(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/content/trivia", async (req: Request, res: Response) => {
    try { const result = await funContent.getTrivia(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── LOCAL TOOLS ──────────────────────────────────
  app.get("/api/tools/age", async (req: Request, res: Response) => {
    try { const date = req.query.date as string; if (!date) return res.status(400).json({ error: "Missing date (YYYY-MM-DD)" });
    const result = localTools.getAge(date); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.post("/api/tools/word-count", async (req: Request, res: Response) => {
    try { const { text } = req.body; if (!text) return res.status(400).json({ error: "Missing text" });
    const result = localTools.wordCount(text); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tools/random-number", async (req: Request, res: Response) => {
    try { const min = parseInt(req.query.min as string) || 1; const max = parseInt(req.query.max as string) || 100;
    const result = localTools.randomNumber(min, max); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tools/coin-flip", async (req: Request, res: Response) => {
    try { const result = localTools.coinFlip(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tools/dice", async (req: Request, res: Response) => {
    try { const sides = parseInt(req.query.sides as string) || 6;
    const result = localTools.diceRoll(sides); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tools/slug", async (req: Request, res: Response) => {
    try { const text = req.query.text as string; if (!text) return res.status(400).json({ error: "Missing text" });
    const result = localTools.generateSlug(text); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/tools/lorem", async (req: Request, res: Response) => {
    try { const p = parseInt(req.query.paragraphs as string) || 3;
    const result = localTools.loremIpsum(p); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
}
