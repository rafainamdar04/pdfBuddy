import React, { useState } from "react";
import API from "./api"
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);

    setLoading(true);
    setSummary("");
    setAnswer("");
    try {
      const res = await API.post("/api/upload", formData);
      setSummary(res.data.summary);
    } catch (err) {
      alert("Failed to process PDF.");
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question) return;
    setAnswer("");
    setAnswerLoading(true);
    try {
      const res = await API.post("/api/ask", { question });
      setAnswer(res.data.answer);
    } catch (err) {
      alert("Failed to get answer.");
    }
    setAnswerLoading(false);
  };

  return (
    <div className="container py-5 app-content">
      <div className="text-center animate__animated animate__fadeInDown mb-4">
        <h1 className="app-title">PDF Buddy</h1>
        <p className="app-subtitle">Upload a PDF and ask questions about its content in plain English.</p>
        <input
          type="file"
          accept=".pdf"
          className="form-control w-auto d-inline-block mt-3"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br></br>
        <button className="btn btn-primary mt-3" onClick={uploadFile} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Processing...
            </>
          ) : (
            "Upload PDF"
          )}
        </button>
      </div>

      {summary && (
        <div className="card glass-card p-4 mt-4 animate__animated animate__fadeInUp">
          <h4 className="fw-semibold mb-2">Summary</h4>
          <p className="mb-0">{summary}</p>
        </div>
      )}

      {summary && (
        <div className="card glass-card p-4 mt-4 animate__animated animate__fadeInUp">
          <h4 className="fw-semibold mb-3">Ask a Question</h4>
          <input
            type="text"
            value={question}
            placeholder="Type your question..."
            onChange={(e) => setQuestion(e.target.value)}
            className="form-control mb-3"
          />
          <button className="btn btn-success" onClick={askQuestion} disabled={answerLoading}>
            {answerLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Thinking...
              </>
            ) : (
              "Ask"
            )}
          </button>
        </div>
      )}

      {answer && (
        <div className="card glass-card p-4 mt-4 animate__animated animate__fadeInUp">
          <h4 className="fw-semibold mb-2">Answer</h4>
          <p className="mb-0">{answer}</p>
        </div>
      )}
      <footer className="footer text-center mt-5 py-3">
  <p className="mb-0">Made by <span className="creator-name">Rafa Inamdar</span></p>
</footer>
    </div>
  );
}

export default App;
