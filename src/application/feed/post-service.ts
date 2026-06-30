import crypto from 'node:crypto';
import { Post, PostType } from '../../domain/index.js';
import { PostRepository } from '../../infrastructure/database/repositories/post-repository.js';
import { NotFoundError, AuthorizationError } from '../../shared/errors/index.js';

export interface CreatePostParams {
  userId: string;
  content: string;
  isAnonymous?: boolean;
  allowComments?: boolean;
  isUrgent?: boolean;
  postType: PostType;
}

export interface UpdatePostParams {
  content: string;
}

export interface FeedQueryParams {
  limit: number;
  cursor?: string;
  sort?: 'recent' | 'trending';
  type?: PostType;
}

export class PostService {
  constructor(
    private readonly postRepo: PostRepository = new PostRepository(),
  ) {}

  async createPost(params: CreatePostParams) {
    const post = Post.create({
      id: crypto.randomUUID(),
      userId: params.userId,
      content: params.content,
      isAnonymous: params.isAnonymous ?? false,
      isUrgent: params.isUrgent ?? false,
      allowComments: params.allowComments ?? true,
      postType: params.postType,
    });

    const created = await this.postRepo.create(post);
    const result = await this.postRepo.findByIdWithRelations(created.id);

    if (!result) {
      throw new Error('Failed to retrieve created post');
    }

    const displayName = result.post.isAnonymous
      ? 'A Shelter Member'
      : (result.authorDisplayName ?? 'A Shelter Member');

    return {
      id: result.post.id,
      userId: result.post.userId,
      content: result.post.content,
      isAnonymous: result.post.isAnonymous,
      isUrgent: result.post.isUrgent,
      allowComments: result.post.allowComments,
      postType: result.post.postType,
      authorDisplayName: displayName,
      authorAvatarUrl: result.post.isAnonymous ? null : (result.authorAvatarUrl ?? null),
      commentCount: result.commentCount,
      reactionCounts: result.reactionCounts,
      createdAt: result.post.createdAt,
      updatedAt: result.post.updatedAt,
    };
  }

  async getFeed(params: FeedQueryParams) {
    const { nextCursor } = await this.postRepo.findCursorForPage(params);

    const results = await this.postRepo.findFeed(params);

    const items = results.map((item) => {
      const displayName = item.post.isAnonymous
        ? 'A Shelter Member'
        : (item.authorDisplayName ?? 'A Shelter Member');

      return {
        id: item.post.id,
        userId: item.post.userId,
        content: item.post.content,
        isAnonymous: item.post.isAnonymous,
        isUrgent: item.post.isUrgent,
        allowComments: item.post.allowComments,
        postType: item.post.postType,
        authorDisplayName: displayName,
        authorAvatarUrl: item.post.isAnonymous ? null : (item.authorAvatarUrl ?? null),
        commentCount: item.commentCount,
        reactionCounts: item.reactionCounts,
        createdAt: item.post.createdAt,
        updatedAt: item.post.updatedAt,
      };
    });

    return {
      items,
      pagination: {
        nextCursor,
        hasMore: nextCursor !== null,
      },
    };
  }

  async getPost(postId: string) {
    const result = await this.postRepo.findByIdWithRelations(postId);

    if (!result) {
      throw new NotFoundError('Post');
    }

    const displayName = result.post.isAnonymous
      ? 'A Shelter Member'
      : (result.authorDisplayName ?? 'A Shelter Member');

    return {
      id: result.post.id,
      userId: result.post.userId,
      content: result.post.content,
      isAnonymous: result.post.isAnonymous,
      isUrgent: result.post.isUrgent,
      allowComments: result.post.allowComments,
      postType: result.post.postType,
      authorDisplayName: displayName,
      authorAvatarUrl: result.post.isAnonymous ? null : (result.authorAvatarUrl ?? null),
      commentCount: result.commentCount,
      reactionCounts: result.reactionCounts,
      createdAt: result.post.createdAt,
      updatedAt: result.post.updatedAt,
    };
  }

  async updatePost(postId: string, userId: string, params: UpdatePostParams) {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (!post.isOwnedBy(userId)) {
      throw new AuthorizationError('You can only edit your own posts');
    }

    const updated = post.updateContent(params.content);
    await this.postRepo.update(updated);

    return this.postRepo.findByIdWithRelations(postId);
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (!post.isOwnedBy(userId)) {
      throw new AuthorizationError('You can only delete your own posts');
    }

    await this.postRepo.delete(postId);
  }
}
