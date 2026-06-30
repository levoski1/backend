import type { PostType } from '../value-objects/post-type.js';
import { ValidationError } from '../../shared/errors/index.js';

export interface PostParams {
  id: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  postType: PostType;
  isUrgent: boolean;
  allowComments: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostWithRelations extends PostParams {
  commentCount: number;
  reactionCounts: Record<string, number>;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
}

export class Post {
  public readonly id: string;
  public readonly userId: string;
  public readonly content: string;
  public readonly isAnonymous: boolean;
  public readonly postType: PostType;
  public readonly isUrgent: boolean;
  public readonly allowComments: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(params: PostParams) {
    this.validateId(params.id);
    this.validateUserId(params.userId);
    this.validateContent(params.content);

    this.id = params.id.trim();
    this.userId = params.userId.trim();
    this.content = params.content.trim();
    this.isAnonymous = params.isAnonymous;
    this.postType = params.postType;
    this.isUrgent = params.isUrgent;
    this.allowComments = params.allowComments;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<PostParams, 'createdAt' | 'updatedAt'>): Post {
    const now = new Date();
    return new Post({
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  updateContent(content: string): Post {
    return new Post({
      ...this.toParams(),
      content: content.trim(),
      updatedAt: new Date(),
    });
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  toParams(): PostParams {
    return {
      id: this.id,
      userId: this.userId,
      content: this.content,
      isAnonymous: this.isAnonymous,
      postType: this.postType,
      isUrgent: this.isUrgent,
      allowComments: this.allowComments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Post ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      throw new ValidationError('Post ID must be a valid UUID');
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId.trim())) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  private validateContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new ValidationError('Content is required');
    }
    const trimmed = content.trim();
    if (trimmed.length < 1) {
      throw new ValidationError('Content must be at least 1 character');
    }
    if (trimmed.length > 5000) {
      throw new ValidationError('Content must not exceed 5000 characters');
    }
  }
}
