import { useState } from "react";
import { api } from "../api";

type Props = {
  token: string;
};

export default function AdminDashboard({ token }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [timeZone, setTimeZone] = useState("America/Toronto");
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const student = await api<{ id: string }>(
        "/enrollment/students",
        {
          method: "POST",
          body: JSON.stringify({ email, name, password, timeZone }),
        },
        token,
      );

      setMessage(`Student registered successfully. ID: ${student.id}`);
      setStudentId(student.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    }
  }

  async function handleStatus(status: "ACTIVE" | "SUSPENDED") {
    setMessage("");
    setError("");

    try {
      await api(
        `/enrollment/students/${studentId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        token,
      );

      setMessage(`Student status updated to ${status}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <section>
      <h2>Enrollment Dashboard</h2>

      <h3>Register student</h3>

      <form onSubmit={(event) => void handleRegistration(event)}>
        <input
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <select
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
        >
          <option value="America/Toronto">Toronto</option>
          <option value="America/Vancouver">Vancouver</option>
          <option value="Europe/Paris">Paris</option>
        </select>

        <button type="submit">Register</button>
      </form>

      <h3>Manage student status</h3>

      <input
        placeholder="Student ID"
        value={studentId}
        onChange={(event) => setStudentId(event.target.value)}
      />

      <button
        type="button"
        disabled={!studentId.trim()}
        onClick={() => void handleStatus("SUSPENDED")}
      >
        Suspend
      </button>

      <button
        type="button"
        disabled={!studentId.trim()}
        onClick={() => void handleStatus("ACTIVE")}
      >
        Reactivate
      </button>

      {message && <p>{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}