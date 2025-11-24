// Import required packages
import express from "express";           // Web framework
import bcrypt from "bcrypt";             // Password hashing
import jwt from "jsonwebtoken";          // Creates/validates tokens (virtual identity)
import { pool } from "../db.js";         // MySQL connection
import dotenv from "dotenv";             // Loads .env variables
import cookieParser from "cookie-parser"; // Reads cookies from requests

dotenv.config(); // Load environment variables

export const router = express.Router(); // Create a new Express router

// ===== Use cookie-parser =====
router.use(cookieParser()); // Allows us to access req.cookies

// ===== Helper Functions =====

// Helper to send consistent error responses
const sendError = (res, code, message) =>
  res.status(code).json({ success: false, message });

// Helper to create JWT token (virtual identity)
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },  // Payload stored inside the virtual identity
    process.env.JWT_SECRET,              // Secret key for signing
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } // Token lifetime
  );

// ===== Middleware: Protect Routes =====
// Checks that user has a valid virtual identity (token)
export const protect = async (req, res, next) => {
  try {
    // Get cookie named "token"
    const token = req.cookies.token;
    console.log("🧩 Incoming protect() token:", token); // Debug

    // If no token, user is not logged in
    if (!token) return sendError(res, 401, "No authentication cookie found");

    // Verify the virtual identity (JWT token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the DB
    const [rows] = await pool.query(
      "SELECT id, email FROM users WHERE id = ?",
      [decoded.id]
    );

    // User no longer exists?
    if (!rows.length) return sendError(res, 401, "User not found");

    // Attach user info to request object
    req.user = rows[0];
    console.log("✅ Authenticated user:", req.user.email); // Debug

    next(); // Allow request to continue
  } catch (err) {
    console.error("Auth error:", err.message);
    return sendError(res, 401, "Invalid or expired authentication cookie");
  }
};

// ===== REGISTER =====
// Create new user account
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {}; // Extract email/password

    if (!email || !password)
      return sendError(res, 400, "Email and password required");

    // Check if email already exists
    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (exists.length) return sendError(res, 409, "Email already registered");

    // Hash password for security
    const hash = await bcrypt.hash(password, 10);

    // Save user in database
    await pool.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hash]
    );

    res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, "Server error during registration");
  }
});

// ===== LOGIN =====
// Authenticate user & create virtual identity (JWT token)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return sendError(res, 400, "Email and password required");

    // Look for user in DB
    const [rows] = await pool.query(
      "SELECT id, email, password FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) return sendError(res, 401, "Invalid email or password");

    const user = rows[0];

    // Compare password with stored hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Invalid email or password");

    // Create virtual identity (JWT)
    const token = signToken(user);

    // Store the virtual identity inside a secure cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevent JS access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "Lax", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie valid for 7 days
    });

    // Send success response
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
// Remove the virtual identity token
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// ===== GET CURRENT USER =====
// Returns logged-in user's info using virtual identity
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});
