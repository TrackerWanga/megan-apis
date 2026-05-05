import axios from "axios";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ─── 1. OpenAlex — Academic Papers Search ──────────────────────────────────

export async function searchAcademicPapers(query: string, page = 1, perPage = 10) {
  const res = await axios.get("https://api.openalex.org/works", {
    params: { search: query, page, per_page: perPage },
    headers: { "User-Agent": UA, "Accept": "application/json" },
    timeout: 25000,
  });

  const data = res.data;
  const papers = (data.results || []).map((paper: any) => ({
    title: paper.title || paper.display_name,
    doi: paper.doi?.replace("https://doi.org/", "") || null,
    year: paper.publication_year,
    citedBy: paper.cited_by_count || 0,
    authors: (paper.authorships || []).slice(0, 5).map((a: any) => a.author?.display_name).filter(Boolean),
    openAccess: paper.open_access?.is_oa || false,
    url: paper.open_access?.oa_url || paper.primary_location?.landing_page_url || null,
    abstract: paper.abstract?.substring(0, 500) || null,
    type: paper.type || "article",
    language: paper.language,
  }));

  return {
    query,
    totalResults: data.meta?.count || 0,
    page,
    perPage,
    papers,
    source: "OpenAlex",
  };
}

// ─── 2. Open Library — Books Search ───────────────────────────────────────

export async function searchBooks(query: string, page = 1, limit = 10) {
  const res = await axios.get("https://openlibrary.org/search.json", {
    params: { q: query, page, limit },
    headers: { "User-Agent": UA, "Accept": "application/json" },
    timeout: 25000,
  });

  const data = res.data;
  const books = (data.docs || []).map((book: any) => ({
    title: book.title,
    author: book.author_name?.[0] || "Unknown",
    authors: book.author_name || [],
    year: book.first_publish_year || null,
    cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
    coverLarge: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null,
    key: book.key,
    url: `https://openlibrary.org${book.key}`,
    language: book.language?.[0] || null,
    subjects: book.subject?.slice(0, 5) || [],
    hasEbook: book.ebook_access !== "no_ebook",
    editionCount: book.edition_count || 0,
    publisher: book.publisher?.[0] || null,
  }));

  return {
    query,
    totalResults: data.numFound || 0,
    page,
    limit,
    books,
    source: "Open Library",
  };
}

// ─── 3. Dictionary — Word Lookup ──────────────────────────────────────────

export async function lookupWord(word: string) {
  const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
    headers: { "User-Agent": UA, "Accept": "application/json" },
    timeout: 10000,
  });

  const entries = res.data;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`Word "${word}" not found`);
  }

  const entry = entries[0];
  return {
    word: entry.word,
    phonetic: entry.phonetic || null,
    phonetics: (entry.phonetics || []).map((p: any) => ({
      text: p.text,
      audio: p.audio,
      source: p.sourceUrl,
    })),
    meanings: (entry.meanings || []).map((m: any) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions || []).slice(0, 5).map((d: any) => ({
        definition: d.definition,
        example: d.example || null,
        synonyms: d.synonyms?.slice(0, 5) || [],
        antonyms: d.antonyms?.slice(0, 5) || [],
      })),
    })),
    source: "Free Dictionary API",
  };
}

// ─── 4. Book Details by Key ───────────────────────────────────────────────

export async function getBookDetails(key: string) {
  // Remove /works/ prefix if present
  const cleanKey = key.replace("/works/", "");
  const res = await axios.get(`https://openlibrary.org/works/${cleanKey}.json`, {
    headers: { "User-Agent": UA, "Accept": "application/json" },
    timeout: 10000,
  });

  const book = res.data;
  return {
    title: book.title,
    description: typeof book.description === "string" ? book.description.substring(0, 500) : (book.description?.value || "").substring(0, 500),
    subjects: book.subjects?.slice(0, 10) || [],
    covers: book.covers?.map((id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`) || [],
    authors: (book.authors || []).slice(0, 5),
    key: book.key,
    revision: book.revision,
    source: "Open Library",
  };
}
