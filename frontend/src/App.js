import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);

  const uploadFile = async () => {
    if (!file) return alert("Please select a PDF file.");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setUploading(true);
      const res = await axios.post("http://localhost:5000/api/upload", formData);
      setSummary(res.data.summary);
      setAnswer("");
    } catch (error) {
      alert("Failed to process PDF.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    try {
      setAsking(true);
      const res = await axios.post("http://localhost:5000/api/ask", { question });
      setAnswer(res.data.answer);
    } catch (error) {
      alert("Failed to get answer.");
      console.error(error);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", fontFamily: "Arial" }}>
      <h1>📄 PDF Chatbot</h1>

      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadFile} disabled={uploading} style={{ marginLeft: "10px" }}>
        {uploading ? "Processing..." : "Upload PDF"}
      </button>

      {summary && (
        <div style={{ marginTop: "30px" }}>
          <h3>📝 Summary:</h3>
          <p>{summary}</p>
        </div>
      )}

      {summary && (
        <div style={{ marginTop: "30px" }}>
          <h3>❓ Ask a Question:</h3>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ width: "80%", padding: "8px" }}
            placeholder="Ask something about the PDF..."
          />
          <button
            onClick={askQuestion}
            disabled={asking || !question.trim()}
            style={{ marginLeft: "10px" }}
          >
            {asking ? "Thinking..." : "Ask"}
          </button>
        </div>
      )}

      {answer && (
        <div style={{ marginTop: "30px" }}>
          <h3>🧠 Answer:</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;
