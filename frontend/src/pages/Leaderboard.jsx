import { useEffect, useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : null;
    if (!u) {
      navigate("/login", { replace: true });
      return;
    }
    setUserEmail(u.email);

    (async () => {
      try {
        const { data } = await api.get("/api/game/leaderboard");

        // handle both { leaderboard: [...] } and direct array
        const list = Array.isArray(data?.leaderboard)
          ? data.leaderboard
          : Array.isArray(data)
          ? data
          : [];

        setPlayers(list);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div className="center">
      <div className="card stack fade-in" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="title">🏆 Leaderboard</h2>
          <Link className="btn ghost" to="/dashboard">← Back</Link>
        </div>

        {loading ? (
          <p>Loading leaderboard...</p>
        ) : players.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {players.map((p, i) => (
              <li
                key={i}
                style={{
                  background: p.email === userEmail ? "#1e3a8a" : "#111827",
                  color: p.email === userEmail ? "#fff" : "#e5e7eb",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontWeight: p.email === userEmail ? "600" : "normal",
                }}
              >
                <span>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}{" "}
                  {p.email === userEmail ? "You" : p.email}{" "}
                  <small style={{ color: "#9ca3af" }}>({p.level})</small>
                </span>

                <span style={{ color: "#facc15" }}>
                  {p.highscore ?? 0} pts
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No scores yet. Be the first to play!</p>
        )}
      </div>
    </div>
  );
}
