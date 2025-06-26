const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs/promises");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS: allow your deployed frontend only
app.use(cors({ origin: "https://pdf-buddy-c07qwtmuw-rafainamdar04s-projects.vercel.app" }));
app.use(express.json());

// 📁 Upload middleware
const upload = multer({ dest: "uploads/" });

// 📤 Route: Upload PDF
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const filePath = path.join(__dirname, req.file.path);
  const python = spawn("python3", [path.join(__dirname, "python", "process_pdf.py"), filePath]);

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
      await fs.unlink(filePath); // Delete uploaded file after processing

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

// ❓ Route: Ask a Question
app.post("/api/ask", async (req, res) => {
  const question = req.body.question;

  const python = spawn("python3", [path.join(__dirname, "python", "ask_question.py"), question]);

  let result = "";
  let error = "";

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.stderr.on("data", (data) => {
    error += data.toString();
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
      res.status(500).send("Failed to parse answer.");
    }
  });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
