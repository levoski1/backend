import type { Request, Response } from 'express';
import { StreakService } from '../../../application/devotional/streak-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

const streakService = new StreakService();

export const getMyStreaks = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  const streaks = await streakService.getAllStreaks(userId);

  res.status(200).json({
    success: true,
    data: { streaks },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
