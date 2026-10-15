import db from "../src/db";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function uuid() {
  return crypto.randomUUID();
}

console.log("Seeding dummy data...");

// Clear existing movie/TV data (watch out, better auth is unaffected)
db.exec(`
  DELETE FROM movie_cast;
  DELETE FROM movie_genres;
  DELETE FROM movie_languages;
  DELETE FROM movie_companies;
  DELETE FROM collection_movies;
  DELETE FROM watchlist;
  DELETE FROM movies;
  DELETE FROM tv_episodes;
  DELETE FROM tv_seasons;
  DELETE FROM tv_shows;
  DELETE FROM people;
  DELETE FROM collections;
  DELETE FROM companies;
`);

// Languages & Genres are seeded in db.ts, so we reuse them.
const getGenreId = (slug: string) => {
  const g = db.prepare(`SELECT id FROM genres WHERE slug = ?`).get(slug) as { id: number } | undefined;
  return g?.id;
};

const getLangId = (code: string) => {
  const l = db.prepare(`SELECT id FROM languages WHERE code = ?`).get(code) as { id: number } | undefined;
  return l?.id;
};

// ── Dummy Movies ─────────────────────────────────────────────────────────────
const movies = [
  {
    title: "Interstellar",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    release_year: 2014,
    runtime: 169,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    rating_imdb: 8.6,
    genres: ["sci-fi", "drama", "adventure"],
    language: "en"
  },
  {
    title: "The Dark Knight",
    tagline: "Welcome to a world without rules.",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    release_year: 2008,
    runtime: 152,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    rating_imdb: 9.0,
    genres: ["action", "crime", "drama"],
    language: "en"
  },
  {
    title: "Spirited Away",
    tagline: "Nothing that happens is ever forgotten, even if you can't remember it.",
    description: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
    release_year: 2001,
    runtime: 125,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/39wmItIWsg5sZMyRUHLkBg8tz6v.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/bSXfU4dwZyBA1vMmXveaqF41epc.jpg",
    rating_imdb: 8.6,
    genres: ["animation", "family", "fantasy"],
    language: "ja"
  },
  {
    title: "Parasite",
    tagline: "Act like you own the place.",
    description: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    release_year: 2019,
    runtime: 132,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
    rating_imdb: 8.5,
    genres: ["comedy", "thriller", "drama"],
    language: "ko"
  },
  {
    title: "Dune: Part Two",
    tagline: "Long live the fighters.",
    description: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    release_year: 2024,
    runtime: 166,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/1pdfLvkbY9ohJlCjQH2JGjjc9CW.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    rating_imdb: 8.6,
    genres: ["sci-fi", "adventure"],
    language: "en"
  },
  {
    title: "Spider-Man: Across the Spider-Verse",
    tagline: "It's how you wear the mask that matters",
    description: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    release_year: 2023,
    runtime: 140,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    rating_imdb: 8.6,
    genres: ["animation", "action", "adventure"],
    language: "en"
  },
  {
    title: "Oppenheimer",
    tagline: "The world forever changes.",
    description: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    release_year: 2023,
    runtime: 181,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBRoBaO0V.jpg",
    rating_imdb: 8.4,
    genres: ["drama", "history"],
    language: "en"
  },
  {
    title: "Inception",
    tagline: "Your mind is the scene of the crime.",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    release_year: 2010,
    runtime: 148,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    rating_imdb: 8.8,
    genres: ["action", "sci-fi", "thriller"],
    language: "en"
  },
  {
    title: "The Matrix",
    tagline: "Welcome to the Real World.",
    description: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
    release_year: 1999,
    runtime: 136,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/l4QHerSncJjB81QxP32cIiyv7y1.jpg",
    rating_imdb: 8.7,
    genres: ["action", "sci-fi"],
    language: "en"
  },
  {
    title: "Avengers: Endgame",
    tagline: "Part of the journey is the end.",
    description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
    release_year: 2019,
    runtime: 181,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    rating_imdb: 8.4,
    genres: ["adventure", "sci-fi", "action"],
    language: "en"
  }
];

