import { useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/api/auth/register", { email, password });
      setMessage(data?.message || "Registration successful! Please log in.");
      setTimeout(()=>navigate("/login"), 1200);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error: Could not register.");
    }
  };

  return (
    <div className="center">
      <div className="card stack" style={{ maxWidth: "400px" }}>
        <h2 className="title">Register</h2>
        <form onSubmit={handleSubmit} className="stack">
          <input className="input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password (min 6)" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6} />
          <button className="btn" type="submit">Register</button>
        </form>
        {message && <p style={{ color: "#facc15" }}>{message}</p>}
        <Link className="btn ghost" to="/">← Back</Link>
      </div>
    </div>
  );
}
