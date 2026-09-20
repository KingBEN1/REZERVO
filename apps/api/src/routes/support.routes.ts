import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../lib/async.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supportTicketSchema } from '../validators.js';

export const supportRouter = Router();

supportRouter.post(
  '/tickets',
  requireAuth,
  validate(supportTicketSchema),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.auth!.userId,
        subject: req.body.subject || 'Pyetje nga chatboti',
        category: req.body.category,
        message: req.body.message,
      },
      select: { id: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: { ticket } });
  }),
);
