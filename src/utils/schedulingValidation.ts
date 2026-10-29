import { Appointment } from '../types';

/**
 * Parses time strings like "10:00 AM", "02:30 PM", "14:30", "9:00" into minutes from start of day (0-1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 9 * 60; // Default 09:00
  const clean = timeStr.trim().toLowerCase();
  
  const isPM = clean.includes('pm') || clean.includes('p.m.');
  const isAM = clean.includes('am') || clean.includes('a.m.');
  
  // Remove non-digit and non-colon characters
  const timeOnly = clean.replace(/[^0-9:]/g, '');
  const parts = timeOnly.split(':');
  
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  
  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  
  return (hours * 60) + minutes;
}

/**
 * Formats minutes from midnight into 12-hour readable format (e.g. 660 -> "11:00 AM")
 */
export function formatMinutesToTime12h(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mStr} ${period}`;
}

/**
 * Parses a date (YYYY-MM-DD or readable) and time string into a Date object.
 */
export function parseDateTime(dateISO: string, timeStr: string): Date | null {
  try {
    if (!dateISO) return null;
    
    // Check if ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateISO.trim())) {
      const [year, month, day] = dateISO.trim().split('-').map(Number);
      const totalMinutes = parseTimeToMinutes(timeStr);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return new Date(year, month - 1, day, hours, mins, 0, 0);
    }

    // Fallback parsing
    const parsed = new Date(`${dateISO} ${timeStr}`);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Returns true if the selected date and time are in the past.
 * Adds a tiny 1-minute buffer to allow scheduling the immediate current minute.
 */
export function isPastDateTime(dateISO: string, timeStr: string): boolean {
  const target = parseDateTime(dateISO, timeStr);
  if (!target) return false;
  
  const now = new Date();
  // Buffer of 60 seconds (1 minute)
  return target.getTime() < (now.getTime() - 60000);
}

/**
 * Normalizes dates to YYYY-MM-DD key when possible.
 */
export function normalizeDateKey(apt: Appointment): string {
  if (apt.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(apt.dateISO)) {
    return apt.dateISO;
  }
  // Try extracting YYYY-MM-DD from apt.date
  const match = apt.date.match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  
  return apt.date.trim().toLowerCase();
}

/**
 * Checks whether two time intervals overlap: [startA, startA + durationA) and [startB, startB + durationB)
 */
export function doIntervalsOverlap(
  startA: number,
  durationA: number,
  startB: number,
  durationB: number
): boolean {
  const endA = startA + Math.max(15, durationA);
  const endB = startB + Math.max(15, durationB);
  return startA < endB && endA > startB;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: 'technician' | 'business_schedule';
  conflictingAppointment?: Appointment;
  reason?: string;
  conflictingTimeRange?: string;
}

/**
 * Validates technician and appointment schedule conflicts.
 * Detects if a technician or resource already has an overlapping appointment on the same date.
 */
export function checkScheduleConflict(
  existingAppointments: Appointment[],
  candidate: {
    id?: string; // If editing/rescheduling, exclude self
    dateISO: string;
    startTime: string;
    durationMinutes: number;
    technician?: string;
  }
): ConflictCheckResult {
  const candidateKey = candidate.dateISO.trim().toLowerCase();
  const candidateStart = parseTimeToMinutes(candidate.startTime);
  const candidateDuration = candidate.durationMinutes || 60;
  const candidateTech = candidate.technician?.trim().toLowerCase();

  // Active appointments only (never count cancelled appointments as conflicts)
  const activeAppointments = existingAppointments.filter(
    apt => apt.status !== 'cancelled' && apt.id !== candidate.id
  );

  for (const apt of activeAppointments) {
    const aptKey = normalizeDateKey(apt);
    
    // Check if dates match (either exact ISO match or day text match)
    const isSameDay = aptKey === candidateKey || 
      (candidateKey && apt.date.toLowerCase().includes(candidateKey)) ||
      (aptKey && candidate.dateISO.toLowerCase().includes(aptKey));

    if (!isSameDay) continue;

    const aptStart = parseTimeToMinutes(apt.startTime);
    const aptDuration = apt.durationMinutes || 60;

    // Check time slot overlap
    const overlaps = doIntervalsOverlap(
      candidateStart,
      candidateDuration,
      aptStart,
      aptDuration
    );

    if (!overlaps) continue;

    const aptEndTime = apt.endTime || formatMinutesToTime12h(aptStart + aptDuration);
    const timeRangeStr = `${apt.startTime} - ${aptEndTime}`;

    // 1. Technician/Resource specific collision
    const aptTech = apt.technician?.trim().toLowerCase();
    if (candidateTech && aptTech && candidateTech === aptTech) {
      return {
        hasConflict: true,
        conflictType: 'technician',
        conflictingAppointment: apt,
        conflictingTimeRange: timeRangeStr,
        reason: `El técnico/recurso "${apt.technician}" ya está asignado a la cita con ${apt.clientName} (${apt.serviceName}) de ${timeRangeStr}. Elige otro técnico o modifica el horario.`
      };
    }

    // 2. Same technician name match or both assigned to default owner/general
    if (candidateTech && !aptTech) {
      // If candidate is a specific named technician and existing has no technician,
      // it might not block unless it's a 1-person business. We still detect general overlap as warning.
    } else if (!candidateTech && !aptTech) {
      // Both without explicit technician in a single-person business
      return {
        hasConflict: true,
        conflictType: 'business_schedule',
        conflictingAppointment: apt,
        conflictingTimeRange: timeRangeStr,
        reason: `Ya tienes otra cita agendada en este mismo horario con ${apt.clientName} (${apt.serviceName}) de ${timeRangeStr}.`
      };
    }
  }

  return { hasConflict: false };
}
