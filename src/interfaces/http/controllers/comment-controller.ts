import type { Request, Response } from 'express';
import { CommentService } from '../../../application/feed/comment-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

const commentService = new CommentService();

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { postId } = req.params;
  const { content, isAnonymous } = req.body;

  const comment = await commentService.addComment({
    postId,
    userId,
    content,
    isAnonymous,
  });

  res.status(201).json({
    success: true,
    data: { comment },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  const comments = await commentService.getComments(postId);

  res.status(200).json({
    success: true,
    data: { comments },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { postId, commentId } = req.params;

  await commentService.deleteComment(commentId, postId, userId);

  res.status(200).json({
    success: true,
    data: null,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
