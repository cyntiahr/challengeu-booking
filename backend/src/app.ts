
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import availabilityRoutes from "./modules/scheduling/availability.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.use("/availability", availabilityRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
