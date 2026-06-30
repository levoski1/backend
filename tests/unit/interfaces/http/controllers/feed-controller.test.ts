import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Post, PostType } from '@domain/index';

const mockPostRepoMethods: Record<string, jest.Mock | undefined> = {
  findById: jest.fn(),
  findByIdWithRelations: jest.fn(),
  findFeed: jest.fn(),
  findCursorForPage: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockCommentRepoMethods: Record<string, jest.Mock | undefined> = {
  findById: jest.fn(),
  findByPostId: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

const mockReactionRepoMethods: Record<string, jest.Mock | undefined> = {
  findByPostUserAndType: jest.fn(),
  countByPostId: jest.fn(),
  create: jest.fn(),
  deleteByPostUserAndType: jest.fn(),
};

jest.mock('express-rate-limit', () => jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(),
}));

jest.mock('@infrastructure/database/repositories/post-repository', () => ({
  PostRepository: jest.fn().mockImplementation(() => mockPostRepoMethods),
}));

jest.mock('@infrastructure/database/repositories/comment-repository', () => ({
  CommentRepository: jest.fn().mockImplementation(() => mockCommentRepoMethods),
}));

jest.mock('@infrastructure/database/repositories/reaction-repository', () => ({
  ReactionRepository: jest.fn().mockImplementation(() => mockReactionRepoMethods),
}));

const validPostId = '123e4567-e89b-12d3-a456-426614174000';
const validUserId = '223e4567-e89b-12d3-a456-426614174001';
const validCommentId = '323e4567-e89b-12d3-a456-426614174002';

