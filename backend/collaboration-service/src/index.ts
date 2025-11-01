import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sessionsRouter from "./routes/sessions.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// app.use(express.json({ limit: '512kb' }));
// test deployment
app.use("/sessions", sessionsRouter);

const port = process.env.COLLAB_SERVICE_PORT || 6004;

app.listen(port, () => {
  console.log(`Collaboration Service running on port ${port}`);
});
