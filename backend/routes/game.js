// backend/routes/game.js
import express from "express";
import axios from "axios";
import { pool } from "../db.js";
import { protect } from "./auth.js";

export const router = express.Router();

/* === START NEW GAME === */
router.post("/new", protect, async (req, res) => {
  try {
    const email = req.user.email;
    const { level = "easy" } = req.body;

    // Fetch a fresh Banana question
    const { data } = await axios.get("https://marcconrad.com/uob/banana/api.php");
    if (!data?.question) throw new Error("Invalid Banana API response");

    console.log(`🎮 New game started for ${email} (${level})`);
    res.json({
      message: "New game started",
      question: data.question,
      solution: data.solution, // ⚠️ don't expose in production, used only for testing
      level,
    });
  } catch (err) {
    console.error("New game error:", err);
    res.status(500).json({ message: "Failed to start new game" });
  }
});

/* === FETCH QUESTION DIRECTLY === */
router.get("/question", async (req, res) => {
  try {
    const { data } = await axios.get("https://marcconrad.com/uob/banana/api.php");
    if (!data?.question) throw new Error("Invalid API response");
    res.json(data);
  } catch (err) {
    console.error("Banana API error:", err.message);
    res.status(500).json({ message: "Failed to fetch Banana question" });
  }
});

/* === SAVE SCORE (PROTECTED) === */
router.post("/score", protect, async (req, res) => {
  try {
    const { level = "easy", score = 0 } = req.body;
    const email = req.user.email;

    const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (!userRows.length) return res.status(404).json({ message: "User not found" });

    const userId = userRows[0].id;

    // Upsert logic
    await pool.query(
      `INSERT INTO scores (user_id, level, highscore)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         highscore = GREATEST(highscore, VALUES(highscore)),
         last_played = CURRENT_TIMESTAMP`,
      [userId, level, score]
    );

    res.json({ success: true, message: "Score saved successfully!" });
  } catch (err) {
    console.error("Score save error:", err);
    res.status(500).json({ message: "Server error saving score" });
  }
});

/* === LEADERBOARD === */
router.get("/leaderboard", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.email, 
        COALESCE(SUM(s.highscore), 0) AS total_score,
        MAX(s.last_played) AS last_played
      FROM users u
      LEFT JOIN scores s ON s.user_id = u.id
      GROUP BY u.id
      ORDER BY total_score DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      leaderboard: rows,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});
