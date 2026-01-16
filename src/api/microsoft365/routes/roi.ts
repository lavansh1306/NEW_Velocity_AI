// src/api/microsoft365/routes/roi.ts
import express, { Request, Response } from 'express';
import * as graph from '../graphClient';

const router = express.Router();

// Helper: convert minutes to hours
function minutesToHours(mins: number): number { return mins / 60; }

// GET /api/microsoft365/roi
// Computes time-saved for the current user using two periods: before and after.
// Query params: beforeStart, beforeEnd, afterStart, afterEnd (ISO strings)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Default: compare previous 30 days vs the 30 days before that.
    // For simplicity this demo requires explicit query windows.
    const { beforeStart, beforeEnd, afterStart, afterEnd, costPerHour } = req.query as {
      beforeStart?: string;
      beforeEnd?: string;
      afterStart?: string;
      afterEnd?: string;
      costPerHour?: string;
    };
    if (!beforeStart || !beforeEnd || !afterStart || !afterEnd) {
      return res.status(400).json({ error: 'Please provide beforeStart,beforeEnd,afterStart,afterEnd query params (ISO).' });
    }

    // Get current user from session
    const currentUser = req.session?.account;
    if (!currentUser?.oid) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = currentUser.oid;
    const users = [{ id: userId, displayName: currentUser.name || 'Current User' }];

    const results = [];
    for (const u of users) {
      const userId = u.id;

      // Fetch calendar events for both windows
      const beforeEvents = await graph.getUserCalendarEvents(req, userId, beforeStart, beforeEnd).catch(() => ({ value: [] }));
      const afterEvents = await graph.getUserCalendarEvents(req, userId, afterStart, afterEnd).catch(() => ({ value: [] }));

      // Calculate meeting minutes by summing event durations where user is attendee/organizer
      function sumMeetingMinutes(evList: any): number {
        const list = evList.value || [];
        let total = 0;
        for (const ev of list) {
          try {
            const s = new Date(ev.start.dateTime || ev.start).getTime();
            const e = new Date(ev.end.dateTime || ev.end).getTime();
            if (!isNaN(s) && !isNaN(e) && e > s) total += (e - s) / 60000;
          } catch (e) { }
        }
        return total;
      }

      const meetingMinutesBefore = sumMeetingMinutes(beforeEvents);
      const meetingMinutesAfter = sumMeetingMinutes(afterEvents);

      // Email metrics: reports API returns CSV blob or JSON depending on call; we keep this demo simple.
      // For a real implementation parse the report and sum active minutes.
      const emailReportBefore = await graph.getEmailActivityReport(req, 'D30').catch(() => null);
      const emailReportAfter = await graph.getEmailActivityReport(req, 'D30').catch(() => null);

      // Placeholder: email minutes estimated from message counts (DEMO only)
      const emailMinutesBefore = 0;
      const emailMinutesAfter = 0;

      // Focus hours: placeholder (requires Viva Insights)
      const focusHoursBefore = 0;
      const focusHoursAfter = 0;

      const meetingTimeSaved = meetingMinutesBefore - meetingMinutesAfter;
      const emailTimeSaved = emailMinutesBefore - emailMinutesAfter;
      const focusGain = focusHoursAfter - focusHoursBefore;

      const totalTimeSavedHours = (meetingTimeSaved + emailTimeSaved) / 60 + focusGain;
      const fullyLoadedHourlyCost = parseFloat(costPerHour || '50');
      const estimatedMoneySaved = totalTimeSavedHours * fullyLoadedHourlyCost;

      results.push({
        userId,
        displayName: u.displayName,
        meetingMinutesBefore: Math.round(meetingMinutesBefore),
        meetingMinutesAfter: Math.round(meetingMinutesAfter),
        meetingTimeSavedHours: +(meetingTimeSaved/60).toFixed(2),
        emailTimeSavedHours: +(emailTimeSaved/60).toFixed(2),
        focusGainHours: +focusGain.toFixed(2),
        totalTimeSavedHours: +totalTimeSavedHours.toFixed(2),
        estimatedMoneySaved: +estimatedMoneySaved.toFixed(2)
      });
    }

    res.json({ tenantId: req.session?.tenantId || null, users: results });
  } catch (err: any) {
    console.error('ROI error', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
