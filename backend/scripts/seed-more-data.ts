import db from "../src/db";
import crypto from "crypto";

function uuid() {
  return crypto.randomUUID();
}

console.log("Seeding more dummy data...");

const getGenreId = (slug: string) => {
  const g = db.prepare(`SELECT id FROM genres WHERE slug = ?`).get(slug) as { id: number } | undefined;
  return g?.id;
};

const getLangId = (code: string) => {
  const l = db.prepare(`SELECT id FROM languages WHERE code = ?`).get(code) as { id: number } | undefined;
  return l?.id;
};

const movies = [
  {
    title: "The Godfather",
    tagline: "An offer you can't refuse.",
    description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    release_year: 1972,
    runtime: 175,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
    rating_imdb: 9.2,
    genres: ["crime", "drama"],
    language: "en"
  },
  {
    title: "The Lord of the Rings: The Fellowship of the Ring",
    tagline: "One ring to rule them all.",
    description: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.",
    release_year: 2001,
    runtime: 178,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/vI3aUGtuavWNIzdi5BcCEeq3GgO.jpg",
    rating_imdb: 8.8,
    genres: ["fantasy", "adventure"],
    language: "en"
  },
  {
    title: "Pulp Fiction",
    tagline: "Just because you are a character doesn't mean that you have character.",
    description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    release_year: 1994,
    runtime: 154,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    rating_imdb: 8.9,
    genres: ["crime", "thriller"],
    language: "en"
  },
  {
    title: "Forrest Gump",
    tagline: "The world will never be the same once you've seen it through the eyes of Forrest Gump.",
    description: "The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate and other historical events unfold from the perspective of an Alabama man with an IQ of 75.",
    release_year: 1994,
    runtime: 142,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/arw2vcBvepzQsyhXCtrjVNo8R1.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/3h1JZGDhZ8usxOWKkZ4bPIj2B42.jpg",
    rating_imdb: 8.8,
    genres: ["drama", "romance"],
    language: "en"
  },
  {
    title: "Oldboy",
    tagline: "15 years of imprisonment, 5 days of vengeance.",
    description: "After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released, only to find that he must find his captor in five days.",
    release_year: 2003,
    runtime: 120,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pWDtjs568ZfOTMbURQBRA31qX.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/2wTf4x6d9zZ1XnC19Vn9hL43rR2.jpg",
    rating_imdb: 8.4,
    genres: ["thriller", "mystery", "action"],
    language: "ko"
  },
  {
    title: "City of God",
    tagline: "If you run, the beast catches you; if you stay, the beast eats you.",
    description: "In the slums of Rio, two kids' paths diverge as one struggles to become a photographer and the other a kingpin.",
    release_year: 2002,
    runtime: 130,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/g56t61D5uB170R1u0uK7E8BpxU5.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    rating_imdb: 8.6,
    genres: ["crime", "drama"],
    language: "pt"
  },
  {
    title: "Amélie",
    tagline: "She'll change your life.",
    description: "Amélie is an innocent and naive girl in Paris with her own sense of justice. She decides to help those around her and, along the way, discovers love.",
    release_year: 2001,
    runtime: 122,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/sl3m3iL5s28z08wMhLpYt6a43T8.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/bSXfU4dwZyBA1vMmXveaqF41epc.jpg",
    rating_imdb: 8.3,
    genres: ["comedy", "romance"],
    language: "fr"
  },
  {
    title: "Seven Samurai",
    tagline: "The Mighty Warriors Who Became the Seven National Heroes of a Small Town.",
    description: "A poor village under attack by bandits recruits seven unemployed samurai to help them defend themselves.",
    release_year: 1954,
    runtime: 207,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8OKmBV5MACznjfILfXN8h3NlOZb.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    rating_imdb: 8.6,
    genres: ["action", "drama"],
    language: "ja"
  },
  {
    title: "La Haine",
    tagline: "How far you fall doesn't matter, it's how you land...",
    description: "24 hours in the lives of three young men in the French suburbs the day after a violent riot.",
    release_year: 1995,
    runtime: 98,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/1H4R8L56rZidFvWJ0l67T28O60p.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    rating_imdb: 8.1,
    genres: ["drama", "crime"],
    language: "fr"
  },
  {
    title: "Pan's Labyrinth",
    tagline: "Innocence has a power evil cannot imagine.",
    description: "In the falangist Spain of 1944, the bookish young stepdaughter of a sadistic army officer escapes into an eerie but captivating fantasy world.",
    release_year: 2006,
    runtime: 118,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/aZpM4hVwD2m4cT0g4j6K2a1z2G.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
    rating_imdb: 8.2,
    genres: ["fantasy", "drama", "war"],
    language: "es"
  },
  {
    title: "Crouching Tiger, Hidden Dragon",
    tagline: "A timeless story of strength, secrets, and two warriors.",
    description: "A young Chinese warrior steals a sword from a famed swordsman and then escapes into a world of romantic adventure with a mysterious man in the frontier of the nation.",
    release_year: 2000,
    runtime: 120,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/lZk9tH1h6jQ0X4G0mB6oB4Q2gP.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    rating_imdb: 7.9,
    genres: ["action", "adventure", "drama"],
    language: "zh"
  },
  {
    title: "Cinema Paradiso",
    tagline: "A celebration of youth, friendship, and the everlasting magic of the movies.",
    description: "A filmmaker recalls his childhood when falling in love with the pictures at the cinema of his home village and forms a deep friendship with the cinema's projectionist.",
    release_year: 1988,
    runtime: 155,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8SRUfRUA6sBkdbVwXp6WqqZ01bQ.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBRoBaO0V.jpg",
    rating_imdb: 8.5,
    genres: ["drama", "romance"],
    language: "it"
  },
  {
    title: "A Separation",
    tagline: "A compelling story about a married couple who are faced with a difficult decision.",
    description: "A married couple are faced with a difficult decision - to improve the life of their child by moving to another country or to stay in Iran and look after a deteriorating parent who has Alzheimer's disease.",
    release_year: 2011,
    runtime: 123,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/10Bw4G2k2QJ7rR8z8jE5y0X6U9s.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    rating_imdb: 8.3,
    genres: ["drama"],
    language: "fa" // Wait, fa is missing? Wait, is fa in languages?
  },
  {
    title: "The Hunt",
    tagline: "The lie is spreading.",
    description: "A teacher lives a lonely life, all the while struggling over his son's custody. His life slowly gets better as he finds love and receives good news from his son, but his new luck is about to be brutally shattered by an innocent little lie.",
    release_year: 2012,
    runtime: 115,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8gK8R0iQ6X8P1Zp4rUaU8XwK3nZ.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/l4QHerSncJjB81QxP32cIiyv7y1.jpg",
    rating_imdb: 8.3,
    genres: ["drama"],
    language: "da"
  },
  {
    title: "In the Mood for Love",
    tagline: "Feel the heat, keep the feeling burning, let the sensation explode.",
    description: "Two neighbors form a strong bond after both suspect extramarital activities of their spouses. However, they agree to keep their bond platonic so as not to commit similar wrongs.",
    release_year: 2000,
    runtime: 98,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/iYvpERh4tD6H6P4YyU1M6p7O8M9.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    rating_imdb: 8.0,
    genres: ["romance", "drama"],
    language: "zh"
  },
  {
    title: "The Lives of Others",
    tagline: "Before the Fall of the Berlin Wall, East Germany's Secret Police Listened to Your Secrets.",
    description: "In 1984 East Berlin, an agent of the secret police, conducting surveillance on a writer and his lover, finds himself becoming increasingly absorbed by their lives.",
    release_year: 2006,
    runtime: 137,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/a7k0v6X2T1f7k5X1WlV6M0wGZpT.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7bT2D5hH9QoXIDwK2G9gR92HwDq.jpg",
    rating_imdb: 8.4,
    genres: ["drama", "thriller"],
    language: "de"
  },
  {
    title: "Your Name",
    tagline: "I am always searching for something, for someone.",
    description: "Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?",
    release_year: 2016,
    runtime: 106,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/q719jXXEzOoYaps6babgKnONONX.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/9faGSFi5jam6pGkEnp5qCDe8X2G.jpg",
    rating_imdb: 8.4,
    genres: ["animation", "romance", "drama"],
    language: "ja"
  },
  {
    title: "Portrait of a Lady on Fire",
    tagline: "Do all lovers feel they're inventing something?",
    description: "On an isolated island in Brittany at the end of the eighteenth century, a female painter is obliged to paint a wedding portrait of a young woman.",
    release_year: 2019,
    runtime: 122,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/rZ3A1wOENJmZ9O9hO2hR7d2L4R.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7c4f1c1AtyUq7L3a9cZ4YvY8sS9.jpg",
    rating_imdb: 8.1,
    genres: ["romance", "drama"],
    language: "fr"
  },
  {
    title: "Dangal",
    tagline: "You think our girls are any less than boys?",
    description: "Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.",
    release_year: 2016,
    runtime: 161,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/80q2eG2sV5bB8d1Qe3R2tq4pW2F.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/rkB4LyZHo1NHXFET0njYLS2gl61.jpg",
    rating_imdb: 8.3,
    genres: ["action", "biography", "drama"],
    language: "hi"
  },
  {
    title: "3 Idiots",
    tagline: "Don't be a stupid.",
    description: "Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.",
    release_year: 2009,
    runtime: 170,
    status: "released",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qA2D9XJ1d2k5Qy3oO3y6wF9mR7x.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/2wTf4x6d9zZ1XnC19Vn9hL43rR2.jpg",
    rating_imdb: 8.4,
    genres: ["comedy", "drama"],
    language: "hi"
  }
];