const insertMovie = db.prepare(`
  INSERT INTO movies (uuid, title, tagline, description, release_year, runtime, status, poster_url, backdrop_url, rating_imdb)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertMovieLang = db.prepare(`INSERT INTO movie_languages (movie_id, language_id) VALUES (?, ?)`);
const insertMovieGenre = db.prepare(`INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`);

movies.forEach(m => {
  const mId = insertMovie.run(uuid(), m.title, m.tagline, m.description, m.release_year, m.runtime, m.status, m.poster_url, m.backdrop_url, m.rating_imdb).lastInsertRowid;
  const lId = getLangId(m.language);
  if (lId) insertMovieLang.run(mId, lId);
  m.genres.forEach(g => {
    const gId = getGenreId(g);
    if (gId) insertMovieGenre.run(mId, gId);
  });
});

// ── Dummy TV Shows ───────────────────────────────────────────────────────────
const tvShows = [
  {
    title: "Breaking Bad",
    description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
    status: "ended",
    first_air_date: "2008-01-20",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/gc8P9TcwzV8cbEpeAEN8O8C2H5m.jpg",
    network: "AMC",
    genres: ["drama", "crime"]
  },
  {
    title: "Game of Thrones",
    description: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.",
    status: "ended",
    first_air_date: "2011-04-17",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
    network: "HBO",
    genres: ["sci-fi", "drama", "action"] // sci-fi/fantasy
  },
  {
    title: "Stranger Things",
    description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
    status: "returning_series",
    first_air_date: "2016-07-15",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/49WJfeN0moxb9IPfGn8m1MgdYMl.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    network: "Netflix",
    genres: ["sci-fi", "mystery", "drama"]
  },
  {
    title: "The Office",
    description: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
    status: "ended",
    first_air_date: "2005-03-24",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7DJEzvLhHkOPDqE677F580T7D8C.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/fU2c87Ua5mGmtGz4G9B0fA5A87q.jpg",
    network: "NBC",
    genres: ["comedy"]
  },
  {
    title: "Chernobyl",
    description: "The true story of one of the worst man-made catastrophes in history: the catastrophic nuclear accident at Chernobyl. A tale of the brave men and women who sacrificed to save Europe from unimaginable disaster.",
    status: "ended",
    first_air_date: "2019-05-06",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/hlLXt2tOPT6RRnjiUmFyg0y4tGq.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/uJ16DD1FAOcyGAbeyVROnGjZJtg.jpg",
    network: "HBO",
    genres: ["drama", "history"]
  },
  {
    title: "Succession",
    description: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company.",
    status: "ended",
    first_air_date: "2018-06-03",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7uqTGscF7qF6522x7i8bKkL4iQf.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7bT2D5hH9QoXIDwK2G9gR92HwDq.jpg",
    network: "HBO",
    genres: ["drama", "comedy"]
  },
  {
    title: "The Last of Us",
    description: "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.",
    status: "returning_series",
    first_air_date: "2023-01-15",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uKvVjHNqB5pWQSuuOQImdG6j4P7.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/9faGSFi5jam6pGkEnp5qCDe8X2G.jpg",
    network: "HBO",
    genres: ["drama", "action", "sci-fi"]
  },
  {
    title: "Dark",
    description: "A family saga with a supernatural twist, set in a German town, where the disappearance of two young children exposes the relationships among four families.",
    status: "ended",
    first_air_date: "2017-12-01",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7c4f1c1AtyUq7L3a9cZ4YvY8sS9.jpg",
    network: "Netflix",
    genres: ["sci-fi", "mystery", "drama"]
  },
  {
    title: "Arcane",
    description: "Set in utopian Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.",
    status: "returning_series",
    first_air_date: "2021-11-06",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/rkB4LyZHo1NHXFET0njYLS2gl61.jpg",
    network: "Netflix",
    genres: ["animation", "action", "sci-fi"]
  },
  {
    title: "The Bear",
    description: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop.",
    status: "returning_series",
    first_air_date: "2022-06-23",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/6bMUB3WnC0iZc17qJ3G2nE9A3hW.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/2wTf4x6d9zZ1XnC19Vn9hL43rR2.jpg",
    network: "FX",
    genres: ["drama", "comedy"]
  }
];

const insertTVShow = db.prepare(`
  INSERT INTO tv_shows (uuid, title, description, status, first_air_date, poster_url, backdrop_url, network)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

tvShows.forEach(s => {
  insertTVShow.run(uuid(), s.title, s.description, s.status, s.first_air_date, s.poster_url, s.backdrop_url, s.network);
});

console.log("Seeding complete. 10 movies and 10 shows generated.");
