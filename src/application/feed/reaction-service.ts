import crypto from 'node:crypto';
import { Reaction } from '../../domain/index.js';
import type { ReactionType } from '../../domain/index.js';
import { PostRepository } from '../../infrastructure/database/repositories/post-repository.js';
import { ReactionRepository } from '../../infrastructure/database/repositories/reaction-repository.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';

export interface AddReactionParams {
  postId: string;
  userId: string;
  reactionType: ReactionType;
}

export class ReactionService {
  constructor(
    private readonly postRepo: PostRepository = new PostRepository(),
    private readonly reactionRepo: ReactionRepository = new ReactionRepository(),
  ) {}

  async addReaction(params: AddReactionParams) {
    const post = await this.postRepo.findById(params.postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    const existing = await this.reactionRepo.findByPostUserAndType(
      params.postId,
      params.userId,
      params.reactionType,
    );

    if (existing) {
      throw new ConflictError('You have already reacted with this reaction type');
    }

    const reaction = Reaction.create({
      id: crypto.randomUUID(),
      postId: params.postId,
      userId: params.userId,
      reactionType: params.reactionType,
    });

    await this.reactionRepo.create(reaction);

    const counts = await this.reactionRepo.countByPostId(params.postId);
    return counts;
  }

  async removeReaction(postId: string, userId: string, reactionType: ReactionType) {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    await this.reactionRepo.deleteByPostUserAndType(postId, userId, reactionType);

    const counts = await this.reactionRepo.countByPostId(postId);
    return counts;
  }
}
