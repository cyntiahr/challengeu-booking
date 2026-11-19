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
    <section>
      <h2>Coach Dashboard</h2>
      <h3>Publish availability</h3>

      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Start date and time
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            required
          />
        </label>

        <label>
          Duration
          <select
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(Number(event.target.value) as 30 | 60)
            }
          >
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </label>

        <button type="submit">Publish</button>
      </form>

      {message && <p>{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}