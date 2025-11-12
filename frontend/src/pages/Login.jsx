import { useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // ✅ Send login request — backend will set cookie automatically
      const { data } = await api.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true } // ensure cookie is stored
      );

      if (!data?.success) return setError(data?.message || "Login failed");

      // ✅ No need to manually save token anymore
      // Cookies are managed by browser automatically
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.response?.data?.message || "Server error during login");
    }
  };

  return (
    <div className="center">
      <div className="card stack" style={{ maxWidth: "400px" }}>
        <h2 className="title">Login</h2>

        <form onSubmit={handleSubmit} className="stack">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn" type="submit">
            Login
          </button>

          {error && <p style={{ color: "#f87171" }}>{error}</p>}
        </form>

        <Link className="btn ghost" to="/">
          ← Back
        </Link>
      </div>
    </div>
  );
}
