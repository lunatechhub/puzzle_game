import express from "express";
import axios from "axios";
import { pool } from "../db.js";

export const router = express.Router();

/**
 * === Helper: Fetch a Banana puzzle (solution between 1–9) ===
 * Uses Marc Conrad's Banana API and ensures the puzzle is valid.
 */
async function fetchBananaPuzzle1to9(attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const { data } = await axios.get("https://marcconrad.com/uob/banana/api.php");

    const sol = Number(String(data?.solution ?? "").trim());

    if (Number.isFinite(sol) && sol >= 1 && sol <= 9 && data?.question) {
      return {
        question: data.question, // puzzle image URL
        solution: sol,           // numeric answer
      };
    }
  }
  throw new Error("Could not fetch valid Banana puzzle (1–9 range)");
}

/* === ROUTE: Get a Banana puzzle === */
router.get("/question", async (_req, res) => {
  try {
    const puzzle = await fetchBananaPuzzle1to9();
    res.json(puzzle); // ✅ frontend expects { question, solution }
  } catch (err) {
    console.error("❌ Banana API error:", err.message);
    res.status(500).json({ message: "Failed to fetch Banana question" });
  }
});

/* === ROUTE: Save or update player score === */
router.post("/score", async (req, res) => {
  const { email, score } = req.body;

  // ✅ Validate inputs
  if (!email || score === undefined) {
    return res.status(400).json({ error: "Missing email or score" });
  }

  try {
    // ✅ Insert or update score
    await pool.query(
      `
      INSERT INTO players (email, highscore)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE 
        highscore = GREATEST(highscore, VALUES(highscore))
      `,
      [email, score]
    );

    console.log(`✅ Score saved for ${email}: ${score}`);
    res.json({ success: true, message: "Score saved successfully!" });
  } catch (err) {
    console.error("❌ Score update error:", err);
    res.status(500).json({ error: "Database error saving score" });
  }
});

/* === ROUTE: Get leaderboard === */
router.get("/leaderboard", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT email, highscore 
      FROM players 
      ORDER BY highscore DESC 
      LIMIT 20
      `
    );

    res.json(rows); // ✅ frontend expects an array of players
  } catch (err) {
    console.error("❌ Leaderboard fetch error:", err);
    res.status(500).json({ error: "Database error fetching leaderboard" });
  }
});
