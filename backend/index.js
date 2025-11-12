import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { router as gameRoutes } from "./routes/game.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/game", gameRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
