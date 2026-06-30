import { PostService } from '@application/feed/post-service';
import type { PostRepository } from '@infrastructure/database/repositories/post-repository';
import { Post, PostType } from '@domain/index';
import { NotFoundError, AuthorizationError } from '@shared/errors';

const mockPostRepo = {
  findById: jest.fn(),
  findByIdWithRelations: jest.fn(),
  findFeed: jest.fn(),
  findCursorForPage: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
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

const validPostWithRelations = {
  post: validPost,
  commentCount: 5,
  reactionCounts: { prayer: 3, heart: 2, amen: 1 },
  authorDisplayName: 'Test User',
  authorAvatarUrl: 'https://example.com/avatar.jpg',
};

describe('PostService', () => {
  let postService: PostService;

  beforeEach(() => {
    jest.clearAllMocks();
    postService = new PostService(mockPostRepo as unknown as PostRepository);
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockPostRepo.create.mockResolvedValue(validPost);
      mockPostRepo.findByIdWithRelations.mockResolvedValue(validPostWithRelations);

      const result = await postService.createPost({
        userId: '223e4567-e89b-12d3-a456-426614174001',
        content: 'Test post content',
        isAnonymous: false,
        postType: PostType.PRAYER,
      });

      expect(mockPostRepo.create).toHaveBeenCalledTimes(1);
      expect(mockPostRepo.findByIdWithRelations).toHaveBeenCalledTimes(1);
      expect(result.content).toBe('Test post content');
    });

    it('should default isAnonymous to false', async () => {
      mockPostRepo.create.mockResolvedValue(validPost);
      mockPostRepo.findByIdWithRelations.mockResolvedValue(validPostWithRelations);

      await postService.createPost({
        userId: '223e4567-e89b-12d3-a456-426614174001',
        content: 'Test post content',
        postType: PostType.PRAYER,
      });

      const createdPost = mockPostRepo.create.mock.calls[0][0];
      expect(createdPost.isAnonymous).toBe(false);
    });

    it('should create a prayer post with isUrgent and allowComments defaults', async () => {
      mockPostRepo.create.mockResolvedValue(validPost);
      mockPostRepo.findByIdWithRelations.mockResolvedValue(validPostWithRelations);

      await postService.createPost({
        userId: '223e4567-e89b-12d3-a456-426614174001',
        content: 'Test post content',
        postType: PostType.PRAYER,
      });

      const createdPost = mockPostRepo.create.mock.calls[0][0];
      expect(createdPost.postType).toBe(PostType.PRAYER);
      expect(createdPost.isUrgent).toBe(false);
      expect(createdPost.allowComments).toBe(true);
    });
  });

  describe('getFeed', () => {
    it('should return paginated feed results', async () => {
      const feedItems = [{
        post: validPost,
        commentCount: 3,
        reactionCounts: { prayer: 1, heart: 0, amen: 0 },
        authorDisplayName: 'Test User',
        authorAvatarUrl: 'https://example.com/avatar.jpg',
      }];

      mockPostRepo.findCursorForPage.mockResolvedValue({ nextCursor: null });
      mockPostRepo.findFeed.mockResolvedValue(feedItems);

      const result = await postService.getFeed({ limit: 20, sort: 'recent' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].authorDisplayName).toBe('Test User');
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it('should mask author name for anonymous posts', async () => {
      const anonPost = new Post({
        ...validPost.toParams(),
        isAnonymous: true,
      });

      const feedItems = [{
        post: anonPost,
        commentCount: 0,
        reactionCounts: { prayer: 0, heart: 0, amen: 0 },
        authorDisplayName: 'Test User',
        authorAvatarUrl: 'https://example.com/avatar.jpg',
      }];

      mockPostRepo.findCursorForPage.mockResolvedValue({ nextCursor: null });
      mockPostRepo.findFeed.mockResolvedValue(feedItems);

      const result = await postService.getFeed({ limit: 20, sort: 'recent' });

      expect(result.items[0].authorDisplayName).toBe('A Shelter Member');
      expect(result.items[0].authorAvatarUrl).toBeNull();
    });

    it('should return nextCursor when there are more results', async () => {
      mockPostRepo.findCursorForPage.mockResolvedValue({ nextCursor: '2026-01-02T00:00:00.000Z' });
      mockPostRepo.findFeed.mockResolvedValue([]);

      const result = await postService.getFeed({ limit: 20, sort: 'recent' });

      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe('2026-01-02T00:00:00.000Z');
    });
  });

  describe('getPost', () => {
    it('should return a post by ID', async () => {
      mockPostRepo.findByIdWithRelations.mockResolvedValue(validPostWithRelations);

      const result = await postService.getPost('123e4567-e89b-12d3-a456-426614174000');

      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.authorDisplayName).toBe('Test User');
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPostRepo.findByIdWithRelations.mockResolvedValue(null);

      await expect(postService.getPost('nonexistent-id')).rejects.toThrow(NotFoundError);
    });

    it('should mask author for anonymous posts', async () => {
      const anonPost = new Post({
        ...validPost.toParams(),
        isAnonymous: true,
      });

      mockPostRepo.findByIdWithRelations.mockResolvedValue({
        ...validPostWithRelations,
        post: anonPost,
      });

      const result = await postService.getPost('123e4567-e89b-12d3-a456-426614174000');

      expect(result.authorDisplayName).toBe('A Shelter Member');
      expect(result.authorAvatarUrl).toBeNull();
    });
  });

  describe('updatePost', () => {
    it('should update a post owned by the user', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockPostRepo.update.mockResolvedValue(validPost);
      mockPostRepo.findByIdWithRelations.mockResolvedValue(validPostWithRelations);

      const result = await postService.updatePost(
        '123e4567-e89b-12d3-a456-426614174000',
        '223e4567-e89b-12d3-a456-426614174001',
        { content: 'Updated content' },
      );

      expect(mockPostRepo.update).toHaveBeenCalledTimes(1);
      expect(result?.post?.content).toBe('Test post content');
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(
        postService.updatePost('nonexistent', '223e4567-e89b-12d3-a456-426614174001', { content: 'test' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when user is not the owner', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);

      await expect(
        postService.updatePost(
          '123e4567-e89b-12d3-a456-426614174000',
          '323e4567-e89b-12d3-a456-426614174002',
          { content: 'test' },
        ),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('deletePost', () => {
    it('should delete a post owned by the user', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);
      mockPostRepo.delete.mockResolvedValue(undefined);

      await postService.deletePost(
        '123e4567-e89b-12d3-a456-426614174000',
        '223e4567-e89b-12d3-a456-426614174001',
      );

      expect(mockPostRepo.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(
        postService.deletePost('nonexistent', '223e4567-e89b-12d3-a456-426614174001'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when user is not the owner', async () => {
      mockPostRepo.findById.mockResolvedValue(validPost);

      await expect(
        postService.deletePost(
          '123e4567-e89b-12d3-a456-426614174000',
          '323e4567-e89b-12d3-a456-426614174002',
        ),
      ).rejects.toThrow(AuthorizationError);
    });
  });
});
