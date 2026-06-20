import { getDb } from '../connection.js';
import { Reaction } from '../../../domain/index.js';
import type { ReactionType } from '../../../domain/index.js';
import { InternalError, NotFoundError, ConflictError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface ReactionRow {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

function rowToReaction(row: ReactionRow): Reaction {
  return new Reaction({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    reactionType: row.reaction_type as ReactionType,
    createdAt: new Date(row.created_at),
  });
}

function reactionToRow(reaction: Reaction): Omit<ReactionRow, 'id' | 'created_at'> {
  return {
    post_id: reaction.postId,
    user_id: reaction.userId,
    reaction_type: reaction.reactionType,
  };
}

export class ReactionRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findByPostIdAndUser(postId: string, userId: string): Promise<Reaction[]> {
    const rows = await this.db<ReactionRow>('reactions')
      .where({ post_id: postId, user_id: userId });

    return rows.map(rowToReaction);
  }

  async findByPostUserAndType(postId: string, userId: string, reactionType: ReactionType): Promise<Reaction | null> {
    const row = await this.db<ReactionRow>('reactions')
      .where({ post_id: postId, user_id: userId, reaction_type: reactionType })
      .first();

    if (!row) {
      return null;
    }
    return rowToReaction(row);
  }

  async countByPostId(postId: string): Promise<Record<string, number>> {
    const rows = await this.db<{ reaction_type: string }>('reactions')
      .select('reaction_type')
      .count('id as count')
      .where({ post_id: postId })
      .groupBy('reaction_type') as unknown as Array<{ reaction_type: string; count: string }>;

    const counts: Record<string, number> = { prayer: 0, heart: 0, amen: 0 };
    for (const row of rows) {
      counts[row.reaction_type] = Number(row.count);
    }
    return counts;
  }

  async create(reaction: Reaction): Promise<Reaction> {
    try {
      const [inserted] = await this.db<ReactionRow>('reactions')
        .insert({ id: reaction.id, ...reactionToRow(reaction) })
        .returning('*');

      if (!inserted) {
        throw new InternalError('Failed to create reaction');
      }

      return rowToReaction(inserted);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505') {
        throw new ConflictError('Already reacted with this reaction type');
      }
      throw error;
    }
  }

  async deleteByPostUserAndType(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
    const deleted = await this.db('reactions')
      .where({ post_id: postId, user_id: userId, reaction_type: reactionType })
      .del();

    if (!deleted) {
      throw new NotFoundError('Reaction');
    }
  }
}