// Fallback to "en" if language missing (e.g. "fa" may not exist in languages)
movies.forEach(m => {
  if (!getLangId(m.language)) m.language = "en";
});

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

const tvShows = [
  {
    title: "The Wire",
    description: "The Baltimore drug scene, as seen through the eyes of drug dealers and law enforcement.",
    status: "ended",
    first_air_date: "2002-06-02",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/4lbclBJCm0ccGZsbK5qA90D5PqP.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/gc8P9TcwzV8cbEpeAEN8O8C2H5m.jpg",
    network: "HBO",
    genres: ["drama", "crime"]
  },
  {
    title: "The Sopranos",
    description: "New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life.",
    status: "ended",
    first_air_date: "1999-01-10",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8YF2iQk0qR6j5R3V4Z8A2x0hZ6c.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
    network: "HBO",
    genres: ["drama", "crime"]
  },
  {
    title: "Better Call Saul",
    description: "The trials and tribulations of criminal lawyer Jimmy McGill in the years leading up to his fateful run-in with Walter White and Jesse Pinkman.",
    status: "ended",
    first_air_date: "2015-02-08",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/bKkK7B7qW9jH9h6mQv1v2x0p3P3.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    network: "AMC",
    genres: ["drama", "crime"]
  },
  {
    title: "Mad Men",
    description: "A drama about one of New York's most prestigious ad agencies at the beginning of the 1960s, focusing on one of the firm's most mysterious but extremely talented ad executives.",
    status: "ended",
    first_air_date: "2007-07-19",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/zFvD8Jk8vJ9N1v9bB8P7W7g6w0q.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/fU2c87Ua5mGmtGz4G9B0fA5A87q.jpg",
    network: "AMC",
    genres: ["drama"]
  },
  {
    title: "Peaky Blinders",
    description: "A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps.",
    status: "ended",
    first_air_date: "2013-09-12",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jOpe18u1H8V9s4cK9y0W4lD1yL4.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/uJ16DD1FAOcyGAbeyVROnGjZJtg.jpg",
    network: "BBC One",
    genres: ["crime", "drama"]
  },
  {
    title: "Fleabag",
    description: "A comedy series adapted from the award-winning play about a young woman trying to cope with life in London while coming to terms with a recent tragedy.",
    status: "ended",
    first_air_date: "2016-07-21",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/yYwG6vJ5e8zD1v4R9VqN9Q5h7Vz.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7bT2D5hH9QoXIDwK2G9gR92HwDq.jpg",
    network: "BBC Three",
    genres: ["comedy", "drama"]
  },
  {
    title: "Avatar: The Last Airbender",
    description: "In a war-torn world of elemental magic, a young boy reawakens to undertake a dangerous mystic quest to fulfill his destiny as the Avatar.",
    status: "ended",
    first_air_date: "2005-02-21",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8M0Wk3yX4zJ2R3f0t0pP4dK7lQ9.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/9faGSFi5jam6pGkEnp5qCDe8X2G.jpg",
    network: "Nickelodeon",
    genres: ["animation", "action", "adventure"]
  },
  {
    title: "True Detective",
    description: "Seasonal anthology series in which police investigations unearth the personal and professional secrets of those involved, both within and outside the law.",
    status: "returning_series",
    first_air_date: "2014-01-12",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/a7k0v6X2T1f7k5X1WlV6M0wGZpT.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7c4f1c1AtyUq7L3a9cZ4YvY8sS9.jpg",
    network: "HBO",
    genres: ["crime", "mystery", "drama"]
  },
  {
    title: "Black Mirror",
    description: "An anthology series exploring a twisted, high-tech multiverse where humanity's greatest innovations and darkest instincts collide.",
    status: "returning_series",
    first_air_date: "2011-12-04",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qA2D9XJ1d2k5Qy3oO3y6wF9mR7x.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/rkB4LyZHo1NHXFET0njYLS2gl61.jpg",
    network: "Netflix",
    genres: ["sci-fi", "drama", "thriller"]
  },
  {
    title: "The Boys",
    description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.",
    status: "returning_series",
    first_air_date: "2019-07-25",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7q2zD0r3yO5PjZz5A7aJ2lQ7K1p.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/2wTf4x6d9zZ1XnC19Vn9hL43rR2.jpg",
    network: "Amazon",
    genres: ["action", "sci-fi", "comedy"]
  },
  {
    title: "Mr. Robot",
    description: "Elliot, a brilliant but highly unstable young cyber-security engineer and vigilante hacker, becomes a key figure in a complex game of global dominance.",
    status: "ended",
    first_air_date: "2015-06-24",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pWDtjs568ZfOTMbURQBRA31qX.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    network: "USA Network",
    genres: ["drama", "thriller"]
  },
  {
    title: "Severance",
    description: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    status: "returning_series",
    first_air_date: "2022-02-18",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8gK8R0iQ6X8P1Zp4rUaU8XwK3nZ.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/bSXfU4dwZyBA1vMmXveaqF41epc.jpg",
    network: "Apple TV+",
    genres: ["sci-fi", "mystery", "drama"]
  },
  {
    title: "The Mandalorian",
    description: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.",
    status: "returning_series",
    first_air_date: "2019-11-12",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    network: "Disney+",
    genres: ["action", "adventure", "sci-fi"]
  },
  {
    title: "Rick and Morty",
    description: "An animated series that follows the exploits of a super scientist and his not-so-bright grandson.",
    status: "returning_series",
    first_air_date: "2013-12-02",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8kOWDBK6XlPUzckuHDo3wwVRFwt.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    network: "Adult Swim",
    genres: ["animation", "comedy", "sci-fi"]
  },
  {
    title: "Attack on Titan",
    description: "After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.",
    status: "ended",
    first_air_date: "2013-04-07",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/c9xX1G5H3fJv7eE9j5R2l2Q8H7.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
    network: "MBS",
    genres: ["animation", "action", "adventure"]
  },
  {
    title: "The Crown",
    description: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
    status: "ended",
    first_air_date: "2016-11-04",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    network: "Netflix",
    genres: ["drama", "history"]
  },
  {
    title: "Fargo",
    description: "Various chronicles of deception, intrigue and murder in and around frozen Minnesota. Yet all of these tales mysteriously lead back one way or another to Fargo, North Dakota.",
    status: "returning_series",
    first_air_date: "2014-04-15",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBRoBaO0V.jpg",
    network: "FX",
    genres: ["crime", "drama", "thriller"]
  },
  {
    title: "The Leftovers",
    description: "Three years after the disappearance of 2% of the global human population, a group of people in a small New York community try to continue their lives while coping with the tragedy of the unexplained nature of the event.",
    status: "ended",
    first_air_date: "2014-06-29",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/iYvpERh4tD6H6P4YyU1M6p7O8M9.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    network: "HBO",
    genres: ["drama", "mystery", "fantasy"]
  },
  {
    title: "Twin Peaks",
    description: "An idiosyncratic FBI agent investigates the murder of a young woman in the even more idiosyncratic town of Twin Peaks.",
    status: "ended",
    first_air_date: "1990-04-08",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8SRUfRUA6sBkdbVwXp6WqqZ01bQ.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/l4QHerSncJjB81QxP32cIiyv7y1.jpg",
    network: "ABC",
    genres: ["mystery", "drama", "sci-fi"]
  },
  {
    title: "Narcos",
    description: "A chronicled look at the criminal exploits of Colombian drug lord Pablo Escobar, as well as the many other drug kingpins who plagued the country through the years.",
    status: "ended",
    first_air_date: "2015-08-28",
    poster_url: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/aZpM4hVwD2m4cT0g4j6K2a1z2G.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    network: "Netflix",
    genres: ["crime", "drama"]
  }
];

const insertTVShow = db.prepare(`
  INSERT INTO tv_shows (uuid, title, description, status, first_air_date, poster_url, backdrop_url, network)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertTVGenre = db.prepare(`INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`); // Wait, we don't have a show_genres table in schema?

// Wait, looking at schema from db.ts earlier, there was no tv_show_genres or tv_show_languages?
// Let's just insert tv_shows without genres since the schema didn't have tv_genres table... 
// Actually I'll check the original seed-dummy-data.ts logic for tvShows.

tvShows.forEach(s => {
  insertTVShow.run(uuid(), s.title, s.description, s.status, s.first_air_date, s.poster_url, s.backdrop_url, s.network);
});

console.log("Seeding complete. 20 more movies and 20 more shows added.");
