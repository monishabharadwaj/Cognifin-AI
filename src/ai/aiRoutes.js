const express = require("express");
const router = express.Router();
const axios = require("axios");
const multer = require("multer");
const verifyToken = require("../middleware/jwtMiddleware");
const analyticsService = require("../analytics/analyticsService");
const financialAdvisorService = require("../services/financialAdvisorService");
const financialGoalsModel = require("../models/financialGoals");
const tripPlanningModel = require("../models/tripPlanning");
const transactionModel = require("../models/transactionModel");

const env = require("../config/env");
const ML_SERVICE_URL = env.ML_SERVICE_URL;

// Multer: store uploads in memory (no disk required)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── AI Financial Chatbot ─────────────────────────────────────────────────────
// Accepts { message, transactions? } from frontend.
// Forwards to ML service as { question, transactions } which matches the
// Pydantic ChatRequest model exactly.
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const { message, question, transactions } = req.body;

    // Accept either `message` (old) or `question` (new) field name
    const userQuestion = (question || message || "").trim();

    if (!userQuestion) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Fetch the user's real transactions if none were provided
    let txList = Array.isArray(transactions) ? transactions : [];
    if (txList.length === 0) {
      try {
        const userId = req.user.id;
        const dbTx = await transactionModel.getTransactionsByUser(userId);
        txList = (dbTx || []).map((t) => ({
          amount: parseFloat(t.amount) || 0,
          category: t.category || "other",
          date: t.date || new Date().toISOString().slice(0, 10),
          description: t.description || "",
          type: t.type || "expense",
        }));
      } catch (fetchErr) {
        console.warn(
          "Could not fetch transactions for chat context:",
          fetchErr.message,
        );
      }
    }

    const response = await axios.post(`${ML_SERVICE_URL}/financial_chat`, {
      question: userQuestion,
      transactions: txList,
    });

    res.json(response.data);
  } catch (error) {
    console.error("AI Chatbot Error:", error.response?.data || error.message);
    if (error.response?.status === 422) {
      res.status(422).json({
        error: "AI service rejected the request. Check payload format.",
        detail: error.response.data,
      });
    } else if (error.response?.status === 500) {
      res.status(500).json({
        error: "AI service is currently unavailable. Please try again later.",
      });
    } else {
      res.status(500).json({ error: "Failed to process chat request" });
    }
  }
});

