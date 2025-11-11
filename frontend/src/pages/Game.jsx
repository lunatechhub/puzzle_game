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

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/game/question");
      setQuestion(data);
      setAnswer("");
      setMessage("");
      setStatus("");
      setShowCorrect("");
    } catch (err) {
      console.error("Fetch question error:", err);
      setMessage("Failed to load question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }
    fetchQuestion();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question) return;

    const correct = String(answer).trim() === String(question.solution).trim();

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const base = level === "hard" ? 20 : level === "medium" ? 15 : 10;
      const bonus = newStreak % 3 === 0 ? 5 : 0;
      const points = base + bonus;
      setScore((s) => s + points);
      setStatus("correct");
      setMessage(`✅ Correct! +${points} points!`);
    } else {
      setStatus("wrong");
      setMessage("❌ Wrong!");
      setShowCorrect(`✅ Correct answer: ${question.solution}`);
      setStreak(0);
    }

    try {
      await api.post("/api/game/score", {
        level,
        score: correct ? score : 0
      });
    } catch (err) {
      console.error("Save score error:", err);
    }

    setTimeout(fetchQuestion, 2000);
  };

  return (
    <div className="center">
      <div className="card stack fade-in" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="title">🍌 Banana Puzzle Game ({level})</h2>
          <Link className="btn ghost" to="/dashboard">← Back</Link>
        </div>

        {loading && <p>Loading question...</p>}

        {!loading && question && (
          <>
            <img src={question.question} alt="Banana Question" className="game-img" style={{ width:"100%", borderRadius:"0.75rem", border:"1px solid #1f2937" }} />

            <form onSubmit={handleSubmit} className="stack">
              <input
                className={`input answer-box ${status}`}
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e)=>setAnswer(e.target.value)}
                disabled={!!status}
                required
              />
              <button type="submit" className="btn" disabled={!!status}>Submit Answer</button>
            </form>

            {message && <p className={`message ${status}`} style={{ fontWeight:600 }}>{message}</p>}
            {showCorrect && <p className="correct-box">{showCorrect}</p>}

            <p style={{ marginTop:"1rem", color:"#facc15" }}>🔥 Streak: {streak}</p>
            <p style={{ color:"#e5e7eb" }}>🏅 Score: {score}</p>
          </>
        )}

        {!loading && !question && <p style={{ color:"#f87171" }}>Could not load question.</p>}
      </div>
    </div>
  );
}
