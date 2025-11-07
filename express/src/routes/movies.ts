// src/routes/movies.ts

import express, { Request, Response, Router } from "express";
import db from "../db";
import {
  Movie,
  MovieWithLanguages,
  Language,
  CreateMovieRequest,
  UpdateMovieRequest,
} from "../types.ts";

const router: Router = express.Router();

// Prepared statements for database queries
const insertMovieStmt = db.prepare(`
  INSERT INTO movies (title, description, release_year, director, poster_url, runtime)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const selectAllMoviesStmt = db.prepare(`
  SELECT id, title, description, release_year, director, poster_url, runtime, created_at, updated_at
  FROM movies
  ORDER BY created_at DESC
`);

const selectMovieByIdStmt = db.prepare(`
  SELECT id, title, description, release_year, director, poster_url, runtime, created_at, updated_at
  FROM movies
  WHERE id = ?
`);

const updateMovieStmt = db.prepare(`
  UPDATE movies
  SET title = ?, description = ?, release_year = ?, director = ?, poster_url = ?, runtime = ?, updated_at = datetime('now')
  WHERE id = ?
`);

const deleteMovieStmt = db.prepare(`DELETE FROM movies WHERE id = ?`);

const insertMovieLanguageStmt = db.prepare(`
  INSERT OR IGNORE INTO movie_languages (movie_id, language_id)
  VALUES (?, ?)
`);

const deleteMovieLanguagesStmt = db.prepare(`
  DELETE FROM movie_languages WHERE movie_id = ?
`);

const selectLanguagesByMovieStmt = db.prepare(`
  SELECT l.id, l.name, l.code
  FROM languages l
  INNER JOIN movie_languages ml ON l.id = ml.language_id
  WHERE ml.movie_id = ?
`);

// Attach languages to a single movie
function attachLanguagesToMovie(movie: Movie): MovieWithLanguages {
  const languages = selectLanguagesByMovieStmt.all(movie.id) as Language[];
  return {
    ...movie,
    languages,
  };
}

// Attach languages to multiple movies efficiently
function attachLanguagesToMovies(movies: Movie[]): MovieWithLanguages[] {
  const movieLanguagesMap = new Map<number, Language[]>();
  if (movies.length === 0) return [];

  const movieIds = movies.map((m) => m.id);

  // Get all languages for all movies in one query
  const allLanguages = db
    .prepare(
      `
      SELECT ml.movie_id, l.id, l.name, l.code
      FROM languages l
      INNER JOIN movie_languages ml ON l.id = ml.language_id
      WHERE ml.movie_id IN (${movieIds.map(() => "?").join(",")})
      `
    )
    .all(...movieIds) as Array<Language & { movie_id: number }>;

  // Build a map of movie_id to languages array
  allLanguages.forEach((lang) => {
    if (!movieLanguagesMap.has(lang.movie_id)) {
      movieLanguagesMap.set(lang.movie_id, []);
    }
    const { movie_id, ...language } = lang;
    movieLanguagesMap.get(lang.movie_id)!.push(language);
  });

  return movies.map((movie) => ({
    ...movie,
    languages: movieLanguagesMap.get(movie.id) || [],
  }));
}

// Validate language IDs against database
function validateLanguageIds(languageIds: number[]): number[] {
  if (!languageIds || languageIds.length === 0) return [];

  const validLanguages = db.prepare(`SELECT id FROM languages`).all() as {
    id: number;
  }[];

  const validIdSet = new Set(validLanguages.map((l) => l.id));
  const uniqueIds = [...new Set(languageIds)];

  return uniqueIds.filter((id) => validIdSet.has(id));
}

// GET /movies - Get all movies with optional filters
router.get("/", (req: Request, res: Response) => {
  try {
    const { search, language, year, sort = "recent" } = req.query;
    let movies = selectAllMoviesStmt.all() as Movie[];

    // Filter by search term
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      movies = movies.filter(
        (m) =>
          m.title.toLowerCase().includes(searchLower) ||
          (m.description && m.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by year
    if (year && typeof year === "string") {
      const yearNum = parseInt(year);
      movies = movies.filter((m) => m.release_year === yearNum);
    }

    let moviesWithLangs = attachLanguagesToMovies(movies);

    // Filter by language
    if (language && typeof language === "string") {
      moviesWithLangs = moviesWithLangs.filter((m) =>
        m.languages.some((l) => l.code === language)
      );
    }

    // Sort movies
    if (sort === "title") {
      moviesWithLangs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "year") {
      moviesWithLangs.sort(
        (a, b) => (b.release_year || 0) - (a.release_year || 0)
      );
    }

    res.json({
      success: true,
      count: moviesWithLangs.length,
      movies: moviesWithLangs,
    });
  } catch (err: any) {
    console.error("Error fetching movies:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch movies",
      message: err.message,
    });
  }
});

// GET /movies/:id - Get a single movie
router.get("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid movie ID",
      });
    }

    const movie = selectMovieByIdStmt.get(id) as Movie | undefined;
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      });
    }

    const movieWithLanguages = attachLanguagesToMovie(movie);
    res.json({
      success: true,
      movie: movieWithLanguages,
    });
  } catch (err: any) {
    console.error("Error fetching movie:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch movie",
      message: err.message,
    });
  }
});

// POST /movies - Create a new movie
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      release_year,
      director,
      poster_url,
      runtime,
      language_ids,
    } = req.body as CreateMovieRequest;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    if (
      release_year !== undefined &&
      (release_year < 1800 || release_year > new Date().getFullYear() + 5)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid release year",
      });
    }

    if (runtime !== undefined && runtime < 0) {
      return res.status(400).json({
        success: false,
        error: "Runtime must be a positive number",
      });
    }

    // Use transaction to ensure atomicity
    const result = db.transaction(() => {
      const info = insertMovieStmt.run(
        title.trim(),
        description?.trim() || "",
        release_year || null,
        director?.trim() || null,
        poster_url?.trim() || null,
        runtime || null
      );
      const movieId = info.lastInsertRowid as number;

      // Add language relationships
      if (language_ids && language_ids.length > 0) {
        const validIds = validateLanguageIds(language_ids);
        validIds.forEach((langId) => {
          insertMovieLanguageStmt.run(movieId, langId);
        });
      }

      const movie = selectMovieByIdStmt.get(movieId) as Movie;
      return attachLanguagesToMovie(movie);
    })();

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie: result,
    });
  } catch (err: any) {
    console.error("Error creating movie:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create movie",
      message: err.message,
    });
  }
});

// PUT /movies/:id - Update an existing movie
router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid movie ID",
      });
    }

    const existingMovie = selectMovieByIdStmt.get(id) as Movie | undefined;
    if (!existingMovie) {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      });
    }

    const {
      title,
      description,
      release_year,
      director,
      poster_url,
      runtime,
      language_ids,
    } = req.body as UpdateMovieRequest;

    // Merge with existing data
    const updatedTitle =
      title !== undefined ? title.trim() : existingMovie.title;
    const updatedDescription =
      description !== undefined
        ? description.trim()
        : existingMovie.description;
    const updatedYear =
      release_year !== undefined ? release_year : existingMovie.release_year;
    const updatedDirector =
      director !== undefined ? director?.trim() : existingMovie.director;
    const updatedPoster =
      poster_url !== undefined ? poster_url?.trim() : existingMovie.poster_url;
    const updatedRuntime =
      runtime !== undefined ? runtime : existingMovie.runtime;

    if (updatedTitle.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Title cannot be empty",
      });
    }

    // Use transaction to ensure atomicity
    const result = db.transaction(() => {
      updateMovieStmt.run(
        updatedTitle,
        updatedDescription || "",
        updatedYear || null,
        updatedDirector || null,
        updatedPoster || null,
        updatedRuntime || null,
        id
      );

      // Update languages if provided
      if (language_ids !== undefined) {
        deleteMovieLanguagesStmt.run(id);
        if (language_ids.length > 0) {
          const validIds = validateLanguageIds(language_ids);
          validIds.forEach((langId) => {
            insertMovieLanguageStmt.run(id, langId);
          });
        }
      }

      const movie = selectMovieByIdStmt.get(id) as Movie;
      return attachLanguagesToMovie(movie);
    })();

    res.json({
      success: true,
      message: "Movie updated successfully",
      movie: result,
    });
  } catch (err: any) {
    console.error("Error updating movie:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update movie",
      message: err.message,
    });
  }
});

// DELETE /movies/:id - Delete a movie
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid movie ID",
      });
    }

    const movie = selectMovieByIdStmt.get(id) as Movie | undefined;
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      });
    }

    const info = deleteMovieStmt.run(id);
    if (info.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      });
    }

    res.json({
      success: true,
      message: "Movie deleted successfully",
      deletedMovie: {
        id: movie.id,
        title: movie.title,
      },
    });
  } catch (err: any) {
    console.error("Error deleting movie:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete movie",
      message: err.message,
    });
  }
});

export default router;
