// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

export const router = express.Router();

// ===== Use cookie-parser =====
router.use(cookieParser());

// ===== Helper Functions =====
const sendError = (res, code, message) =>
  res.status(code).json({ success: false, message });

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ===== Middleware: Protect Routes =====
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log("🧩 Incoming protect() token:", token); // ✅ Debug line

    if (!token) return sendError(res, 401, "No authentication cookie found");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query("SELECT id, email FROM users WHERE id = ?", [
      decoded.id,
    ]);
    if (!rows.length) return sendError(res, 401, "User not found");

    req.user = rows[0];
    console.log("✅ Authenticated user:", req.user.email); // ✅ Debug line
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return sendError(res, 401, "Invalid or expired authentication cookie");
  }
};

// ===== REGISTER =====
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return sendError(res, 400, "Email and password required");

    const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length) return sendError(res, 409, "Email already registered");

    const hash = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (email, password) VALUES (?, ?)", [
      email,
      hash,
    ]);

    res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, "Server error during registration");
  }
});

// ===== LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return sendError(res, 400, "Email and password required");

    const [rows] = await pool.query(
      "SELECT id, email, password FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) return sendError(res, 401, "Invalid email or password");

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Invalid email or password");

    const token = signToken(user);

    // ✅ Set secure cookie (JWT)
    res.cookie("token", token, {
      httpOnly: true, // 🔒 prevents JS access (XSS safe)
      secure: process.env.NODE_ENV === "production", // only HTTPS in prod
      sameSite: "Lax", // avoids CSRF on normal navigation
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ✅ Send response (no need to expose token)
    res.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return sendError(res, 500, "Server error during login");
  }
});

// ===== LOGOUT =====
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// ===== GET CURRENT USER =====
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});
