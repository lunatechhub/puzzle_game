import { useEffect, useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [level, setLevel] = useState("easy");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : null;
    if (!u) {
      navigate("/login", { replace: true });
      return;
    }
    if (u?.email) setUserEmail(u.email);

    const fetchTop = async () => {
      try {
        const { data } = await api.get("/api/game/leaderboard");
        if (Array.isArray(data)) setTopPlayers(data.slice(0, 3));
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      }
    };
    fetchTop();
  }, [navigate]);

  return (
    <div className="center">
      <div className="card stack" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="title">Welcome to Banana Game 🍌</h2>
          <button className="btn ghost" onClick={()=>setDarkMode(d=>!d)}>
            {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <div className="mini-leaderboard">
          <h3>Top 3 Players 🏆</h3>
          {topPlayers.length ? (
            <ul>
              {topPlayers.map((p, i) => (
                <li key={i}>
                  {i===0?"🥇":i===1?"🥈":"🥉"} {p.email===userEmail?"You":`Player ${i+1}`} — {p.highscore}
                </li>
              ))}
            </ul>
          ) : (<p>No scores yet...</p>)}
          <Link className="btn ghost" to="/leaderboard">View Full Leaderboard →</Link>
        </div>

        <div className="stack">
          <select className="input" value={level} onChange={(e)=>setLevel(e.target.value)}>
            <option value="easy">🍌 Easy</option>
            <option value="medium">🍍 Medium</option>
            <option value="hard">🥥 Hard</option>
          </select>

          <Link className="btn" to={`/game?level=${level}`}>🎮 Play Game</Link>

          <button className="btn ghost" onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              navigate("/", { replace: true });
          }}>🚪 Logout</button>
        </div>
      </div>
    </div>
  );
}
