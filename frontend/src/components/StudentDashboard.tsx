import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { addWeeks, subWeeks } from 'date-fns';
import { getWeekRange, formatSessionDate } from '../utils/timeZone';

type AvailabilityBlock = {
    id: string;
    coachId: string;
    startAt: string;
    endAt: string;
};

type Session = {
    id: string;
    availabilityBlock: {
        startAt: string;
        endAt: string;
        coach: {
            name: string;
        };
    };
};

type Notification = {
    id: string;
    message: string;
    isRead: boolean;
    createdAt: string;
};

type Props = {
    token: string;
    coachId: string;
    timeZone: string;
};

export default function StudentDashboard({ token, coachId, timeZone }: Props) {
    const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
    const [error, setError] = useState('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedWeek, setSelectedWeek] = useState(new Date());

    const { startAt, endAt } = getWeekRange(selectedWeek, timeZone);
    console.log('Student timezone:', timeZone);
    console.log('Week start UTC:', startAt);
    console.log('Week end UTC:', endAt);

    async function handleBooking(availabilityBlockId: string) {
        setError('');

        try {
            await api(
                '/sessions',
                {
                    method: 'POST',
                    body: JSON.stringify({ availabilityBlockId }),
                },
                token,
            );

            setBlocks((current) =>
                current.filter((block) => block.id !== availabilityBlockId),
            );
            await loadSessions();
            await loadNotifications();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Booking failed');
        }
    }
    const loadSessions = useCallback(async () => {
        try {
            const data = await api<Session[]>('/sessions/upcoming', {}, token);

            setSessions(data);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load sessions',
            );
        }
    }, [token]);

    async function handleCancellation(sessionId: string) {
        setError('');

        try {
            await api(
                `/sessions/${sessionId}/cancel`,
                { method: 'PATCH' },
                token,
            );

            await loadSessions();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to cancel session',
            );
        }
    }
    const loadNotifications = useCallback(async () => {
        try {
            const data = await api<Notification[]>('/notifications', {}, token);

            setNotifications(data);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load notifications',
            );
        }
    }, [token]);

    useEffect(() => {
        async function loadAvailability() {
            try {
                const params = new URLSearchParams({
                    coachId,
                    startAt,
                    endAt,
                });

                const data = await api<AvailabilityBlock[]>(
                    `/availability?${params}`,
                    {},
                    token,
                );

                setBlocks(data);
                setError('');
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load availability',
                );
            }
        }

        void loadAvailability();
    }, [token, coachId, startAt, endAt]);
    useEffect(() => {
        void loadSessions();
    }, [loadSessions]);
    useEffect(() => {
        void loadNotifications();
    }, [loadNotifications]);

    return (
        <div>
            <section>
                <h2>Available coaching sessions</h2>
                <div>
                    <button
                        type='button'
                        onClick={() =>
                            setSelectedWeek((week) => subWeeks(week, 1))
                        }
                    >
                        Previous week
                    </button>

                    <span>
                        Week of{' '}
                        {formatSessionDate(startAt, timeZone)
                            .split(', ')
                            .slice(0, 2)
                            .join(', ')}
                    </span>

                    <button
                        type='button'
                        onClick={() =>
                            setSelectedWeek((week) => addWeeks(week, 1))
                        }
                    >
                        Next week
                    </button>
                </div>
                {blocks.length === 0 && <p>No available sessions found.</p>}

                <ul>
                    {blocks.map((block) => (
                        <li key={block.id}>
                            {formatSessionDate(block.startAt, timeZone)}

                            <button
                                type='button'
                                onClick={() => void handleBooking(block.id)}
                            >
                                Book
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
            <section>
                <h2>My upcoming sessions</h2>
                {sessions.length === 0 && <p>No upcoming sessions.</p>}
                {/* <div>
                    <button
                        type='button'
                        onClick={() =>
                            setSelectedWeek((week) => subWeeks(week, 1))
                        }
                    >
                        Previous week
                    </button>

                    <span>
                        Week of{' '}
                        {formatSessionDate(startAt, timeZone)
                            .split(', ')
                            .slice(0, 2)
                            .join(', ')}
                    </span>

                    <button
                        type='button'
                        onClick={() =>
                            setSelectedWeek((week) => addWeeks(week, 1))
                        }
                    >
                        Next week
                    </button>
                </div> */}
                <ul>
                    {sessions.map((session) => (
                        <li key={session.id}>
                            {formatSessionDate(
                                session.availabilityBlock.startAt,
                                timeZone,
                            )}
                            {' — '}
                            {session.availabilityBlock.coach.name}

                            <button
                                type='button'
                                onClick={() =>
                                    void handleCancellation(session.id)
                                }
                            >
                                Cancel
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
            <section>
                <h2>Notifications</h2>

                {notifications.length === 0 && <p>No notifications yet.</p>}

                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            {notification.message}
                            {' — '}
                            {new Date(notification.createdAt).toLocaleString()}
                        </li>
                    ))}
                </ul>
            </section>
            {error && <p role='alert'>{error}</p>}
        </div>
    );
}
