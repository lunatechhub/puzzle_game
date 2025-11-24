import { useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";


export default function Register() {
  const navigate = useNavigate();

  // State to store the email input value
  const [email, setEmail] = useState("");

  // State to store the password input value
  const [password, setPassword] = useState("");

  // State to store feedback message (success or error)
  const [message, setMessage] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();      // Prevents page reload when form is submitted
    setMessage("");          // Clear any previous message

    try {
      // Send POST request to the backend /register endpoint with email & password
      const { data } = await api.post("/api/auth/register", {
        email,
        password,
      });

      // Show success message from backend, or fallback text
      setMessage(data?.message || "Registration successful! Please log in.");

      // After 1.2 seconds, navigate to the /login page
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      // If there's an error (e.g., email already exists), show error message
      setMessage(
        err?.response?.data?.message || "Error: Could not register."
      );
    }
  };


  return (
    <div className="center">
      {/* Card container with stack layout and max width */}
      <div className="card stack" style={{ maxWidth: "400px" }}>
        {/* Title of the form */}
        <h2 className="title">Register</h2>

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="stack">
          {/* Email input field */}
          <input
            className="input"
            placeholder="Email"
            value={email}                       
            onChange={(e) => setEmail(e.target.value)} 
            required                            
          />

          {/* Password input field */}
          <input
            className="input"
            type="password"
            placeholder="Password (min 6)"
            value={password}                    
            onChange={(e) => setPassword(e.target.value)} 
            required                            
            minLength={6}                       
          />

          {/* Submit button */}
          <button className="btn" type="submit">
            Register
          </button>
        </form>

        {/* Feedback message: shows only if message is not empty */}
        {message && <p style={{ color: "#facc15" }}>{message}</p>}

        {/* Back button to go to home ("/") */}
        <Link className="btn ghost" to="/">
          ← Back
        </Link>
      </div>
    </div>
  );
}
