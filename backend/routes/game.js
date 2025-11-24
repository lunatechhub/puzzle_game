import express from "express";
import axios from "axios";
import { pool } from "../db.js";
import { protect } from "./auth.js";

export const router = express.Router();

/* === FETCH QUESTION === */
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

/* === SAVE SCORE === */
router.post("/score", protect, async (req, res) => {
  try {
    const { level = "easy", score = 0 } = req.body;
    const email = req.user.email;

    console.log("💾 Saving score:", score, "for user:", email);

    const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (!userRows.length) return res.status(404).json({ message: "User not found" });

    const userId = userRows[0].id;

    await pool.query(
      `INSERT INTO scores (user_id, level, highscore)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         highscore = GREATEST(highscore, VALUES(highscore)),
         last_played = CURRENT_TIMESTAMP`,
      [userId, level, score]
    );

    console.log("✅ Score saved successfully for:", email);
    res.json({ success: true, message: "Score saved successfully!" });
  } catch (err) {
    console.error("❌ Score save error:", err);
    res.status(500).json({ message: "Server error saving score" });
  }
});

/* === LEADERBOARD (show per level) === */
router.get("/leaderboard", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         u.email, 
         s.level, 
         s.highscore, 
         s.last_played
       FROM users u
       JOIN scores s ON s.user_id = u.id
       ORDER BY u.email ASC, s.level ASC`
    );
    console.log(`🏆 Leaderboard fetched successfully: ${rows.length} entries`);
    res.json({ success: true, leaderboard: rows });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error fetching leaderboard" });
  }
});

/* === USER HIGHSCORES === */
// Add your new endpoint here
