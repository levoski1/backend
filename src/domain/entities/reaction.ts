import type { ReactionType } from '../value-objects/reaction-type.js';
import { ValidationError } from '../../shared/errors/index.js';

export interface ReactionParams {
  id: string;
  postId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: Date;
}

export class Reaction {
  public readonly id: string;
  public readonly postId: string;
  public readonly userId: string;
  public readonly reactionType: ReactionType;
  public readonly createdAt: Date;

  constructor(params: ReactionParams) {
    this.validateId(params.id);
    this.validatePostId(params.postId);
    this.validateUserId(params.userId);

    this.id = params.id.trim();
    this.postId = params.postId.trim();
    this.userId = params.userId.trim();
    this.reactionType = params.reactionType;
    this.createdAt = params.createdAt;
  }

  static create(params: Omit<ReactionParams, 'createdAt'>): Reaction {
    return new Reaction({
      ...params,
      createdAt: new Date(),
    });
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  toParams(): ReactionParams {
    return {
      id: this.id,
      postId: this.postId,
      userId: this.userId,
      reactionType: this.reactionType,
      createdAt: this.createdAt,
    };
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Reaction ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      throw new ValidationError('Reaction ID must be a valid UUID');
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
}
