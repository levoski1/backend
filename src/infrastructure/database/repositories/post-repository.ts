import { getDb } from '../connection.js';
import { Post, postTypeFromString } from '../../../domain/index.js';
import type { PostType } from '../../../domain/index.js';
import { InternalError, NotFoundError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface PostRow {
  id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  post_type: string;
  is_urgent: boolean;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
}

interface PostWithCountsRow extends PostRow {
  comment_count: string | number;
  reaction_counts: Record<string, number> | string;
  author_display_name?: string;
  author_avatar_url?: string;
}

function rowToPost(row: PostRow): Post {
  return new Post({
    id: row.id,
    userId: row.user_id,
    content: row.content,
    isAnonymous: row.is_anonymous,
    postType: postTypeFromString(row.post_type),
    isUrgent: row.is_urgent,
    allowComments: row.allow_comments,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function postToRow(post: Post): Omit<PostRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: post.userId,
    content: post.content,
    is_anonymous: post.isAnonymous,
    post_type: post.postType,
    is_urgent: post.isUrgent,
    allow_comments: post.allowComments,
  };
}

export class PostRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findById(id: string): Promise<Post | null> {
    const row = await this.db<PostRow>('posts')
      .where({ id })
      .first();

    if (!row) {
      return null;
    }
    return rowToPost(row);
  }

  async findByIdWithRelations(id: string): Promise<{
    post: Post;
    commentCount: number;
    reactionCounts: Record<string, number>;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
  } | null> {
    const row = await this.db<PostWithCountsRow>('posts')
      .select(
        'posts.*',
        this.db.raw(`(
          SELECT CAST(COUNT(*) AS INTEGER)
          FROM comments
          WHERE comments.post_id = posts.id
        ) as comment_count`),
        this.db.raw(`(
          SELECT COALESCE(
            jsonb_build_object(
              'prayer', COUNT(*) FILTER (WHERE reaction_type = 'prayer'),
              'heart', COUNT(*) FILTER (WHERE reaction_type = 'heart'),
              'amen', COUNT(*) FILTER (WHERE reaction_type = 'amen')
            ),
            '{"prayer": 0, "heart": 0, "amen": 0}'::jsonb
          )
          FROM reactions
          WHERE reactions.post_id = posts.id
        ) as reaction_counts`),
        this.db.raw('profiles.display_name as author_display_name'),
        this.db.raw('COALESCE(profiles.avatar_url, users.profile_photo_url) as author_avatar_url'),
      )
      .leftJoin('profiles', 'profiles.user_id', 'posts.user_id')
      .leftJoin('users', 'users.id', 'posts.user_id')
      .where('posts.id', id)
      .first();

    if (!row) {
      return null;
    }

    const reactionCounts = typeof row.reaction_counts === 'string'
      ? JSON.parse(row.reaction_counts)
      : row.reaction_counts;

    return {
      post: rowToPost(row),
      commentCount: Number(row.comment_count),
      reactionCounts,
      authorDisplayName: row.author_display_name ?? undefined,
      authorAvatarUrl: row.author_avatar_url ?? undefined,
    };
  }

  async findFeed(params: {
    limit: number;
    cursor?: string;
    sort?: 'recent' | 'trending';
    type?: PostType;
  }): Promise<Array<{
    post: Post;
    commentCount: number;
    reactionCounts: Record<string, number>;
    authorDisplayName?: string;
    authorAvatarUrl?: string;
    trendingScore?: number;
  }>> {
    const { limit, cursor, sort, type } = params;

    let query = this.db<PostWithCountsRow>('posts')
      .select(
        'posts.*',
        this.db.raw(`(
          SELECT CAST(COUNT(*) AS INTEGER)
          FROM comments
          WHERE comments.post_id = posts.id
        ) as comment_count`),
        this.db.raw(`(
          SELECT COALESCE(
            jsonb_build_object(
              'prayer', COUNT(*) FILTER (WHERE reaction_type = 'prayer'),
              'heart', COUNT(*) FILTER (WHERE reaction_type = 'heart'),
              'amen', COUNT(*) FILTER (WHERE reaction_type = 'amen')
            ),
            '{"prayer": 0, "heart": 0, "amen": 0}'::jsonb
          )
          FROM reactions
          WHERE reactions.post_id = posts.id
        ) as reaction_counts`),
        this.db.raw('profiles.display_name as author_display_name'),
        this.db.raw('COALESCE(profiles.avatar_url, users.profile_photo_url) as author_avatar_url'),
      )
      .leftJoin('profiles', 'profiles.user_id', 'posts.user_id')
      .leftJoin('users', 'users.id', 'posts.user_id');

    if (type) {
      query = query.where('posts.post_type', type);
    }

    if (cursor) {
      const cursorDate = new Date(cursor);

      if (sort === 'trending') {
        query = query.whereRaw(
          `(
            SELECT (COUNT(*) * 2)::float
            FROM reactions WHERE reactions.post_id = posts.id
          ) + (
            SELECT COUNT(*)::float
            FROM comments WHERE comments.post_id = posts.id
          ) / (EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 3600 + 2) < (
            SELECT (
              SELECT (COUNT(*) * 2)::float
              FROM reactions WHERE reactions.post_id = p2.id
            ) + (
              SELECT COUNT(*)::float
              FROM comments WHERE comments.post_id = p2.id
            ) / (EXTRACT(EPOCH FROM (NOW() - p2.created_at)) / 3600 + 2)
            FROM posts p2 WHERE p2.id = ?
          )`,
          [cursor],
        );
      } else {
        query = query.where('posts.created_at', '<', cursorDate.toISOString());
      }
    }

    if (sort === 'trending') {
      query = query.orderByRaw(
        `(
          SELECT (COUNT(*) * 2)::float
          FROM reactions WHERE reactions.post_id = posts.id
        ) + (
          SELECT COUNT(*)::float
          FROM comments WHERE comments.post_id = posts.id
        ) / (EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 3600 + 2) DESC`,
      );
    } else {
      query = query.orderBy('posts.created_at', 'desc');
    }

    query = query.limit(limit + 1);

    const rows = await query;

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return items.map((row) => {
      const reactionCounts = typeof row.reaction_counts === 'string'
        ? JSON.parse(row.reaction_counts)
        : row.reaction_counts;

      const totalReactions = Object.values(reactionCounts).reduce(
        (sum: number, count: unknown) => sum + Number(count),
        0,
      );

      const hoursSinceCreation = (Date.now() - new Date(row.created_at).getTime()) / 3600000;
      const trendingScore = (totalReactions * 2 + Number(row.comment_count)) / (hoursSinceCreation + 2);

      return {
        post: rowToPost(row),
        commentCount: Number(row.comment_count),
        reactionCounts,
        authorDisplayName: row.author_display_name ?? undefined,
        authorAvatarUrl: row.author_avatar_url ?? undefined,
        trendingScore,
      };
    });
  }

  async findCursorForPage(params: {
    limit: number;
    cursor?: string;
    sort?: 'recent' | 'trending';
    type?: PostType;
  }): Promise<{ nextCursor: string | null }> {
    const limit = params.limit;

    const results = await this.findFeed({
      limit,
      cursor: params.cursor,
      sort: params.sort,
      type: params.type,
    });

    const hasMore = results.length > limit;

    if (!hasMore) {
      return { nextCursor: null };
    }

    const lastItem = results[limit - 1];

    if (!lastItem) {
      return { nextCursor: null };
    }

    return { nextCursor: lastItem.post.createdAt.toISOString() };
  }

  async create(post: Post): Promise<Post> {
    const [inserted] = await this.db<PostRow>('posts')
      .insert({ id: post.id, ...postToRow(post) })
      .returning('*');

    if (!inserted) {
      throw new InternalError('Failed to create post');
    }

    return rowToPost(inserted);
  }

  async update(post: Post): Promise<Post> {
    const [updated] = await this.db<PostRow>('posts')
      .where({ id: post.id })
      .update({
        content: post.content,
        updated_at: new Date().toISOString(),
      })
      .returning('*');

    if (!updated) {
      throw new NotFoundError('Post');
    }

    return rowToPost(updated);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.db('posts')
      .where({ id })
      .del();

    if (!deleted) {
      throw new NotFoundError('Post');
    }
  }
}
