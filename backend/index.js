import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as authRoutes } from "./routes/auth.js";
import { router as gameRoutes } from "./routes/game.js";

dotenv.config();
const app = express();

// CORS + JSON
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Health & root
app.get("/", (_req, res) => res.send("🍌 Banana Game Backend Running"));
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: Date.now() })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

// Global error handler (safety)
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
