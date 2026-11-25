import "dotenv/config";
import cors from "cors";
import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase } from "./config/db.js";
import apiRoutes from "./routes/api.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  req.body ||= {};
  next();
});
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "QueueCare API" }));
if (process.env.NODE_ENV === "production") {
  const here = dirname(fileURLToPath(import.meta.url));
  app.use(express.static(resolve(here, "../dist")));
}
app.use("/api", apiRoutes);
if (process.env.NODE_ENV === "production") {
  const here = dirname(fileURLToPath(import.meta.url));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return res.sendFile(resolve(here, "../dist/index.html"));
  });
}
app.use(notFound);
app.use(errorHandler);

await connectDatabase();

app.listen(port, () => console.log(`QueueCare API listening on http://localhost:${port}`));
