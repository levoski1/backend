import { ReactionService } from '@application/feed/reaction-service';
import type { PostRepository } from '@infrastructure/database/repositories/post-repository';
import type { ReactionRepository } from '@infrastructure/database/repositories/reaction-repository';
import { Post, Reaction, PostType, ReactionType } from '@domain/index';
import { NotFoundError, ConflictError } from '@shared/errors';

const mockPostRepo = {
  findById: jest.fn(),
};

const mockReactionRepo = {
  findByPostUserAndType: jest.fn(),
  countByPostId: jest.fn(),
  create: jest.fn(),
  deleteByPostUserAndType: jest.fn(),
};

const validPost = new Post({
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: '223e4567-e89b-12d3-a456-426614174001',
  content: 'Test post content',
  isAnonymous: false,
  isUrgent: false,
  allowComments: true,
  postType: PostType.PRAYER,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const validReaction = new Reaction({
  id: '323e4567-e89b-12d3-a456-426614174002',
  postId: '123e4567-e89b-12d3-a456-426614174000',
  userId: '423e4567-e89b-12d3-a456-426614174003',
  reactionType: ReactionType.PRAYER,
  createdAt: new Date('2026-01-01'),
});

describe('ReactionService', () => {
  let reactionService: ReactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    reactionService = new ReactionService(
      mockPostRepo as unknown as PostRepository,
      mockReactionRepo as unknown as ReactionRepository,
    );
  });

  describe('addReaction', () => {
    it('should add a reaction to an existing post', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockReactionRepo.findByPostUserAndType.mockResolvedValue(null);
      mockReactionRepo.create.mockResolvedValue(validReaction);
      mockReactionRepo.countByPostId.mockResolvedValue({ prayer: 1, heart: 0, amen: 0 });

      const result = await reactionService.addReaction({
        postId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '423e4567-e89b-12d3-a456-426614174003',
        reactionType: ReactionType.PRAYER,
      });

      expect(result.prayer).toBe(1);
      expect(result.heart).toBe(0);
      expect(result.amen).toBe(0);
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(
        reactionService.addReaction({
          postId: 'nonexistent',
          userId: '423e4567-e89b-12d3-a456-426614174003',
          reactionType: ReactionType.PRAYER,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when user already reacted with same type', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockReactionRepo.findByPostUserAndType.mockResolvedValue(validReaction);

      await expect(
        reactionService.addReaction({
          postId: '123e4567-e89b-12d3-a456-426614174000',
          userId: '423e4567-e89b-12d3-a456-426614174003',
          reactionType: ReactionType.PRAYER,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should allow user to react with different types', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockReactionRepo.findByPostUserAndType.mockResolvedValue(null);
      mockReactionRepo.create.mockResolvedValue(validReaction);
      mockReactionRepo.countByPostId.mockResolvedValue({ prayer: 0, heart: 1, amen: 0 });

      await reactionService.addReaction({
        postId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '423e4567-e89b-12d3-a456-426614174003',
        reactionType: ReactionType.HEART,
      });

      expect(mockReactionRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeReaction', () => {
    it('should remove a reaction from a post', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockReactionRepo.deleteByPostUserAndType.mockResolvedValue(undefined);
      mockReactionRepo.countByPostId.mockResolvedValue({ prayer: 0, heart: 0, amen: 0 });

      const result = await reactionService.removeReaction(
        '123e4567-e89b-12d3-a456-426614174000',
        '423e4567-e89b-12d3-a456-426614174003',
        ReactionType.PRAYER,
      );

      expect(result.prayer).toBe(0);
      expect(result.heart).toBe(0);
      expect(result.amen).toBe(0);
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(
        reactionService.removeReaction('nonexistent', 'userId', ReactionType.PRAYER),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
