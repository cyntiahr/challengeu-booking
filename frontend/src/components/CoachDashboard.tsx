
import { useState } from "react";
import { api } from "../api";

type Props = {
  token: string;
};

export default function CoachDashboard({ token }: Props) {
  const [startAt, setStartAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(30);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api(
        "/availability",
        {
          method: "POST",
          body: JSON.stringify({
            startAt: new Date(startAt).toISOString(),
            durationMinutes,
          }),
        },
        token,
      );

      setMessage("Availability published successfully!");
      setStartAt("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to publish availability",
      );
    }
  }

  return (
    <main className="coach-dashboard">
      <section className="dashboard-card">
        <div className="dashboard-section-header">
          <div>
            <h2>Publish availability</h2>
            <p>
              Create time slots for students to book coaching sessions.
            </p>
          </div>
        </div>

        <form
          className="coach-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="form-grid">
            <label className="form-field">
              Start date and time
              <input
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              Duration
              <select
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(
                    Number(event.target.value) as 30 | 60
                  )
                }
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit">
              Publish availability
            </button>
          </div>
        </form>

        {message && (
          <p role="status" className="success-message">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
