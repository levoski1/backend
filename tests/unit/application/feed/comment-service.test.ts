import { CommentService } from '@application/feed/comment-service';
import type { PostRepository } from '@infrastructure/database/repositories/post-repository';
import type { CommentRepository } from '@infrastructure/database/repositories/comment-repository';
import { Post, Comment, PostType } from '@domain/index';
import { NotFoundError, AuthorizationError } from '@shared/errors';

const mockPostRepo = {
  findById: jest.fn(),
};

const mockCommentRepo = {
  findById: jest.fn(),
  findByPostId: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

const validPost = new Post({
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: '223e4567-e89b-12d3-a456-426614174001',
  content: 'Test post content',
  isAnonymous: false,
  postType: PostType.GENERAL,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const validComment = new Comment({
  id: '323e4567-e89b-12d3-a456-426614174002',
  postId: '123e4567-e89b-12d3-a456-426614174000',
  userId: '423e4567-e89b-12d3-a456-426614174003',
  content: 'Test comment',
  isAnonymous: false,
  createdAt: new Date('2026-01-01'),
});

describe('CommentService', () => {
  let commentService: CommentService;

  beforeEach(() => {
    jest.clearAllMocks();
    commentService = new CommentService(
      mockPostRepo as unknown as PostRepository,
      mockCommentRepo as unknown as CommentRepository,
    );
  });

  describe('addComment', () => {
    it('should add a comment to an existing post', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockCommentRepo.create.mockResolvedValue(validComment);

      const result = await commentService.addComment({
        postId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '423e4567-e89b-12d3-a456-426614174003',
        content: 'Test comment',
      });

      expect(result.content).toBe('Test comment');
      expect(mockCommentRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(
        commentService.addComment({
          postId: 'nonexistent',
          userId: '423e4567-e89b-12d3-a456-426614174003',
          content: 'Test comment',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should mask author for anonymous comments', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);

      const anonComment = new Comment({
        ...validComment.toParams(),
        isAnonymous: true,
      });

      mockCommentRepo.create.mockResolvedValue(anonComment);

      const result = await commentService.addComment({
        postId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '423e4567-e89b-12d3-a456-426614174003',
        content: 'Anonymous comment',
        isAnonymous: true,
      });

      expect(result.authorDisplayName).toBe('A Shelter Member');
    });
  });

  describe('getComments', () => {
    it('should return comments for a post', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockCommentRepo.findByPostId.mockResolvedValue([
        { comment: validComment, authorDisplayName: 'Test User', authorAvatarUrl: null },
      ]);

      const result = await commentService.getComments('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test comment');
      expect(result[0].authorDisplayName).toBe('Test User');
    });

    it('should mask author for anonymous comments', async () => {
      const anonComment = new Comment({
        ...validComment.toParams(),
        isAnonymous: true,
      });

      mockPostRepo.findById.mockResolvedValue(validPost);
      mockCommentRepo.findByPostId.mockResolvedValue([
        { comment: anonComment, authorDisplayName: 'Test User', authorAvatarUrl: null },
      ]);

      const result = await commentService.getComments('123e4567-e89b-12d3-a456-426614174000');

      expect(result[0].authorDisplayName).toBe('A Shelter Member');
      expect(result[0].authorAvatarUrl).toBeNull();
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(
        commentService.getComments('nonexistent'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment owned by the user', async () => {
      mockCommentRepo.findById.mockResolvedValue(validComment);
      mockCommentRepo.delete.mockResolvedValue(undefined);

      await commentService.deleteComment(
        '323e4567-e89b-12d3-a456-426614174002',
        '123e4567-e89b-12d3-a456-426614174000',
        '423e4567-e89b-12d3-a456-426614174003',
      );

      expect(mockCommentRepo.delete).toHaveBeenCalledWith('323e4567-e89b-12d3-a456-426614174002');
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      mockCommentRepo.findById.mockResolvedValue(null);

      await expect(
        commentService.deleteComment('nonexistent', '123e4567-e89b-12d3-a456-426614174000', 'userId'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when comment postId does not match', async () => {
      const wrongPostComment = new Comment({
        ...validComment.toParams(),
        postId: '999e4567-e89b-12d3-a456-426614174009',
      });

      mockCommentRepo.findById.mockResolvedValue(wrongPostComment);

      await expect(
        commentService.deleteComment(
          '323e4567-e89b-12d3-a456-426614174002',
          '123e4567-e89b-12d3-a456-426614174000',
          '423e4567-e89b-12d3-a456-426614174003',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when user is not the owner', async () => {
      mockCommentRepo.findById.mockResolvedValue(validComment);

      await expect(
        commentService.deleteComment(
          '323e4567-e89b-12d3-a456-426614174002',
          '123e4567-e89b-12d3-a456-426614174000',
          '523e4567-e89b-12d3-a456-426614174004',
        ),
      ).rejects.toThrow(AuthorizationError);
    });
  });
});
