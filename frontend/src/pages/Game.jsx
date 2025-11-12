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
  const [showCorrect, setShowCorrect] = useState("");

  /** ✅ Fetch new Banana puzzle */
  const fetchQuestion = async (silent = false) => {
    try {
      if (!silent) setLoading(true); // only show loader on first load

      const { data } = await api.get("/api/game/question");
      setQuestion(data);
      setAnswer("");
      if (!silent) {
        setMessage("");
        setStatus("");
        setShowCorrect("");
      }
    } catch (err) {
      console.error("Fetch question error:", err);
      setMessage("⚠️ Failed to load question. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /** ✅ Load question when component mounts */
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }
    fetchQuestion(); // first load with loader
  }, [navigate]);

  /** ✅ Handle user answer */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const email = storedUser?.email;

    const correct = String(answer).trim() === String(question.solution).trim();

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);

      const base = level === "hard" ? 20 : level === "medium" ? 15 : 10;
      const bonus = newStreak % 3 === 0 ? 5 : 0;
      const points = base + bonus;

      const newScore = score + points;
      setScore(newScore);
      setStatus("correct");
      setMessage(`✅ Correct! +${points} points!`);

      try {
        await api.post("/api/game/score", { email, score: newScore });
        console.log("✅ Score saved:", email, newScore);
      } catch (err) {
        console.error("Save score error:", err);
      }
    } else {
      setStatus("wrong");
      setMessage("❌ Wrong!");
      setShowCorrect(`✅ Correct answer: ${question.solution}`);
      setStreak(0);
    }

    // ✅ Smooth re-fetch (no flicker)
    setTimeout(() => {
      fetchQuestion(true);
      setStatus("");
      setMessage("");
      setShowCorrect("");
    }, 2000);
  };

  return (
    <div className="center">
      <div
        className="card stack fade-in"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="title">🍌 Banana Puzzle Game ({level})</h2>
          <Link className="btn ghost" to="/dashboard">
            ← Back
          </Link>
        </div>

        {/* Loader */}
        {loading && <p>Loading question...</p>}

        {/* Game Content */}
        {!loading && question && (
          <>
            <img
              src={question.question}
              alt="Banana Puzzle"
              style={{
                width: "100%",
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
              }}
            />

            {/* 🧠 Debug Helper (show correct answer while testing) */}
            <p style={{ color: "#facc15", marginTop: "0.5rem" }}>
              🔍 Correct answer (for testing):{" "}
              <strong>{question.solution}</strong>
            </p>

            <form onSubmit={handleSubmit} className="stack">
              <input
                className={`input answer-box ${status}`}
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!!status}
                required
              />
              <button type="submit" className="btn" disabled={!!status}>
                Submit Answer
              </button>
            </form>

            {message && (
              <p className={`message ${status}`} style={{ fontWeight: 600 }}>
                {message}
              </p>
            )}
            {showCorrect && (
              <p className="correct-box" style={{ color: "#10b981" }}>
                {showCorrect}
              </p>
            )}

            <p style={{ marginTop: "1rem", color: "#facc15" }}>
              🔥 Streak: {streak}
            </p>
            <p style={{ color: "#e5e7eb" }}>🏅 Score: {score}</p>
          </>
        )}
      </div>
    </div>
  );
}
