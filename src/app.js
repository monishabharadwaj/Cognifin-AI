require("./config/env");

const express = require("express");
const cors = require("cors");
const authRoutes = require("./auth/authRoutes");
const verifyToken = require("./middleware/jwtMiddleware");
const errorHandler = require("./middleware/errorMiddleware");
const transactionRoutes = require("./finance/transactions/transactionRoutes");
const analyticsRoutes = require("./analytics/analyticsRoutes");
const aiRoutes = require("./ai/aiRoutes");
const budgetRoutes = require("./finance/budgets/budgetRoutes");

const app = express();

// ─── Allowed Origins ──────────────────────────────────────────────────────────
const env = require("./config/env");

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...String(env.FRONTEND_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

// ─── CORS Configuration ───────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (env.CORS_ALLOW_ALL || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
};

// Apply CORS globally — must be BEFORE routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly for all routes
app.options("*", cors(corsOptions));

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Security / Diagnostic Headers ───────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/ai", aiRoutes);

// ─── Protected Test Route ─────────────────────────────────────────────────────
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler (always last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
