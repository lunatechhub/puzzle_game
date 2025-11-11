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
      const { data } = await api.post("/api/auth/login", { email, password });
      if (!data?.success) return setError(data?.message || "Login failed");
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Server error during login");
    }
  };

  return (
    <div className="center">
      <div className="card stack" style={{ maxWidth: "400px" }}>
        <h2 className="title">Login</h2>
        <form onSubmit={handleSubmit} className="stack">
          <input className="input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button className="btn" type="submit">Login</button>
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
        </form>
        <Link className="btn ghost" to="/">← Back</Link>
      </div>
    </div>
  );
}