const validPost = new Post({
  id: validPostId,
  userId: validUserId,
  content: 'Test post content',
  isAnonymous: false,
  isUrgent: false,
  allowComments: true,
  postType: PostType.PRAYER,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

import app from '@/app';

function setAuthToken(userId = validUserId) {
  const jwtVerify = jwt.verify as jest.Mock;
  jwtVerify.mockReturnValue({ sub: userId, role: 'user' });
}

function clearAuthToken() {
  const jwtVerify = jwt.verify as jest.Mock;
  jwtVerify.mockReset();
}

describe('FeedController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostRepoMethods.findById = jest.fn();
    mockPostRepoMethods.findByIdWithRelations = jest.fn();
    mockPostRepoMethods.findFeed = jest.fn();
    mockPostRepoMethods.findCursorForPage = jest.fn();
    mockPostRepoMethods.create = jest.fn();
    mockPostRepoMethods.update = jest.fn();
    mockPostRepoMethods.delete = jest.fn();
    mockCommentRepoMethods.findById = jest.fn();
    mockCommentRepoMethods.findByPostId = jest.fn();
    mockCommentRepoMethods.create = jest.fn();
    mockCommentRepoMethods.delete = jest.fn();
    mockReactionRepoMethods.findByPostUserAndType = jest.fn();
    mockReactionRepoMethods.countByPostId = jest.fn();
    mockReactionRepoMethods.create = jest.fn();
    mockReactionRepoMethods.deleteByPostUserAndType = jest.fn();
  });

  describe('POST /api/v1/posts', () => {
    it('should return 201 when creating a post', async () => {
      setAuthToken();
      mockPostRepoMethods.create!.mockResolvedValue(validPost);
      mockPostRepoMethods.findByIdWithRelations!.mockResolvedValue({
        post: validPost,
        commentCount: 0,
        reactionCounts: { prayer: 0, heart: 0, amen: 0 },
        authorDisplayName: 'John Doe',
        authorAvatarUrl: null,
      });

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Test post content', postType: 'prayer' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.content).toBe('Test post content');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .send({ content: 'Test post content' });

      expect(response.status).toBe(401);
    });

    it('should return 400 when content is missing', async () => {
      setAuthToken();

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/posts', () => {
    it('should return 200 with feed', async () => {
      mockPostRepoMethods.findCursorForPage!.mockResolvedValue({ nextCursor: null });
      mockPostRepoMethods.findFeed!.mockResolvedValue([{
        post: validPost,
        commentCount: 0,
        reactionCounts: { prayer: 0, heart: 0, amen: 0 },
        authorDisplayName: 'John Doe',
        authorAvatarUrl: null,
      }]);

      const response = await request(app)
        .get('/api/v1/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should accept sort and limit query params', async () => {
      mockPostRepoMethods.findCursorForPage!.mockResolvedValue({ nextCursor: null });
      mockPostRepoMethods.findFeed!.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/posts?sort=trending&limit=10');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/posts/:postId', () => {
    it('should return 200 with post', async () => {
      mockPostRepoMethods.findByIdWithRelations!.mockResolvedValue({
        post: validPost,
        commentCount: 3,
        reactionCounts: { prayer: 1, heart: 0, amen: 0 },
        authorDisplayName: 'John Doe',
        authorAvatarUrl: null,
      });

      const response = await request(app)
        .get(`/api/v1/posts/${validPostId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.id).toBe(validPostId);
    });

    it('should return 404 when post not found', async () => {
      const unknownId = '99999999-9999-9999-9999-999999999999';
      mockPostRepoMethods.findByIdWithRelations!.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/posts/${unknownId}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid postId format', async () => {
      const response = await request(app)
        .get('/api/v1/posts/not-a-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/posts/:postId', () => {
    it('should return 200 when updating own post', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);
      mockPostRepoMethods.update!.mockResolvedValue(validPost);
      mockPostRepoMethods.findByIdWithRelations!.mockResolvedValue({
        post: validPost,
        commentCount: 0,
        reactionCounts: { prayer: 0, heart: 0, amen: 0 },
        authorDisplayName: 'John Doe',
        authorAvatarUrl: null,
      });

      const response = await request(app)
        .put(`/api/v1/posts/${validPostId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Updated content' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put(`/api/v1/posts/${validPostId}`)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(401);
    });

    it('should return 403 when not the owner', async () => {
      setAuthToken('323e4567-e89b-12d3-a456-426614174002');
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);

      const response = await request(app)
        .put(`/api/v1/posts/${validPostId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Updated content' });

      expect(response.status).toBe(403);
    });

    it('should return 404 when post not found', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/posts/${validPostId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Updated content' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/posts/:postId', () => {
    it('should return 200 when deleting own post', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);
      mockPostRepoMethods.delete!.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/posts/${validPostId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${validPostId}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when not the owner', async () => {
      setAuthToken('323e4567-e89b-12d3-a456-426614174002');
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);

      const response = await request(app)
        .delete(`/api/v1/posts/${validPostId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/posts/:postId/comments', () => {
    it('should return 201 when adding a comment', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);
      mockCommentRepoMethods.create!.mockResolvedValue({
        id: validCommentId,
        postId: validPostId,
        userId: validUserId,
        content: 'Nice post!',
        isAnonymous: false,
        createdAt: new Date('2026-01-01'),
      });

      const response = await request(app)
        .post(`/api/v1/posts/${validPostId}/comments`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Nice post!' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe('Nice post!');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/posts/${validPostId}/comments`)
        .send({ content: 'Nice post!' });

      expect(response.status).toBe(401);
    });

    it('should return 404 when post not found', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/posts/${validPostId}/comments`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Nice post!' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/posts/:postId/comments', () => {
    it('should return 200 with comments', async () => {
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);
      mockCommentRepoMethods.findByPostId!.mockResolvedValue([
        {
          comment: {
            id: validCommentId,
            postId: validPostId,
            userId: validUserId,
            content: 'Nice post!',
            isAnonymous: false,
            createdAt: new Date('2026-01-01'),
          },
          authorDisplayName: 'John Doe',
          authorAvatarUrl: null,
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/posts/${validPostId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toHaveLength(1);
    });

    it('should return 404 when post not found', async () => {
      mockPostRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/posts/${validPostId}/comments`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/posts/:postId/comments/:commentId', () => {
    it('should return 200 when deleting own comment', async () => {
      setAuthToken();
      mockCommentRepoMethods.findById!.mockResolvedValue({
        id: validCommentId,
        postId: validPostId,
        userId: validUserId,
        content: 'Nice post!',
        isAnonymous: false,
        createdAt: new Date('2026-01-01'),
        isOwnedBy: () => true,
      });
      mockCommentRepoMethods.delete!.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/posts/${validPostId}/comments/${validCommentId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${validPostId}/comments/${validCommentId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/posts/:postId/reactions', () => {
    it('should return 201 when adding a reaction', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);
      mockReactionRepoMethods.findByPostUserAndType!.mockResolvedValue(null);
      mockReactionRepoMethods.create!.mockResolvedValue({});
      mockReactionRepoMethods.countByPostId!.mockResolvedValue({ prayer: 1, heart: 0, amen: 0 });

      const response = await request(app)
        .post(`/api/v1/posts/${validPostId}/reactions`)
        .set('Authorization', 'Bearer valid-token')
        .send({ reactionType: 'prayer' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactionCounts.prayer).toBe(1);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/posts/${validPostId}/reactions`)
        .send({ reactionType: 'prayer' });

      expect(response.status).toBe(401);
    });

    it('should return 409 when reacting twice with same type', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);
      mockReactionRepoMethods.findByPostUserAndType!.mockResolvedValue({ id: 'some-id' });
      mockReactionRepoMethods.countByPostId!.mockResolvedValue({ prayer: 1, heart: 0, amen: 0 });

      const response = await request(app)
        .post(`/api/v1/posts/${validPostId}/reactions`)
        .set('Authorization', 'Bearer valid-token')
        .send({ reactionType: 'prayer' });

      expect(response.status).toBe(409);
    });
  });

  describe('DELETE /api/v1/posts/:postId/reactions', () => {
    it('should return 200 when removing a reaction', async () => {
      setAuthToken();
      mockPostRepoMethods.findById!.mockResolvedValue(validPost);
      mockReactionRepoMethods.deleteByPostUserAndType!.mockResolvedValue(undefined);
      mockReactionRepoMethods.countByPostId!.mockResolvedValue({ prayer: 0, heart: 0, amen: 0 });

      const response = await request(app)
        .delete(`/api/v1/posts/${validPostId}/reactions`)
        .set('Authorization', 'Bearer valid-token')
        .send({ reactionType: 'prayer' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reactionCounts.prayer).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${validPostId}/reactions`)
        .send({ reactionType: 'prayer' });

      expect(response.status).toBe(401);
    });
  });
});
