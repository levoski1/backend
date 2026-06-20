import { ValidationError } from '../../shared/errors/index.js';

export interface CommentParams {
  id: string;
  postId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export class Comment {
  public readonly id: string;
  public readonly postId: string;
  public readonly userId: string;
  public readonly content: string;
  public readonly isAnonymous: boolean;
  public readonly createdAt: Date;

  constructor(params: CommentParams) {
    this.validateId(params.id);
    this.validatePostId(params.postId);
    this.validateUserId(params.userId);
    this.validateContent(params.content);

    this.id = params.id.trim();
    this.postId = params.postId.trim();
    this.userId = params.userId.trim();
    this.content = params.content.trim();
    this.isAnonymous = params.isAnonymous;
    this.createdAt = params.createdAt;
  }

  static create(params: Omit<CommentParams, 'createdAt'>): Comment {
    return new Comment({
      ...params,
      createdAt: new Date(),
    });
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  toParams(): CommentParams {
    return {
      id: this.id,
      postId: this.postId,
      userId: this.userId,
      content: this.content,
      isAnonymous: this.isAnonymous,
      createdAt: this.createdAt,
    };
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Comment ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      throw new ValidationError('Comment ID must be a valid UUID');
    }
  }

  private validatePostId(postId: string): void {
    if (!postId || typeof postId !== 'string') {
      throw new ValidationError('Post ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId.trim())) {
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
      throw new ValidationError('Comment must be at least 1 character');
    }
    if (trimmed.length > 1000) {
      throw new ValidationError('Comment must not exceed 1000 characters');
    }
  }
}
