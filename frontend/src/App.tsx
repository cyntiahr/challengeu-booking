import { useState } from 'react';
import { api } from './api';
import './App.css';
import StudentDashboard from './components/StudentDashboard';
import CoachDashboard from './components/CoachDashboard';
import AdminDashboard from './components/AdminDashboard';

type Role = 'STUDENT' | 'COACH' | 'ADMIN';

type LoginResponse = {
    token: string;
};

type AuthUser = {
    userId: string;
    role: Role;
};

type UserProfile = {
    id: string;
    name: string;
    role: Role;
    timeZone: string;
};
type Coach = {
    id: string;
    name: string;
};

function decodeToken(token: string): AuthUser {
    const payload = JSON.parse(atob(token.split('.')[1]));

    return {
        userId: payload.userId,
        role: payload.role,
    };
}

function App() {
    const [email, setEmail] = useState('student@demo.com');
    const [password, setPassword] = useState('Demo12345!');
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [coachId, setCoachId] = useState<string>('');

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        try {
            const result = await api<LoginResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            const authUser = decodeToken(result.token);

            const userProfile = await api<UserProfile>(
                '/auth/me',
                {},
                result.token,
            );

            if (userProfile.role === 'STUDENT') {
                const coaches = await api<Coach[]>(
                    '/coaches',
                    {},
                    result.token,
                );

                setCoachId(coaches[0]?.id ?? '');
            }

            setProfile(userProfile);
            setToken(result.token);
            setUser(authUser);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Login failed');
        }
    }

    function handleLogout() {
        setToken(null);
        setUser(null);
        setProfile(null);
        setCoachId('');
    }

    if (token && user) {
        return (
            <main className='app-layout'>
                <header className='app-header'>
                    <div className='app-brand'>
                        <h1>ChallengeU Booking</h1>
                        <p>Coaching & scheduling platform</p>
                    </div>

                    <div className='app-header-actions'>
                        <span className='role-badge'>
                            {user.role === 'ADMIN'
                                ? 'Enrollment'
                                : user.role === 'STUDENT'
                                  ? 'Student'
                                  : 'Coach'}
                        </span>

                        <button
                            type='button'
                            className='logout-button'
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {user.role === 'STUDENT' &&
                    (coachId ? (
                        <StudentDashboard
                            token={token}
                            coachId={coachId}
                            timeZone={profile!.timeZone}
                        />
                    ) : (
                        <p>No active coaches available.</p>
                    ))}

                {user.role === 'COACH' && <CoachDashboard token={token} />}

                {user.role === 'ADMIN' && <AdminDashboard token={token} />}
            </main>
        );
    }

    return (
        <main>
            <h1>ChallengeU Booking</h1>
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
                <label>
                    Email
                    <input
                        type='email'
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type='password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>

                <button type='submit'>Login</button>
            </form>

            {error && <p role='alert'>{error}</p>}
        </main>
    );
}

export default App;
