// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";        // ✅ You missed this import
import Leaderboard from "./pages/Leaderboard"; // ✅ optional if you have leaderboard.jsx

// ✅ Route guard — blocks access if not logged in
function Protected({ children }) {
  const raw = localStorage.getItem("user");
  let user = null;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected (login required) */}
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        <Route
          path="/game"
          element={
            <Protected>
              <Game />
            </Protected>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <Protected>
              <Leaderboard />
            </Protected>
          }
        />

        {/* Catch all (unknown routes redirect to home) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
