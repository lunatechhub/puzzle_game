// backend/index.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { router as authRoutes } from "./routes/auth.js";
import { router as gameRoutes } from "./routes/game.js";

dotenv.config();

const app = express();

// ✅ CORS — must be declared BEFORE any routes or cookie usage
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend origin
    credentials: true, // Allow cookies and auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // optional, but safer
  })
);

// ✅ Parse incoming JSON and cookies
app.use(express.json());
app.use(cookieParser());

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

// ✅ Default route for testing
app.get("/", (req, res) => {
  res.send("🚀 Banana App Backend Running");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
