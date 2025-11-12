// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

export const router = express.Router();

const sendError = (res, code, message) =>
  res.status(code).json({ success: false, message });

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer "))
      return sendError(res, 401, "No token provided");

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query("SELECT id, email FROM users WHERE id = ?", [
      decoded.id,
    ]);
    if (!rows.length) return sendError(res, 401, "User not found");

    req.user = rows[0];
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return sendError(res, 401, "Invalid token");
  }
};

/* === REGISTER === */
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

    res.json({ success: true, message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, "Server error during registration");
  }
});

/* === LOGIN === */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return sendError(res, 400, "Missing fields");

    const [rows] = await pool.query(
      "SELECT id, email, password FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) return sendError(res, 401, "Invalid credentials");

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Invalid credentials");

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return sendError(res, 500, "Server error during login");
  }
});

/* === ME === */
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});
