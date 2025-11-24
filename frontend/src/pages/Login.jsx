import { useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {

  // React Router hook to programmatically navigate between pages
  const navigate = useNavigate();

  // State variables for form inputs
  const [email, setEmail] = useState("");       // Stores user email
  const [password, setPassword] = useState(""); // Stores user password
  const [error, setError] = useState("");       // Stores error messages

  // Handles login form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setError("");       // Reset previous errors

    try {
      // Send POST request to login endpoint
      // Backend will set the authentication cookie automatically
      const { data } = await api.post(
        "/api/auth/login",          // API route
        { email, password },        // Request body
        { withCredentials: true }   // Ensures cookies are included
      );

      // If backend responds with success: false → show error
      if (!data?.success) return setError(data?.message || "Login failed");

      // Store user data in localStorage (NOT token)
      // Identity authentication is handled by HTTP-only cookies
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect user to dashboard
      navigate("/dashboard", { replace: true });

    } catch (err) {
      // Handle server/network errors
      console.error("Login error:", err);
      setError(err?.response?.data?.message || "Server error during login");
    }
  };

  return (
    <div className="center"> {/* Wrapper container */}
      <div className="card stack" style={{ maxWidth: "400px" }}>
        <h2 className="title">Login</h2>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="stack">

          {/* Email Input */}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update email state
            required
          />

          {/* Password Input */}
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Update password state
            required
          />

          {/* Submit Button */}
          <button className="btn" type="submit">
            Login
          </button>

          {/* Display Error Message if exists */}
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
        </form>

        {/* Back Link */}
        <Link className="btn ghost" to="/">
          ← Back
        </Link>
      </div>
    </div>
  );
}
