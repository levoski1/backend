import { getDb } from '../connection.js';
import { Comment } from '../../../domain/index.js';
import { InternalError, NotFoundError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
}

interface CommentWithAuthorRow extends CommentRow {
  author_display_name?: string;
  author_avatar_url?: string;
}

function rowToComment(row: CommentRow): Comment {
  return new Comment({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    isAnonymous: row.is_anonymous,
    createdAt: new Date(row.created_at),
  });
}

function commentToRow(comment: Comment): Omit<CommentRow, 'id' | 'created_at'> {
  return {
    post_id: comment.postId,
    user_id: comment.userId,
    content: comment.content,
    is_anonymous: comment.isAnonymous,
  };
}

export class CommentRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findById(id: string): Promise<Comment | null> {
    const row = await this.db<CommentRow>('comments')
      .where({ id })
      .first();

    if (!row) {
      return null;
    }
    return rowToComment(row);
  }

  async findByPostId(postId: string): Promise<Array<{
    comment: Comment;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
  }>> {
    const rows = await this.db<CommentWithAuthorRow>('comments')
      .select(
        'comments.*',
        this.db.raw('profiles.display_name as author_display_name'),
        this.db.raw('COALESCE(profiles.avatar_url, users.profile_photo_url) as author_avatar_url'),
      )
      .leftJoin('profiles', 'profiles.user_id', 'comments.user_id')
      .leftJoin('users', 'users.id', 'comments.user_id')
      .where('comments.post_id', postId)
      .orderBy('comments.created_at', 'asc');

    return rows.map((row) => ({
      comment: rowToComment(row),
      authorDisplayName: row.author_display_name ?? undefined,
      authorAvatarUrl: row.author_avatar_url ?? undefined,
    }));
  }

  async countByPostId(postId: string): Promise<number> {
    const result = await this.db('comments')
      .where({ post_id: postId })
      .count<{ count: string }>('id as count')
      .first();

    return Number(result?.count ?? 0);
  }

  async create(comment: Comment): Promise<Comment> {
    const [inserted] = await this.db<CommentRow>('comments')
      .insert({ id: comment.id, ...commentToRow(comment) })
      .returning('*');

    if (!inserted) {
      throw new InternalError('Failed to create comment');
    }

    return rowToComment(inserted);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.db('comments')
      .where({ id })
      .del();

    if (!deleted) {
      throw new NotFoundError('Comment');
    }
  }
}
