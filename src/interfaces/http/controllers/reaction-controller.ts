import type { Request, Response } from 'express';
import { ReactionService } from '../../../application/feed/reaction-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { reactionTypeFromString } from '../../../domain/index.js';

const reactionService = new ReactionService();

export const addReaction = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { postId } = req.params;
  const { reactionType: reactionTypeStr } = req.body;

  const reactionType = reactionTypeFromString(reactionTypeStr);

  const counts = await reactionService.addReaction({
    postId,
    userId,
    reactionType,
  });

  res.status(201).json({
    success: true,
    data: { reactionCounts: counts },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const removeReaction = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { postId } = req.params;
  const { reactionType: reactionTypeStr } = req.body;

  const reactionType = reactionTypeFromString(reactionTypeStr);

  const counts = await reactionService.removeReaction(postId, userId, reactionType);

  res.status(200).json({
    success: true,
    data: { reactionCounts: counts },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
