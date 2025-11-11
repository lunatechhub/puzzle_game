import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="center">
      <div className="card stack" style={{ maxWidth: "400px" }}>
        <h1 className="title">🍌 Welcome to Banana Game</h1>
        <p>Test your logic skills with fun Banana puzzles!</p>
        <Link className="btn" to="/login">Login</Link>
        <Link className="btn ghost" to="/register">Register</Link>
      </div>
    </div>
  );
}
