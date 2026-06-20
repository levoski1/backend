import { Reaction, ReactionType, reactionTypeFromString } from '@domain/index';

function makeValidReactionParams(overrides: Record<string, unknown> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    postId: '223e4567-e89b-12d3-a456-426614174001',
    userId: '323e4567-e89b-12d3-a456-426614174002',
    reactionType: ReactionType.PRAYER,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('Reaction Entity', () => {
  describe('constructor', () => {
    it('should create a reaction with all required fields', () => {
      const params = makeValidReactionParams();
      const reaction = new Reaction(params);
      expect(reaction.id).toBe(params.id);
      expect(reaction.postId).toBe(params.postId);
      expect(reaction.userId).toBe(params.userId);
      expect(reaction.reactionType).toBe(ReactionType.PRAYER);
      expect(reaction.createdAt).toEqual(new Date('2026-01-01'));
    });

    it('should create a heart reaction', () => {
      const params = makeValidReactionParams({ reactionType: ReactionType.HEART });
      const reaction = new Reaction(params);
      expect(reaction.reactionType).toBe(ReactionType.HEART);
    });

    it('should create an amen reaction', () => {
      const params = makeValidReactionParams({ reactionType: ReactionType.AMEN });
      const reaction = new Reaction(params);
      expect(reaction.reactionType).toBe(ReactionType.AMEN);
    });

    it('should reject invalid UUID for id', () => {
      const params = makeValidReactionParams({ id: 'not-a-uuid' });
      expect(() => new Reaction(params)).toThrow('Reaction ID must be a valid UUID');
    });

    it('should reject empty id', () => {
      const params = makeValidReactionParams({ id: '' });
      expect(() => new Reaction(params)).toThrow('Reaction ID is required');
    });

    it('should reject invalid UUID for postId', () => {
      const params = makeValidReactionParams({ postId: 'not-a-uuid' });
      expect(() => new Reaction(params)).toThrow('Post ID must be a valid UUID');
    });

    it('should reject invalid UUID for userId', () => {
      const params = makeValidReactionParams({ userId: 'not-a-uuid' });
      expect(() => new Reaction(params)).toThrow('User ID must be a valid UUID');
    });
  });

  describe('static create', () => {
    it('should create a reaction with current date', () => {
      const reaction = Reaction.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        postId: '223e4567-e89b-12d3-a456-426614174001',
        userId: '323e4567-e89b-12d3-a456-426614174002',
        reactionType: ReactionType.HEART,
      });

      expect(reaction.reactionType).toBe(ReactionType.HEART);
      expect(reaction.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('isOwnedBy', () => {
    it('should return true when userId matches', () => {
      const reaction = new Reaction(makeValidReactionParams());
      expect(reaction.isOwnedBy('323e4567-e89b-12d3-a456-426614174002')).toBe(true);
    });

    it('should return false when userId does not match', () => {
      const reaction = new Reaction(makeValidReactionParams());
      expect(reaction.isOwnedBy('423e4567-e89b-12d3-a456-426614174003')).toBe(false);
    });
  });

  describe('toParams', () => {
    it('should return all fields as a plain object', () => {
      const params = makeValidReactionParams();
      const reaction = new Reaction(params);
      const result = reaction.toParams();
      expect(result.id).toBe(params.id);
      expect(result.postId).toBe(params.postId);
      expect(result.userId).toBe(params.userId);
      expect(result.reactionType).toBe(params.reactionType);
      expect(result.createdAt).toEqual(params.createdAt);
    });
  });
});

describe('reactionTypeFromString', () => {
  it('should return ReactionType.PRAYER for "prayer"', () => {
    expect(reactionTypeFromString('prayer')).toBe(ReactionType.PRAYER);
  });

  it('should return ReactionType.HEART for "heart"', () => {
    expect(reactionTypeFromString('heart')).toBe(ReactionType.HEART);
  });

  it('should return ReactionType.AMEN for "amen"', () => {
    expect(reactionTypeFromString('amen')).toBe(ReactionType.AMEN);
  });

  it('should throw for invalid type', () => {
    expect(() => reactionTypeFromString('invalid')).toThrow('Invalid reaction type');
  });
});
