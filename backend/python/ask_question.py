# backend/python/ask_question.py

import sys
import os
import json
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

def main(question):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # Ensure FAISS index exists
    if not os.path.exists("faiss_index/index.faiss"):
        print(json.dumps({"error": "Vector index not found. Please upload a PDF first."}))
        return

    vector_store = FAISS.load_local(
        "faiss_index",
        embeddings=embeddings,
        allow_dangerous_deserialization=True
    )

    llm = ChatOpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        model="mistralai/mistral-7b-instruct",
        temperature=0
    )

    qa = RetrievalQA.from_chain_type(llm=llm, retriever=vector_store.as_retriever())
    result = qa.invoke({"query": question})

    # Return answer as JSON to Node.js
    print(json.dumps({"answer": result["result"]}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        print(json.dumps({"error": "No question provided."}))
