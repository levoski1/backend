import type { Request, Response } from 'express';
import { DevotionalService } from '../../../application/devotional/devotional-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { AuthorizationError } from '../../../shared/errors/index.js';

const devotionalService = new DevotionalService();

export const createDevotional = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  const devotional = await devotionalService.createDevotional(req.body);

  res.status(201).json({
    success: true,
    data: { devotional },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const updateDevotional = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  const { devotionalId } = req.params;
  const devotional = await devotionalService.updateDevotional(devotionalId, req.body);

  res.status(200).json({
    success: true,
    data: { devotional },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const deleteDevotional = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  const { devotionalId } = req.params;
  await devotionalService.deleteDevotional(devotionalId);

  res.status(200).json({
    success: true,
    data: null,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
