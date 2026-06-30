import type { Request, Response } from 'express';
import { PostService } from '../../../application/feed/post-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { postTypeFromString } from '../../../domain/index.js';

const postService = new PostService();

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { content, isAnonymous, allowComments, isUrgent, postType: postTypeStr } = req.body;

  const postType = postTypeFromString(postTypeStr);

  const post = await postService.createPost({
    userId,
    content,
    isAnonymous,
    allowComments,
    isUrgent,
    postType,
  });

  res.status(201).json({
    success: true,
    data: { post },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 20;
  const cursor = req.query.cursor as string | undefined;
  const sort = (req.query.sort as 'recent' | 'trending') || 'recent';
  const type = req.query.type as string | undefined;

  const result = await postService.getFeed({
    limit: Math.min(Math.max(limit, 1), 100),
    cursor,
    sort,
    type: type ? postTypeFromString(type) : undefined,
  });

  res.status(200).json({
    success: true,
    data: result,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  const post = await postService.getPost(postId);

  res.status(200).json({
    success: true,
    data: { post },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { postId } = req.params;
  const { content } = req.body;

  const post = await postService.updatePost(postId, userId, { content });

  res.status(200).json({
    success: true,
    data: { post },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { postId } = req.params;

  await postService.deletePost(postId, userId);

  res.status(200).json({
    success: true,
    data: null,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
