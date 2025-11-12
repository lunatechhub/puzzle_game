// frontend/src/pages/Game.jsx
import { useEffect, useState } from "react";
import api from "../lib/api";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const level = params.get("level") || "easy";

  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [nextLoading, setNextLoading] = useState(false);

  // === Fetch a question ===
  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/game/question");
      setQuestion(data);
      setAnswer("");
      setMessage("");
      setStatus("");
    } catch (err) {
      console.error("Fetch question error:", err);
      setMessage("⚠️ Failed to load question. Please try again.");
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  // === Load on mount ===
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }
    fetchQuestion();
  }, [navigate]);

  // === Handle submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question) return;

    const correct = String(answer).trim() === String(question.solution).trim();
    let newScore = score;

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);

      const base = level === "hard" ? 20 : level === "medium" ? 15 : 10;
      const bonus = newStreak % 3 === 0 ? 5 : 0;
      const points = base + bonus;
      newScore = score + points;

      setScore(newScore);
      setStatus("correct");
      setMessage(`✅ Correct! +${points} points!`);
    } else {
      setStatus("wrong");
      setMessage("❌ Wrong!");
      setStreak(0);
    }

    try {
      // ✅ FIXED: send the updated score to backend
      await api.post("/api/game/score", {
        level,
        score: newScore,
      });
    } catch (err) {
      console.error("Save score error:", err);
    }

    // Wait ~10 seconds before new question
    setNextLoading(true);
    setTimeout(() => {
      fetchQuestion();
      setStatus("");
      setMessage("");
      setNextLoading(false);
    }, 10000);
  };

  return (
    <div className="center">
      <div
        className="card stack fade-in"
        style={{ maxWidth: "600px", width: "100%", position: "relative" }}
      >
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="title">🍌 Banana Puzzle Game ({level})</h2>
          <Link className="btn ghost" to="/dashboard">
            ← Back
          </Link>
        </div>

        {loading ? (
          <p>Loading question...</p>
        ) : question ? (
          <>
            <img
              src={question.question}
              alt="Banana Question"
              className="game-img"
              style={{
                width: "100%",
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
              }}
            />

            {/* ✅ Always show correct answer beside the puzzle */}
            <p
              style={{
                marginTop: "0.75rem",
                color: "#10b981",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              🎯 Correct answer: {question.solution}
            </p>

            <form onSubmit={handleSubmit} className="stack">
              <input
                className={`input answer-box ${status}`}
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
              />
              <button type="submit" className="btn" disabled={!!status}>
                Submit Answer
              </button>
            </form>

            {message && (
              <p
                className={`message ${status}`}
                style={{ fontWeight: 600, textAlign: "center" }}
              >
                {message}
              </p>
            )}

            <p style={{ marginTop: "1rem", color: "#facc15" }}>
              🔥 Streak: {streak}
            </p>
            <p style={{ color: "#e5e7eb" }}>🏅 Score: {score}</p>

            {nextLoading && (
              <p style={{ color: "#9ca3af", marginTop: "1rem" }}>
                🔄 Loading next question...
              </p>
            )}
          </>
        ) : (
          <p style={{ color: "#f87171" }}>
            ⚠️ Could not load question. Try refreshing.
          </p>
        )}
      </div>
    </div>
  );
}
