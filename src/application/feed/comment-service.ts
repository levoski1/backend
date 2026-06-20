import crypto from 'node:crypto';
import { Comment } from '../../domain/index.js';
import { PostRepository } from '../../infrastructure/database/repositories/post-repository.js';
import { CommentRepository } from '../../infrastructure/database/repositories/comment-repository.js';
import { NotFoundError, AuthorizationError } from '../../shared/errors/index.js';

export interface CreateCommentParams {
  postId: string;
  userId: string;
  content: string;
  isAnonymous?: boolean;
}

export class CommentService {
  constructor(
    private readonly postRepo: PostRepository = new PostRepository(),
    private readonly commentRepo: CommentRepository = new CommentRepository(),
  ) {}

  async addComment(params: CreateCommentParams) {
    const post = await this.postRepo.findById(params.postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    const comment = Comment.create({
      id: crypto.randomUUID(),
      postId: params.postId,
      userId: params.userId,
      content: params.content,
      isAnonymous: params.isAnonymous ?? false,
    });

    const created = await this.commentRepo.create(comment);

    const displayName = created.isAnonymous
      ? 'A Shelter Member'
      : undefined;

    return {
      id: created.id,
      postId: created.postId,
      userId: created.userId,
      content: created.content,
      isAnonymous: created.isAnonymous,
      authorDisplayName: displayName,
      createdAt: created.createdAt,
    };
  }

  async getComments(postId: string) {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    const results = await this.commentRepo.findByPostId(postId);

    return results.map(({ comment, authorDisplayName, authorAvatarUrl }) => {
      const displayName = comment.isAnonymous
        ? 'A Shelter Member'
        : (authorDisplayName ?? 'A Shelter Member');

      return {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        isAnonymous: comment.isAnonymous,
        authorDisplayName: displayName,
        authorAvatarUrl: comment.isAnonymous ? null : (authorAvatarUrl ?? null),
        createdAt: comment.createdAt,
      };
    });
  }

  async deleteComment(commentId: string, postId: string, userId: string) {
    const comment = await this.commentRepo.findById(commentId);

    if (!comment || comment.postId !== postId) {
      throw new NotFoundError('Comment');
    }

    if (!comment.isOwnedBy(userId)) {
      throw new AuthorizationError('You can only delete your own comments');
    }

    await this.commentRepo.delete(commentId);
  }
}
