import { Comment } from '@domain/index';

function makeValidCommentParams(overrides: Record<string, unknown> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    postId: '223e4567-e89b-12d3-a456-426614174001',
    userId: '323e4567-e89b-12d3-a456-426614174002',
    content: 'This is a test comment.',
    isAnonymous: false,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('Comment Entity', () => {
  describe('constructor', () => {
    it('should create a comment with all required fields', () => {
      const params = makeValidCommentParams();
      const comment = new Comment(params);
      expect(comment.id).toBe(params.id);
      expect(comment.postId).toBe(params.postId);
      expect(comment.userId).toBe(params.userId);
      expect(comment.content).toBe('This is a test comment.');
      expect(comment.isAnonymous).toBe(false);
      expect(comment.createdAt).toEqual(new Date('2026-01-01'));
    });

    it('should create an anonymous comment', () => {
      const params = makeValidCommentParams({ isAnonymous: true });
      const comment = new Comment(params);
      expect(comment.isAnonymous).toBe(true);
    });

    it('should reject invalid UUID for id', () => {
      const params = makeValidCommentParams({ id: 'not-a-uuid' });
      expect(() => new Comment(params)).toThrow('Comment ID must be a valid UUID');
    });

    it('should reject empty id', () => {
      const params = makeValidCommentParams({ id: '' });
      expect(() => new Comment(params)).toThrow('Comment ID is required');
    });

    it('should reject invalid UUID for postId', () => {
      const params = makeValidCommentParams({ postId: 'not-a-uuid' });
      expect(() => new Comment(params)).toThrow('Post ID must be a valid UUID');
    });

    it('should reject invalid UUID for userId', () => {
      const params = makeValidCommentParams({ userId: 'not-a-uuid' });
      expect(() => new Comment(params)).toThrow('User ID must be a valid UUID');
    });

    it('should reject empty content', () => {
      const params = makeValidCommentParams({ content: '' });
      expect(() => new Comment(params)).toThrow('Content is required');
    });

    it('should reject content over 1000 characters', () => {
      const params = makeValidCommentParams({ content: 'A'.repeat(1001) });
      expect(() => new Comment(params)).toThrow('not exceed 1000 characters');
    });

    it('should trim content', () => {
      const params = makeValidCommentParams({ content: '  Hello World  ' });
      const comment = new Comment(params);
      expect(comment.content).toBe('Hello World');
    });
  });

  describe('static create', () => {
    it('should create a comment with current date', () => {
      const comment = Comment.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        postId: '223e4567-e89b-12d3-a456-426614174001',
        userId: '323e4567-e89b-12d3-a456-426614174002',
        content: 'Test comment',
        isAnonymous: false,
      });

      expect(comment.content).toBe('Test comment');
      expect(comment.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('isOwnedBy', () => {
    it('should return true when userId matches', () => {
      const comment = new Comment(makeValidCommentParams());
      expect(comment.isOwnedBy('323e4567-e89b-12d3-a456-426614174002')).toBe(true);
    });

    it('should return false when userId does not match', () => {
      const comment = new Comment(makeValidCommentParams());
      expect(comment.isOwnedBy('423e4567-e89b-12d3-a456-426614174003')).toBe(false);
    });
  });

  describe('toParams', () => {
    it('should return all fields as a plain object', () => {
      const params = makeValidCommentParams();
      const comment = new Comment(params);
      const result = comment.toParams();
      expect(result.id).toBe(params.id);
      expect(result.postId).toBe(params.postId);
      expect(result.userId).toBe(params.userId);
      expect(result.content).toBe(params.content);
      expect(result.isAnonymous).toBe(params.isAnonymous);
      expect(result.createdAt).toEqual(params.createdAt);
    });
  });
});
