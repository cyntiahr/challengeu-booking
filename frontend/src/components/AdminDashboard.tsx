import { useState } from 'react';
import { api } from '../api';

type Props = {
    token: string;
};

export default function AdminDashboard({ token }: Props) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [timeZone, setTimeZone] = useState('America/Toronto');
    const [studentId, setStudentId] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function handleRegistration(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            const student = await api<{ id: string }>(
                '/enrollment/students',
                {
                    method: 'POST',
                    body: JSON.stringify({ email, name, password, timeZone }),
                },
                token,
            );

            setMessage(`Student registered successfully. ID: ${student.id}`);
            setStudentId(student.id);
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Registration failed',
            );
        }
    }

    async function handleStatus(status: 'ACTIVE' | 'SUSPENDED') {
        setMessage('');
        setError('');

        try {
            await api(
                `/enrollment/students/${studentId}/status`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ status }),
                },
                token,
            );

            setMessage(`Student status updated to ${status}`);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Update failed');
        }
    }

    return (
        <div className='admin-dashboard'>
            <section className='dashboard-card'>
                <div className='dashboard-section-header'>
                    <h2>Register student</h2>
                    <p>
                        Create a new student account and assign their timezone.
                    </p>
                </div>

                <form
                    className='admin-form'
                    onSubmit={(event) => void handleRegistration(event)}
                >
                    <div className='form-grid'>
                        <label className='form-field'>
                            Full name
                            <input
                                type='text'
                                placeholder='Student name'
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                required
                            />
                        </label>

                        <label className='form-field'>
                            Email address
                            <input
                                type='email'
                                placeholder='student@example.com'
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                            />
                        </label>

                        <label className='form-field'>
                            Password
                            <input
                                type='password'
                                placeholder='Minimum 8 characters'
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                minLength={8}
                                autoComplete='new-password'
                                required
                            />
                        </label>

                        <label className='form-field'>
                            Timezone
                            <select
                                value={timeZone}
                                onChange={(event) =>
                                    setTimeZone(event.target.value)
                                }
                            >
                                <option value='America/Toronto'>Toronto</option>
                                <option value='America/Vancouver'>
                                    Vancouver
                                </option>
                                <option value='Europe/Paris'>Paris</option>
                            </select>
                        </label>
                    </div>

                    <div className='form-actions'>
                        <button type='submit'>Register student</button>
                    </div>
                </form>
            </section>

            <section className='dashboard-card'>
                <div className='dashboard-section-header'>
                    <h2>Manage student status</h2>
                    <p>Suspend or reactivate an existing student account.</p>
                </div>

                <div className='student-status-form'>
                    <label className='form-field'>
                        Student ID
                        <input
                            type='text'
                            placeholder='Enter student ID'
                            value={studentId}
                            onChange={(event) =>
                                setStudentId(event.target.value)
                            }
                        />
                    </label>

                    <div className='status-actions'>
                        <button
                            type='button'
                            className='button-danger'
                            disabled={!studentId.trim()}
                            onClick={() => void handleStatus('SUSPENDED')}
                        >
                            Suspend
                        </button>

                        <button
                            type='button'
                            className='button-outline'
                            disabled={!studentId.trim()}
                            onClick={() => void handleStatus('ACTIVE')}
                        >
                            Reactivate
                        </button>
                    </div>
                </div>
            </section>

            {message && (
                <p role='status' className='success-message'>
                    {message}
                </p>
            )}

            {error && (
                <p role='alert' className='error-message'>
                    {error}
                </p>
            )}
        </div>
    );
}
