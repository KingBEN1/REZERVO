import { describe, expect, it } from 'vitest';
import { slotsForDay } from './availability.js';

describe('availability engine', () => {
  it('excludes an already booked protected range', () => {
    const day = new Date('2026-08-17T00:00:00.000Z');
    const slots = slotsForDay({
      dayStart: day,
      hours: [{ startTime: '09:00', endTime: '11:00', isOpen: true }],
      durationMin: 30,
      bufferBeforeMin: 0,
      bufferAfterMin: 0,
      slotIntervalMin: 30,
      unavailable: [{ start: new Date('2026-08-17T09:30:00.000Z'), end: new Date('2026-08-17T10:00:00.000Z') }],
    });
    expect(slots.map((slot) => slot.start.toISOString())).toEqual(['2026-08-17T09:00:00.000Z', '2026-08-17T10:00:00.000Z', '2026-08-17T10:30:00.000Z']);
  });

  it('honours service buffers', () => {
    const slots = slotsForDay({
      dayStart: new Date('2026-08-17T00:00:00.000Z'),
      hours: [{ startTime: '09:00', endTime: '11:00', isOpen: true }],
      durationMin: 30,
      bufferBeforeMin: 0,
      bufferAfterMin: 10,
      slotIntervalMin: 15,
      unavailable: [{ start: new Date('2026-08-17T09:30:00.000Z'), end: new Date('2026-08-17T10:00:00.000Z') }],
    });
    expect(slots.some((slot) => slot.start.toISOString() === '2026-08-17T09:15:00.000Z')).toBe(false);
  });
});
