import { getDb } from '../connection.js';
import { Devotional } from '../../../domain/index.js';
import { InternalError, NotFoundError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface DevotionalRow {
  id: string;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  closing_prayer: string;
  published_date: string;
  author: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

function rowToDevotional(row: DevotionalRow): Devotional {
  return new Devotional({
    id: row.id,
    title: row.title,
    scriptureReference: row.scripture_reference,
    scriptureText: row.scripture_text,
    reflection: row.reflection,
    closingPrayer: row.closing_prayer,
    publishedDate: new Date(row.published_date),
    author: row.author,
    isPublished: row.is_published,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function devotionalToRow(devotional: Devotional): Omit<DevotionalRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    title: devotional.title,
    scripture_reference: devotional.scriptureReference,
    scripture_text: devotional.scriptureText,
    reflection: devotional.reflection,
    closing_prayer: devotional.closingPrayer,
    published_date: devotional.publishedDate.toISOString().split('T')[0],
    author: devotional.author,
    is_published: devotional.isPublished,
  };
}

export class DevotionalRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findToday(date: Date = new Date()): Promise<Devotional | null> {
    const dateStr = date.toISOString().split('T')[0];
    const row = await this.db<DevotionalRow>('devotionals')
      .where('is_published', true)
      .where('published_date', '<=', dateStr)
      .orderBy('published_date', 'desc')
      .first();

    if (!row) {
      return null;
    }
    return rowToDevotional(row);
  }

  async findByDate(date: Date): Promise<Devotional | null> {
    const dateStr = date.toISOString().split('T')[0];
    const row = await this.db<DevotionalRow>('devotionals')
      .where('is_published', true)
      .where('published_date', dateStr)
      .first();

    if (!row) {
      return null;
    }
    return rowToDevotional(row);
  }

  async findArchive(limit: number = 30): Promise<DevotionalRow[]> {
    return this.db<DevotionalRow>('devotionals')
      .where('is_published', true)
      .orderBy('published_date', 'desc')
      .limit(limit);
  }

  async findById(id: string): Promise<Devotional | null> {
    const row = await this.db<DevotionalRow>('devotionals')
      .where({ id })
      .first();

    if (!row) {
      return null;
    }
    return rowToDevotional(row);
  }

  async create(devotional: Devotional): Promise<Devotional> {
    const [inserted] = await this.db<DevotionalRow>('devotionals')
      .insert({ id: devotional.id, ...devotionalToRow(devotional) })
      .returning('*');

    if (!inserted) {
      throw new InternalError('Failed to create devotional');
    }

    return rowToDevotional(inserted);
  }

  async update(devotional: Devotional): Promise<Devotional> {
    const [updated] = await this.db<DevotionalRow>('devotionals')
      .where({ id: devotional.id })
      .update({
        ...devotionalToRow(devotional),
        updated_at: new Date().toISOString(),
      })
      .returning('*');

    if (!updated) {
      throw new NotFoundError('Devotional');
    }

    return rowToDevotional(updated);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.db('devotionals')
      .where({ id })
      .del();

    if (!deleted) {
      throw new NotFoundError('Devotional');
    }
  }
}
