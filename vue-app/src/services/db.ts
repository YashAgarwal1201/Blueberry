import Dexie, { type Table } from 'dexie';

export interface RecentSearch {
  id?: number;
  query: string;
  timestamp: number;
}

export class BlueberryDatabase extends Dexie {
  recentSearches!: Table<RecentSearch>;

  constructor() {
    super('BlueberryDB');
    this.version(1).stores({
      recentSearches: '++id, &query, timestamp'
    });
  }
}

export const db = new BlueberryDatabase();
