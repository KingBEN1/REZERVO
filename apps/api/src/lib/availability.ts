import { addMinutes, areIntervalsOverlapping, isBefore, max, min } from 'date-fns';

export interface Interval { start: Date; end: Date }
export interface DailyHours { startTime: string; endTime: string; isOpen: boolean }

function atTime(dayStart: Date, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return new Date(dayStart.getTime() + ((hour ?? 0) * 60 + (minute ?? 0)) * 60_000);
}

export function slotsForDay(input: {
  dayStart: Date;
  hours: DailyHours[];
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  slotIntervalMin?: number;
  unavailable: Interval[];
  earliestStart?: Date;
}) {
  const slots: Interval[] = [];
  const slotIntervalMin = input.slotIntervalMin ?? 15;
  for (const hours of input.hours.filter((hour) => hour.isOpen)) {
    const opensAt = atTime(input.dayStart, hours.startTime);
    const closesAt = atTime(input.dayStart, hours.endTime);
    for (let start = opensAt; isBefore(start, closesAt); start = addMinutes(start, slotIntervalMin)) {
      const end = addMinutes(start, input.durationMin);
      const protectedRange = {
        start: addMinutes(start, -input.bufferBeforeMin),
        end: addMinutes(end, input.bufferAfterMin),
      };
      if (end > closesAt || (input.earliestStart && isBefore(start, input.earliestStart))) continue;
      if (input.unavailable.some((range) => areIntervalsOverlapping(protectedRange, range))) continue;
      slots.push({ start, end });
    }
  }
  return slots;
}

export function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

export function clampInterval(interval: Interval, bounds: Interval): Interval | null {
  const start = max([interval.start, bounds.start]);
  const end = min([interval.end, bounds.end]);
  return start < end ? { start, end } : null;
}
