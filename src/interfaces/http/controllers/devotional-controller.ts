import type { Request, Response } from 'express';
import { DevotionalService } from '../../../application/devotional/devotional-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

const devotionalService = new DevotionalService();

interface RequestWithPossibleUser extends Request {
  user?: { id: string; role: string };
}

function getUserId(req: Request): string | undefined {
  return (req as RequestWithPossibleUser).user?.id;
}

export const getToday = asyncHandler(async (req: Request, res: Response) => {
  const devotional = await devotionalService.getToday(getUserId(req));

  res.status(200).json({
    success: true,
    data: { devotional },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const getByDate = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.params;
  const devotional = await devotionalService.getByDate(date, getUserId(req));

  res.status(200).json({
    success: true,
    data: { devotional },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const getArchive = asyncHandler(async (req: Request, res: Response) => {
  const items = await devotionalService.getArchive(getUserId(req));

  res.status(200).json({
    success: true,
    data: { items },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const getByIdentifier = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const userId = getUserId(req);

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (dateRegex.test(identifier)) {
    const devotional = await devotionalService.getByDate(identifier, userId);
    res.status(200).json({
      success: true,
      data: { devotional },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (uuidRegex.test(identifier)) {
    const devotional = await devotionalService.getById(identifier, userId);
    res.status(200).json({
      success: true,
      data: { devotional },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Identifier must be a valid date (YYYY-MM-DD) or UUID',
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const completeDevotional = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const { devotionalId } = req.params;

  const result = await devotionalService.completeDevotional(devotionalId, userId);

  res.status(200).json({
    success: true,
    data: result,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
