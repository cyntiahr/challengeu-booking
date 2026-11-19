# ChallengeU Booking

A full-stack scheduling application for one-on-one coaching sessions, replacing manual booking through text messages and spreadsheets.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, SQLite, Zod
- **Frontend:** React, TypeScript, Vite
- **Authentication:** JWT and bcrypt
- **Date handling:** date-fns and date-fns-tz
- **Testing:** Vitest and Supertest

## Features

### Coaches
- Publish 30- or 60-minute availability slots.
- Prevent overlapping availability.

### Students
- Browse available coaching sessions by calendar week.
- View session times in their configured timezone.
- Book sessions and view upcoming bookings.
- Cancel sessions at least 24 hours in advance.
- Receive in-app booking and cancellation notifications.

### Enrollment
- Register students.
- Suspend and reactivate student accounts.
- Prevent suspended students from booking new sessions.

### Booking Rules
- Prevent double booking, including concurrent booking attempts.
- Limit students to three upcoming sessions.
- Reopen availability after a successful cancellation.
- Store session timestamps in UTC.

## Getting Started

### Requirements

- Node.js 20 or later
- npm

### Backend

From the `backend` directory, install dependencies:

```bash
npm ci
```

Create a `.env` file containing:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-secure-random-secret"
```

Run database migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Seed the demo accounts:

```bash
npx tsx prisma/seed.ts
```

Start the development server:

```bash
npm run dev
```

The backend runs at `http://localhost:3000`.

### Frontend

In a separate terminal, from the `frontend` directory, install dependencies:

```bash
npm ci
npm run dev
```

Open the local URL displayed by Vite (typically `http://localhost:5173`).

The frontend proxies `/api` requests to the backend.

## Demo Accounts

All demo accounts use the password `Demo12345!`.

| Role | Email |
|---|---|
| Coach | coach@demo.com |
| Student | student@demo.com |
| Enrollment administrator | admin@demo.com |

To demonstrate the booking flow, log in as a coach and publish future availability, then log in as a student to book it.

## Architecture

The backend follows a modular structure separating authentication, scheduling, enrollment, and notifications.

- **Authentication:** JWT-based authentication and role-based authorization.
- **Scheduling:** Availability publishing, booking, cancellation, and booking rules.
- **Enrollment:** Student registration and account-status management.
- **Notifications:** In-app notifications generated during booking and cancellation.

Enrollment and notification operations are separated behind interfaces and Prisma-based implementations, allowing future integrations with external services.

SQLite and Prisma provide persistence. Database transactions and conditional updates help prevent concurrent double booking.

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Build the backend:

```bash
npm run build
```

Build and lint the frontend:

```bash
cd ../frontend
npm run build
npm run lint
```

The backend test suite includes authentication, authorization, booking constraints, cancellation rules, and concurrency scenarios.

## Design Decisions and Tradeoffs

- **Modular monolith:** Chosen instead of microservices to keep deployment and development simple while maintaining clear module boundaries.
- **SQLite:** Suitable for the exercise and local development. A production deployment would benefit from PostgreSQL and stronger operational safeguards.
- **UTC timestamps:** Used for persistence, with timezone conversion at the application boundary.
- **In-app notifications:** Implemented as a replaceable notification provider; email and SMS delivery are not included.
- **Single-coach selection:** The demo automatically selects the first active coach rather than providing a complete coach-selection interface.
- **Frontend:** Focused on demonstrating core workflows rather than production-level UI polish.

## AI-Assisted Development

AI coding assistance was used during development for planning, implementation guidance, debugging, and test suggestions.

The implementation was reviewed and iteratively tested, with incremental Git commits documenting development progress.

AI-generated suggestions were evaluated rather than accepted without verification.

## Future Improvements

- Support selecting among multiple coaches.
- Add automated frontend and end-to-end tests.
- Improve loading states and error presentation.
- Add external email/SMS notifications.
- Expand timezone and daylight-saving-time test coverage.
- Improve production deployment, observability, and security configuration.
