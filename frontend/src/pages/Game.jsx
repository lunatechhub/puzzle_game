// frontend/src/pages/Game.jsx
import { useEffect, useState } from "react";
import api from "../lib/api";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Generate 4 shuffled numeric options
function generateOptions(correct) {
  const c = parseInt(correct);
  const opts = new Set([c]);

  while (opts.size < 4) {
    const wrong = c + Math.floor(Math.random() * 10) - 5; 
    if (wrong > 0 && wrong !== c) opts.add(wrong);
  }

  return Array.from(opts).sort(() => Math.random() - 0.5);
}

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const level = params.get("level") || "easy";
  const user = JSON.parse(localStorage.getItem("bananaUser"));

  // Game State
  const [questionData, setQuestionData] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load Puzzle
  const loadQuestion = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    setSelected(null);
    setRevealed(false);

    try {
      const res = await api.get("/api/game/question");
      const data = res.data;
      setQuestionData(data);
      setOptions(generateOptions(data.solution));
    } catch (err) {
      console.error(err);
      setError("Failed to load puzzle.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [level]);

  // When user selects an option
  const handleOptionClick = async (val) => {
    if (!questionData || revealed) return;

    const solution = parseInt(questionData.solution);
    const isCorrect = val === solution;

    setSelected(val);
    setRevealed(true);

    let newScore = score;
    let newStreak = streak;

    if (isCorrect) {
      newScore += 10;
      newStreak += 1;
      setMessage("✅ Correct!");
    } else {
      newStreak = 0;
      setMessage(`❌ Wrong — correct answer was ${solution}`);
    }

    setScore(newScore);
    setStreak(newStreak);

    try {
      await api.post(
        "/api/game/score",
        { level, score: newScore },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );
    } catch (err) {
      console.error("Score save error:", err);
    }
  };

  return (
    <div className="center">
      <div className="card stack fade-in" style={{ maxWidth: "720px", width: "100%" }}>
        {/* Header */}
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="title">🍌 Banana Puzzle ({level})</h2>
          <Link className="btn ghost" to="/dashboard">← Back</Link>
        </div>

        {/* Score Display */}
        <div className="row meta-row">
          <span>Score: <strong>{score}</strong></span>
          <span>Streak: <strong>{streak}</strong></span>
        </div>

        {error && <p style={{ color: "#f87171" }}>⚠ {error}</p>}

        {/* Puzzle */}
        {questionData && !error && (
          <>
            <div className="banana-image-wrap">
              <img src={questionData.question} alt="Banana Puzzle" className="banana-image" />
            </div>

            {/* Answer Boxes */}
            <div className="answer-grid">
              {options.map((opt, idx) => {
                const solution = parseInt(questionData.solution);
                const isCorrect = revealed && opt === solution;
                const isWrong = revealed && selected === opt && opt !== solution;

                let cls = "answer-box";
                if (isCorrect) cls += " answer-correct";
                if (isWrong) cls += " answer-wrong";

                return (
                  <div
                    key={idx}
                    className={cls}
                    onClick={() => !revealed && handleOptionClick(opt)}
                    style={{ cursor: revealed ? "default" : "pointer" }}
                  >
                    <span className="answer-text">{opt}</span>
                  </div>
                );
              })}
            </div>

            {/* Feedback */}
            {message && (
              <p className={`message ${message.includes("Correct") ? "correct" : "wrong"}`}>
                {message}
              </p>
            )}

            {/* Centered Buttons */}
            <div className="button-center">
              <button className="btn ghost" onClick={loadQuestion}>🔄 Next Puzzle</button>
              <button className="btn danger" onClick={() => navigate("/dashboard")}>
                ⏹ End Game
              </button>
            </div>
          </>
        )}

        {!questionData && !loading && !error && <p>No puzzle loaded yet.</p>}
        {loading && <p style={{ color: "#ccc" }}>Loading…</p>}
      </div>
    </div>
  );
}
