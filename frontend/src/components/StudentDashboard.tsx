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
        <main className='student-dashboard'>
            <section className='dashboard-card'>
                <h2>Available coaching sessions</h2>

                <div className='week-navigation'>
                    <button
                        type='button'
                        className='week-button'
                        onClick={() =>
                            setSelectedWeek((week) => subWeeks(week, 1))
                        }
                    >
                        ← Previous
                    </button>

                    <div className='week-label'>
                        <span>SELECTED WEEK</span>
                        <strong>
                            {formatSessionDate(startAt, timeZone)
                                .split(', ')
                                .slice(0, 2)
                                .join(', ')}
                        </strong>
                    </div>

                    <button
                        type='button'
                        className='week-button'
                        onClick={() =>
                            setSelectedWeek((week) => addWeeks(week, 1))
                        }
                    >
                        Next →
                    </button>
                </div>

                {blocks.length === 0 && (
                    <p className='empty-state'>
                        No available sessions this week.
                    </p>
                )}

                <ul className='session-list'>
                    {blocks.map((block) => (
                        <li key={block.id} className='session-item'>
                            <span>
                                {formatSessionDate(block.startAt, timeZone)}
                            </span>

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

            <section className='dashboard-card'>
                <h2>My upcoming sessions</h2>

                {sessions.length === 0 && (
                    <p className='empty-state'>No upcoming sessions.</p>
                )}

                <ul className='session-list'>
                    {sessions.map((session) => (
                        <li key={session.id} className='session-item'>
                            <span>
                                {formatSessionDate(
                                    session.availabilityBlock.startAt,
                                    timeZone,
                                )}
                                {' — '}
                                {session.availabilityBlock.coach.name}
                            </span>

                            <button
                                type='button'
                                className='button-secondary'
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

            <section className='dashboard-card'>
                <h2>Notifications</h2>

                {notifications.length === 0 && (
                    <p className='empty-state'>No notifications yet.</p>
                )}

                <ul className='notification-list'>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <p>{notification.message}</p>
                            <small>
                                {new Date(
                                    notification.createdAt,
                                ).toLocaleString()}
                            </small>
                        </li>
                    ))}
                </ul>
            </section>

            {error && (
                <p role='alert' className='error-message'>
                    {error}
                </p>
            )}
        </main>
    );
}