// ─── File Upload & Analysis ───────────────────────────────────────────────────
// POST /api/ai/upload
//
// Strategy:
//   1. Receive the uploaded file (any type) in memory via multer.
//   2. Parse transactions from the file content where possible
//      (CSV / TSV columns, JSON arrays, plain text lines).
//   3. Send extracted transactions to ML /financial_report for insights.
//   4. Optionally save parsed transactions to the user's transaction DB.
//   5. Return { insights, saved_count, raw_text } to the frontend.
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const userId = req.user.id;
    const { originalname, mimetype, buffer, size } = req.file;
    const ext = (originalname.split(".").pop() || "").toLowerCase();

    console.log(
      `[Upload] File: ${originalname} | Type: ${mimetype} | Size: ${size} bytes`,
    );

    // ── 1. Extract raw text from the buffer ──────────────────────────────────
    let rawText = "";
    let parsedTransactions = [];

    const textFormats = ["csv", "tsv", "txt", "json", "xml", "yaml", "yml", "rtf"];
    
    if (textFormats.includes(ext) || mimetype.startsWith("text/")) {
      rawText = buffer.toString("utf-8");
      if (ext === "csv" || ext === "tsv") {
        parsedTransactions = parseCSV(rawText, ext === "tsv" ? "\t" : ",");
      } else if (ext === "json") {
        parsedTransactions = parseJSON(rawText);
      } else if (ext === "txt") {
        parsedTransactions = parsePlainText(rawText);
      }
    } else if (ext === "pdf" || mimetype === "application/pdf") {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text;
        parsedTransactions = parsePlainText(rawText); // Extrapolate numbers as transactions
      } catch (err) {
        rawText = `Failed to parse PDF: ${err.message}`;
      }
    } else if (ext === "xlsx" || ext === "xls" || mimetype.includes("excel") || mimetype.includes("spreadsheetml")) {
      try {
        const xlsx = require('xlsx');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawText = xlsx.utils.sheet_to_csv(worksheet);
        parsedTransactions = parseCSV(rawText, ",");
      } catch (err) {
        rawText = `Failed to parse Excel file: ${err.message}`;
      }
    } else {
      rawText = `File: ${originalname}\nSize: ${size} bytes\nType: ${mimetype}`;
    }

    console.log(`[Upload] Parsed ${parsedTransactions.length} transactions from file`);

    // ── 2. Create Standalone Payload for Document Insights ──────────────────
    // We STRICTLY use only the document's contents. History is ignored.
    const allTransactions = parsedTransactions.map((t) => ({
      amount: t.amount,
      category: t.category || "upload",
      date: t.date || new Date().toISOString().slice(0, 10),
      description: t.description || "",
      type: t.type || "expense",
    }));

    let mlInsights = [];
    let mlAdvice = [];

    try {
      // If we couldn't parse tabular transactions, we send the rawText as a description
      // of a dummy transaction so the ML engine has *something* to read over.
      const mlPayload = allTransactions.length > 0 ? allTransactions : [
        {
          amount: 0,
          category: "document",
          date: new Date().toISOString().slice(0, 10),
          description: rawText.slice(0, 2000), // send first 2000 chars of doc
          type: "expense"
        }
      ];

      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/financial_report`,
        { transactions: mlPayload },
        { timeout: 30000 }
      );

      const mlData = mlResponse.data || {};
      mlInsights = Array.isArray(mlData.insights) ? mlData.insights : [];
      mlAdvice = Array.isArray(mlData.advice) ? mlData.advice : [];
    } catch (mlErr) {
      console.error("[Upload] ML service error:", mlErr.response?.data || mlErr.message);
      mlInsights = ["ML analysis service is currently unavailable. Displaying parsed data only."];
    }

    // ── 3. Build response ────────────────────────────────────────────────────
    const fileInsights = [];

    if (parsedTransactions.length > 0) {
      fileInsights.push(
        `✅ Analyzed ${parsedTransactions.length} transactions straight from "${originalname}".`
      );
    } else {
      fileInsights.push(
        `📄 Read document: "${originalname}". No standard tabular financial data was found, but AI attempted text analysis.`
      );
    }

    const allInsights = [...fileInsights, ...mlInsights, ...mlAdvice];

    return res.json({
      success: true,
      filename: originalname,
      size,
      parsed_count: parsedTransactions.length,
      saved_count: 0,
      insights: allInsights,
      advice: mlAdvice,
      raw_preview: rawText.slice(0, 500), // first 500 chars for debugging
    });
  } catch (error) {
    console.error("[Upload] Error:", error.message);
    res.status(500).json({
      error: "File upload and analysis failed.",
      detail: error.message,
    });
  }
});

// ─── CSV / TSV parser ─────────────────────────────────────────────────────────
function parseCSV(text, delimiter = ",") {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect header row
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  // Map common column name aliases
  const colMap = {
    amount: ["amount", "amt", "value", "debit", "credit", "sum", "price"],
    description: [
      "description",
      "desc",
      "narration",
      "details",
      "particulars",
      "remarks",
      "note",
      "notes",
      "memo",
    ],
    date: [
      "date",
      "txn date",
      "transaction date",
      "value date",
      "posting date",
    ],
    category: ["category", "cat", "type", "tag", "label"],
    type: ["type", "transaction type", "txn type", "dr/cr"],
  };

  const findCol = (aliases) => {
    for (const alias of aliases) {
      const idx = headers.indexOf(alias);
      if (idx !== -1) return idx;
    }
    // fuzzy: partial match
    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const amtIdx = findCol(colMap.amount);
  const descIdx = findCol(colMap.description);
  const dateIdx = findCol(colMap.date);
  const catIdx = findCol(colMap.category);
  const typeIdx = findCol(colMap.type);

  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]
      .split(delimiter)
      .map((c) => c.trim().replace(/^["']|["']$/g, ""));

    const rawAmount = amtIdx >= 0 ? cols[amtIdx] : null;
    if (!rawAmount) continue;

    // Strip currency symbols and parse
    const amount = parseFloat(rawAmount.replace(/[₹$€£,\s]/g, "")) || 0;
    if (amount === 0) continue;

    const description = descIdx >= 0 ? cols[descIdx] : lines[i];
    const rawDate = dateIdx >= 0 ? cols[dateIdx] : "";
    const category = catIdx >= 0 ? cols[catIdx] : "upload";
    const rawType = typeIdx >= 0 ? cols[typeIdx].toLowerCase() : "";

    // Determine income vs expense
    let txType = "expense";
    if (
      rawType.includes("cr") ||
      rawType.includes("credit") ||
      rawType.includes("income")
    ) {
      txType = "income";
    }

    // Parse date
    let date = new Date().toISOString().slice(0, 10);
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().slice(0, 10);
      }
    }

    results.push({ amount, description, date, category, type: txType });
  }

  return results;
}

// ─── JSON parser ──────────────────────────────────────────────────────────────
function parseJSON(text) {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data)
      ? data
      : data.transactions || data.data || [];
    return arr
      .filter(
        (item) =>
          item && typeof item === "object" && (item.amount || item.Amount),
      )
      .map((item) => ({
        amount:
          parseFloat(
            String(item.amount || item.Amount || "0").replace(/[₹$€£,]/g, ""),
          ) || 0,
        description:
          item.description ||
          item.Description ||
          item.narration ||
          item.memo ||
          "",
        date:
          item.date ||
          item.Date ||
          item.txn_date ||
          new Date().toISOString().slice(0, 10),
        category: item.category || item.Category || "upload",
        type: (item.type || item.Type || "expense")
          .toLowerCase()
          .includes("income")
          ? "income"
          : "expense",
      }))
      .filter((t) => t.amount > 0);
  } catch {
    return [];
  }
}

// ─── Plain text parser ────────────────────────────────────────────────────────
// Looks for lines containing currency amounts like ₹1,234 or $500
function parsePlainText(text) {
  const results = [];
  const lines = text.split(/\r?\n/);
  const amountPattern = /[₹$€£]?\s*(\d{1,3}(?:[,\d]*)?(?:\.\d{1,2})?)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(amountPattern);
    if (!match) continue;
    const amount = parseFloat(match[1].replace(/,/g, "")) || 0;
    if (amount < 1) continue;
    results.push({
      amount,
      description: trimmed.replace(match[0], "").trim() || trimmed,
      date: new Date().toISOString().slice(0, 10),
      category: "upload",
      type: "expense",
    });
  }
  return results;
}

// Comprehensive Financial Advice
router.post("/financial-advice", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's financial data
    const summary = await analyticsService.getSummary(userId);
    const categories = await analyticsService.getCategoryBreakdown(userId);
    const monthly = await analyticsService.getMonthlySummary(userId);

    const insights = [];

    // Get comprehensive advice from financial advisor
    const spendingInsights = await financialAdvisorService.analyzeSpending(
      userId,
      summary,
      categories,
    );
    const savingsInsights =
      await financialAdvisorService.provideSavingsGuidance(
        userId,
        summary,
        categories,
      );
    const budgetInsights = await financialAdvisorService.monitorBudgets(
      userId,
      categories,
    );
    const planningInsights =
      await financialAdvisorService.provideFinancialPlanning(
        userId,
        summary,
        categories,
        monthly,
      );

    insights.push(
      ...spendingInsights,
      ...savingsInsights,
      ...budgetInsights,
      ...planningInsights,
    );

    res.json({
      summary,
      categories,
      insights,
      recommendations: insights.filter(
        (insight) =>
          insight.includes("reduce") ||
          insight.includes("increase") ||
          insight.includes("consider") ||
          insight.includes("save"),
      ),
    });
  } catch (error) {
    console.error("Financial Advice Error:", error);
    res.status(500).json({ error: "Failed to generate financial advice" });
  }
});

// Trip Budget Planner
router.post("/trip-planner", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { destination, duration, travelers = 1 } = req.body;

    if (!destination || !duration) {
      return res
        .status(400)
        .json({ error: "Destination and duration are required" });
    }

    // Get user's financial data
    const summary = await analyticsService.getSummary(userId);
    const categories = await analyticsService.getCategoryBreakdown(userId);

    const tripDetails = { destination, duration, travelers };
    const insights = await financialAdvisorService.planTripBudget(
      userId,
      tripDetails,
      summary,
      categories,
    );

    res.json({
      destination,
      duration,
      travelers,
      insights,
      affordable: insights.some((insight) =>
        insight.includes("can safely afford"),
      ),
      estimatedBudget: insights.find((insight) =>
        insight.includes("Recommended budget"),
      ),
    });
  } catch (error) {
    console.error("Trip Planner Error:", error);
    res.status(500).json({ error: "Failed to plan trip budget" });
  }
});

// Financial Goals Management
router.post("/savings-goals", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      targetAmount,
      currentAmount = 0,
      deadline,
      category = "general",
      icon = "🎯",
    } = req.body;

    if (!title || !targetAmount) {
      return res
        .status(400)
        .json({ error: "Title and target amount are required" });
    }

    const goalId = await financialGoalsModel.createGoal(
      userId,
      title,
      targetAmount,
      currentAmount,
      deadline,
      category,
      icon
    );

    res.status(201).json({
      message: "Financial goal created successfully",
      goalId,
      title,
      targetAmount,
      currentAmount,
      deadline,
      category,
    });
  } catch (error) {
    console.error("Create Goal Error:", error);
    res.status(500).json({ error: "Failed to create financial goal" });
  }
});

router.get("/savings-goals", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await financialGoalsModel.getUserGoals(userId);
    const stats = await financialGoalsModel.getGoalStats(userId);
    const nearingDeadline = await financialGoalsModel.getGoalsNearingDeadline(
      userId,
      30,
    );

    res.json({
      goals,
      stats,
      nearingDeadline,
      totalGoals: goals.length,
      completedGoals: stats.completed_goals,
    });
  } catch (error) {
    console.error("Get Goals Error:", error);
    res.status(500).json({ error: "Failed to get financial goals" });
  }
});

router.put("/savings-goals/:goalId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;
    const { currentAmount } = req.body;

    if (!currentAmount) {
      return res.status(400).json({ error: "Current amount is required" });
    }

    const updated = await financialGoalsModel.updateGoalProgress(
      goalId,
      currentAmount,
    );

    if (!updated) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json({ message: "Goal progress updated successfully" });
  } catch (error) {
    console.error("Update Goal Error:", error);
    res.status(500).json({ error: "Failed to update goal progress" });
  }
});

router.delete("/savings-goals/:goalId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;

    const deleted = await financialGoalsModel.deleteGoal(goalId, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete Goal Error:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// Trip Planning Management
router.post("/trip-plans", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      destination,
      startDate,
      endDate,
      travelers,
      estimatedBudget,
      budgetBreakdown,
    } = req.body;

    if (!destination || !startDate || !endDate || !travelers) {
      return res
        .status(400)
        .json({ error: "Destination, dates, and travelers are required" });
    }

    const tripId = await tripPlanningModel.createTripPlan(
      userId,
      destination,
      startDate,
      endDate,
      travelers,
      estimatedBudget,
      budgetBreakdown,
    );

    res.status(201).json({
      message: "Trip plan created successfully",
      tripId,
      destination,
      startDate,
      endDate,
      travelers,
      estimatedBudget,
    });
  } catch (error) {
    console.error("Create Trip Plan Error:", error);
    res.status(500).json({ error: "Failed to create trip plan" });
  }
});

router.get("/trip-plans", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trips = await tripPlanningModel.getUserTripPlans(userId);
    const upcomingTrips = await tripPlanningModel.getUpcomingTrips(userId, 90);
    const stats = await tripPlanningModel.getTripStats(userId);

    res.json({
      trips,
      upcomingTrips,
      stats,
      totalTrips: trips.length,
      upcomingCount: upcomingTrips.length,
    });
  } catch (error) {
    console.error("Get Trip Plans Error:", error);
    res.status(500).json({ error: "Failed to get trip plans" });
  }
});

// Budget Optimization Suggestions
router.post("/budget-optimization", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's financial data
    const summary = await analyticsService.getSummary(userId);
    const categories = await analyticsService.getCategoryBreakdown(userId);

    const insights = [];
    const optimizations = [];

    // Analyze spending patterns
    if (categories.expenses) {
      Object.entries(categories.expenses).forEach(([category, amount]) => {
        const percent = ((amount / summary.total_expense) * 100).toFixed(1);

        if (percent > 30) {
          optimizations.push({
            category,
            currentAmount: amount,
            suggestedReduction: amount * 0.2,
            reason: `${category} is ${percent}% of total expenses`,
          });
        }
      });
    }

    // Suggest budget reallocations
    if (summary.balance > 0) {
      const savingsPotential = summary.balance * 0.5;
      optimizations.push({
        category: "savings",
        suggestedIncrease: savingsPotential,
        reason: "Allocate half of current balance to savings",
      });
    }

    res.json({
      insights,
      optimizations,
      totalPotentialSavings: optimizations.reduce(
        (sum, opt) => sum + (opt.suggestedReduction || 0),
        0,
      ),
    });
  } catch (error) {
    console.error("Budget Optimization Error:", error);
    res.status(500).json({ error: "Failed to generate budget optimization" });
  }
});

module.exports = router;
