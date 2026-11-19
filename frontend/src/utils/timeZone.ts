import { format } from 'date-fns';
import { fromZonedTime, formatInTimeZone, toZonedTime } from 'date-fns-tz';

export function getWeekRange(date: Date, timeZone: string) {
    const localDate = formatInTimeZone(date, timeZone, 'yyyy-MM-dd');

    const [year, month, day] = localDate.split('-').map(Number);

    const calendarDate = new Date(Date.UTC(year, month - 1, day));

    // getUTCDay(): Sunday = 0, Monday = 1
    const daysSinceMonday = (calendarDate.getUTCDay() + 6) % 7;

    calendarDate.setUTCDate(calendarDate.getUTCDate() - daysSinceMonday);

    const weekStartDate = calendarDate.toISOString().slice(0, 10);

    calendarDate.setUTCDate(calendarDate.getUTCDate() + 7);

    const weekEndDate = calendarDate.toISOString().slice(0, 10);

    return {
        startAt: fromZonedTime(
            `${weekStartDate}T00:00:00`,
            timeZone,
        ).toISOString(),
        endAt: fromZonedTime(`${weekEndDate}T00:00:00`, timeZone).toISOString(),
    };
}

export function formatSessionDate(date: string, timeZone: string) {
    return format(toZonedTime(new Date(date), timeZone), 'MMM d, yyyy, h:mm a');
}
