# backend/python/ask_question.py

import sys
import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

def safe_stderr(text):
    sys.stderr.buffer.write(f"{text}\n".encode("utf-8", errors="replace"))

def main(question):
    safe_stderr(f"DEBUG: Received question -> {question}")

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    if not os.path.exists("faiss_index/index.faiss"):
        safe_stderr("ERROR: FAISS index not found. Run process_pdf.py first.")
        return

    vector_store = FAISS.load_local(
        "faiss_index",
        embeddings=embeddings,
        allow_dangerous_deserialization=True
    )
    safe_stderr("DEBUG: FAISS index loaded")

    llm = ChatOpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        model="mistralai/mistral-7b-instruct",
        temperature=0
    )
    safe_stderr("DEBUG: LLM initialized")

    qa = RetrievalQA.from_chain_type(llm=llm, retriever=vector_store.as_retriever())
    safe_stderr("DEBUG: RetrievalQA chain created")

    result = qa.invoke({"query": question})

    # ✅ Safely print result
    sys.stdout.buffer.write(result["result"].encode("utf-8", errors="replace"))
    sys.stdout.buffer.write(b"\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        safe_stderr("Please provide a question as an argument.")
