import { Router } from 'express';
import { env } from '../config.js';
import { asyncHandler } from '../lib/async.js';
import { AppError } from '../lib/errors.js';
import { sendDueBookingReminders } from '../services/notification.service.js';

export const internalRouter = Router();

internalRouter.post(
  '/booking-reminders',
  asyncHandler(async (req, res) => {
    if (!env.CRON_SECRET)
      throw new AppError(503, 'CRON_NOT_CONFIGURED', 'Rikujtuesit nuk janë konfiguruar ende.');
    if (req.get('authorization') !== `Bearer ${env.CRON_SECRET}`)
      throw new AppError(401, 'UNAUTHORIZED', 'Kërkesa e planifikuar nuk u autorizua.');
    const result = await sendDueBookingReminders();
    res.json({ success: true, data: result });
  }),
);
