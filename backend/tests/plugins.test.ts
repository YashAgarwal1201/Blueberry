import { mapTMDBMovie, mapTMDBTV } from '../src/plugins/tmdb/mapper';
import { mapWikidataMovie } from '../src/plugins/wikidata/mapper';
import { mapCSVRow } from '../src/plugins/csv/mapper';

describe('Plugins Data Mappers', () => {
  describe('TMDB Mapper', () => {
    it('correctly maps TMDB movie details to PluginMoviePayload', () => {
      const rawTMDBMovie: any = {
        id: 550,
        title: 'Fight Club',
        original_title: 'Fight Club',
        status: 'Released',
        overview: 'An insomniac office worker...',
        tagline: 'Mischief. Mayhem. Soap.',
        release_date: '1999-10-15',
        runtime: 139,
        budget: 63000000,
        revenue: 100853753,
        vote_average: 8.4,
        vote_count: 24000,
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
        original_language: 'en',
        imdb_id: 'tt0137523',
        genres: [{ id: 18, name: 'Drama' }],
        spoken_languages: [{ iso_639_1: 'en', name: 'English' }],
        credits: {
          cast: [
            { id: 819, name: 'Edward Norton', character: 'The Narrator', order: 0, profile_path: '/ed.jpg' }
          ],
          crew: [
            { id: 7467, name: 'David Fincher', job: 'Director', profile_path: '/fincher.jpg' }
          ]
        },
        production_companies: [
          { id: 508, name: 'Regency Enterprises' }
        ],
        keywords: {
          keywords: [{ id: 825, name: 'support group' }]
        }
      };

      const result = mapTMDBMovie(rawTMDBMovie);

      expect(result.title).toBe('Fight Club');
      expect(result.tmdb_id).toBe(550);
      expect(result.imdb_id).toBe('tt0137523');
      expect(result.release_year).toBe(1999);
      expect(result.status).toBe('released');
      expect(result.genre_slugs).toEqual(['drama']);
      expect(result.language_codes).toEqual(['en']);
      expect(result.cast).toHaveLength(2);
      expect(result.cast?.[0].name).toBe('Edward Norton');
      expect(result.cast?.[1].name).toBe('David Fincher');
      expect(result.cast?.[1].role).toBe('director');
    });

    it('correctly maps TMDB TV details to PluginTVPayload', () => {
      const rawTMDBTV: any = {
        id: 1399,
        name: 'Game of Thrones',
        original_name: 'Game of Thrones',
        status: 'Ended',
        overview: 'Seven noble families fight for control...',
        first_air_date: '2011-04-17',
        last_air_date: '2019-05-19',
        number_of_episodes: 73,
        number_of_seasons: 8,
        episode_run_time: [60],
        vote_average: 8.4,
        genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }],
        spoken_languages: [{ iso_639_1: 'en' }],
        networks: [{ name: 'HBO' }],
        aggregate_credits: {
          cast: [{ id: 1223, name: 'Emilia Clarke', roles: [{ character: 'Daenerys Targaryen' }] }],
          crew: []
        }
      };

      const result = mapTMDBTV(rawTMDBTV);

      expect(result.title).toBe('Game of Thrones');
      expect(result.tmdb_id).toBe(1399);
      expect(result.status).toBe('ended');
      expect(result.network).toBe('HBO');
      expect(result.episode_count).toBe(73);
      expect(result.season_count).toBe(8);
      expect(result.genre_slugs).toEqual(['sci-fi-fantasy']);
      expect(result.cast?.[0].name).toBe('Emilia Clarke');
    });
  });

  describe('Wikidata Mapper', () => {
    it('maps SPARQL query row to PluginMoviePayload', () => {
      const sparqlRow: any = {
        film: { value: 'http://www.wikidata.org/entity/Q137523' },
        filmLabel: { value: 'Fight Club' },
        year: { value: '1999' },
        genres: { value: 'drama film' },
        origLangLabel: { value: 'English' },
        imdbId: { value: 'tt0137523' },
        tmdbId: { value: '550' },
        directors: { value: 'David Fincher' }
      };

      const result = mapWikidataMovie(sparqlRow);

      expect(result.title).toBe('Fight Club');
      expect(result.wikidata_id).toBe('Q137523');
      expect(result.release_year).toBe(1999);
      expect(result.genre_slugs).toContain('drama');
      expect(result.language_codes).toContain('en');
      expect(result.cast?.some(c => c.name === 'David Fincher' && c.role === 'director')).toBe(true);
    });
  });

  describe('CSV Mapper', () => {
    it('maps TMDB Kaggle CSV row to PluginMoviePayload', () => {
      const csvRow: any = {
        id: '550',
        title: 'Fight Club',
        vote_average: '8.4',
        vote_count: '24000',
        status: 'Released',
        release_date: '1999-10-15',
        revenue: '100853753',
        runtime: '139',
        budget: '63000000',
        imdb_id: 'tt0137523',
        original_language: 'en',
        original_title: 'Fight Club',
        overview: 'An insomniac office worker...',
        tagline: 'Mischief. Mayhem. Soap.',
        genres: 'Drama, Thriller',
        production_companies: 'Fox 2000 Pictures, Regency Enterprises',
        production_countries: 'United States of America',
        spoken_languages: 'English',
        keywords: 'support group, dual identity'
      };

      const result = mapCSVRow(csvRow);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.title).toBe('Fight Club');
        expect(result.tmdb_id).toBe(550);
        expect(result.imdb_id).toBe('tt0137523');
        expect(result.release_year).toBe(1999);
        expect(result.genre_slugs).toEqual(['drama', 'thriller']);
        expect(result.language_codes).toEqual(['en']);
      }
    });

    it('returns null if adult content or invalid id', () => {
      expect(mapCSVRow({ id: '123', adult: 'true' } as any)).toBeNull();
      expect(mapCSVRow({ id: 'invalid-id' } as any)).toBeNull();
    });
  });
});
