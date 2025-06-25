const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Upload middleware
const upload = multer({ dest: "uploads/" });

// -----------------------------
// 📤 Route: Upload PDF
// -----------------------------
app.post("/api/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const filePath = path.join(__dirname, req.file.path);
  const python = spawn("python", ["python/process_pdf.py", filePath]);

  let result = "";
  let error = "";

  python.stdout.on("data", (data) => {
    result += data.toString("utf-8");
  });

  python.stderr.on("data", (data) => {
    error += data.toString("utf-8");
    console.error(`stderr: ${data}`);
  });

  python.on("close", () => {
    fs.unlink(filePath, () => {}); // Delete uploaded file

    if (error) {
      return res.status(500).json({ error: "PDF processing failed." });
    }

    try {
      const json = JSON.parse(result.trim());
      return res.json({ summary: json.summary });
    } catch (e) {
      return res.status(500).json({ error: "Error parsing summary." });
    }
  });
});

// -----------------------------
// ❓ Route: Ask a Question
// -----------------------------
app.post("/api/ask", (req, res) => {
  const question = req.body.question;
  if (!question) return res.status(400).json({ error: "No question provided." });

  const python = spawn("python", ["python/ask_question.py", question]);

  let result = "";
  let error = "";

  python.stdout.on("data", (data) => {
    result += data.toString("utf-8");
  });

  python.stderr.on("data", (data) => {
    error += data.toString("utf-8");
    console.error(`stderr: ${data}`);
  });

  python.on("close", () => {
    if (error) {
      return res.status(500).json({ error: "Question answering failed." });
    }

    return res.json({ answer: result.trim() });
  });
});

// -----------------------------
// 🚀 Start Server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
