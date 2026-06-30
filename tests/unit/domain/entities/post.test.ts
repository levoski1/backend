import { Post, PostType, postTypeFromString } from '@domain/index';

function makeValidPostParams(overrides: Record<string, unknown> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '223e4567-e89b-12d3-a456-426614174001',
    content: 'This is a test post content for the community feed.',
    isAnonymous: false,
    isUrgent: false,
    allowComments: true,
    postType: PostType.PRAYER,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('Post Entity', () => {
  describe('constructor', () => {
    it('should create a post with all required fields', () => {
      const params = makeValidPostParams();
      const post = new Post(params);
      expect(post.id).toBe(params.id);
      expect(post.userId).toBe(params.userId);
      expect(post.content).toBe('This is a test post content for the community feed.');
      expect(post.isAnonymous).toBe(false);
      expect(post.isUrgent).toBe(false);
      expect(post.allowComments).toBe(true);
      expect(post.postType).toBe(PostType.PRAYER);
      expect(post.createdAt).toEqual(new Date('2026-01-01'));
      expect(post.updatedAt).toEqual(new Date('2026-01-01'));
    });

    it('should create an anonymous post', () => {
      const params = makeValidPostParams({ isAnonymous: true });
      const post = new Post(params);
      expect(post.isAnonymous).toBe(true);
    });

    it('should create a prayer post', () => {
      const params = makeValidPostParams({ postType: PostType.PRAYER });
      const post = new Post(params);
      expect(post.postType).toBe(PostType.PRAYER);
    });

    it('should create an advice post', () => {
      const params = makeValidPostParams({ postType: PostType.ADVICE });
      const post = new Post(params);
      expect(post.postType).toBe(PostType.ADVICE);
    });

    it('should create a testimony post', () => {
      const params = makeValidPostParams({ postType: PostType.TESTIMONY });
      const post = new Post(params);
      expect(post.postType).toBe(PostType.TESTIMONY);
    });

    it('should create a gratitude post', () => {
      const params = makeValidPostParams({ postType: PostType.GRATITUDE });
      const post = new Post(params);
      expect(post.postType).toBe(PostType.GRATITUDE);
    });

    it('should reject invalid UUID for id', () => {
      const params = makeValidPostParams({ id: 'not-a-uuid' });
      expect(() => new Post(params)).toThrow('Post ID must be a valid UUID');
    });

    it('should reject empty id', () => {
      const params = makeValidPostParams({ id: '' });
      expect(() => new Post(params)).toThrow('Post ID is required');
    });

    it('should reject invalid UUID for userId', () => {
      const params = makeValidPostParams({ userId: 'not-a-uuid' });
      expect(() => new Post(params)).toThrow('User ID must be a valid UUID');
    });

    it('should reject empty userId', () => {
      const params = makeValidPostParams({ userId: '' });
      expect(() => new Post(params)).toThrow('User ID is required');
    });

    it('should reject empty content', () => {
      const params = makeValidPostParams({ content: '' });
      expect(() => new Post(params)).toThrow('Content is required');
    });

    it('should reject content over 5000 characters', () => {
      const params = makeValidPostParams({ content: 'A'.repeat(5001) });
      expect(() => new Post(params)).toThrow('not exceed 5000 characters');
    });

    it('should trim id and userId', () => {
      const params = makeValidPostParams({
        id: '  123e4567-e89b-12d3-a456-426614174000  ',
        userId: '  223e4567-e89b-12d3-a456-426614174001  ',
      });
      const post = new Post(params);
      expect(post.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(post.userId).toBe('223e4567-e89b-12d3-a456-426614174001');
    });

    it('should trim content', () => {
      const params = makeValidPostParams({ content: '  Hello World  ' });
      const post = new Post(params);
      expect(post.content).toBe('Hello World');
    });
  });

  describe('static create', () => {
    it('should create a post with sensible defaults for timestamps', () => {
      const post = Post.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '223e4567-e89b-12d3-a456-426614174001',
        content: 'Test content',
        isAnonymous: false,
        isUrgent: false,
        allowComments: true,
        postType: PostType.PRAYER,
      });

      expect(post.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(post.content).toBe('Test content');
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateContent', () => {
    it('should update content and return a new instance', () => {
      const post = new Post(makeValidPostParams());
      const updated = post.updateContent('Updated content');
      expect(updated.content).toBe('Updated content');
      expect(updated).not.toBe(post);
    });

    it('should update the updatedAt timestamp', () => {
      const post = new Post(makeValidPostParams());
      const updated = post.updateContent('Updated content');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(post.updatedAt.getTime());
    });

    it('should preserve other fields', () => {
      const post = new Post(makeValidPostParams());
      const updated = post.updateContent('Updated content');
      expect(updated.id).toBe(post.id);
      expect(updated.userId).toBe(post.userId);
      expect(updated.isAnonymous).toBe(post.isAnonymous);
      expect(updated.isUrgent).toBe(post.isUrgent);
      expect(updated.allowComments).toBe(post.allowComments);
      expect(updated.postType).toBe(post.postType);
    });
  });

  describe('isOwnedBy', () => {
    it('should return true when userId matches', () => {
      const post = new Post(makeValidPostParams());
      expect(post.isOwnedBy('223e4567-e89b-12d3-a456-426614174001')).toBe(true);
    });

    it('should return false when userId does not match', () => {
      const post = new Post(makeValidPostParams());
      expect(post.isOwnedBy('323e4567-e89b-12d3-a456-426614174002')).toBe(false);
    });
  });

  describe('toParams', () => {
    it('should return all fields as a plain object', () => {
      const params = makeValidPostParams();
      const post = new Post(params);
      const result = post.toParams();
      expect(result.id).toBe(params.id);
      expect(result.userId).toBe(params.userId);
      expect(result.content).toBe(params.content);
      expect(result.isAnonymous).toBe(params.isAnonymous);
      expect(result.isUrgent).toBe(params.isUrgent);
      expect(result.allowComments).toBe(params.allowComments);
      expect(result.postType).toBe(params.postType);
      expect(result.createdAt).toEqual(params.createdAt);
      expect(result.updatedAt).toEqual(params.updatedAt);
    });
  });
});

describe('postTypeFromString', () => {
  it('should return PostType.PRAYER for "prayer"', () => {
    expect(postTypeFromString('prayer')).toBe(PostType.PRAYER);
  });

  it('should return PostType.ADVICE for "advice"', () => {
    expect(postTypeFromString('advice')).toBe(PostType.ADVICE);
  });

  it('should return PostType.TESTIMONY for "testimony"', () => {
    expect(postTypeFromString('testimony')).toBe(PostType.TESTIMONY);
  });

  it('should return PostType.GRATITUDE for "gratitude"', () => {
    expect(postTypeFromString('gratitude')).toBe(PostType.GRATITUDE);
  });

  it('should throw for invalid type', () => {
    expect(() => postTypeFromString('invalid')).toThrow('Invalid post type');
  });
});
