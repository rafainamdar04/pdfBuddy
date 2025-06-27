const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs/promises");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS: allow your deployed frontend(s) only
const allowedOrigins = [
  "https://pdf-buddy.vercel.app",
  "https://pdf-buddy-c07qwtmuw-rafainamdar04s-projects.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS: ", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// 📁 Upload middleware
const upload = multer({ dest: "uploads/" });

// -------------------------
// 📤 Route: Upload PDF
// -------------------------
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const filePath = path.join(__dirname, req.file.path);

  const python = spawn("python3", [
    path.join(__dirname, "python", "process_pdf.py"),
    filePath
  ]);

  let result = "";
  let error = "";

  python.stdout.on("data", (data) => {
    result += data.toString("utf-8");
  });

  python.stderr.on("data", (data) => {
    error += data.toString("utf-8");
    console.error(`stderr: ${data}`);
  });

  python.on("close", async () => {
    try {
      await fs.unlink(filePath); // cleanup

      if (error) {
        return res.status(500).json({ error: "PDF processing failed." });
      }

      const json = JSON.parse(result.trim());
      return res.json({ summary: json.summary });
    } catch (e) {
      return res.status(500).json({ error: "Error parsing summary or deleting file." });
    }
  });
});

// -------------------------
// ❓ Route: Ask a Question
// -------------------------
app.post("/api/ask", (req, res) => {
  const { question } = req.body;

  const python = spawn("python3", [
    path.join(__dirname, "python", "ask_question.py"),
    question
  ]);

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
    try {
      if (error) {
        return res.status(500).json({ error: "Question answering failed." });
      }

      const json = JSON.parse(result.trim());
      return res.json(json);
    } catch (e) {
      res.status(500).json({ error: "Failed to parse answer." });
    }
  });
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
