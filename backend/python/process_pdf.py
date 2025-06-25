# backend/python/process_pdf.py

import sys
import os
import json
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document

load_dotenv()

def extract_text(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text
    return text

def main(file_path):
    text = extract_text(file_path)

    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(text)
    docs = [Document(page_content=chunk) for chunk in chunks]

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(docs, embeddings)
    vector_store.save_local("faiss_index")

    vector_store = FAISS.load_local("faiss_index", embeddings=embeddings, allow_dangerous_deserialization=True)

    llm = ChatOpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        model="mistralai/mistral-7b-instruct",
        temperature=0
    )

    qa = RetrievalQA.from_chain_type(llm=llm, retriever=vector_store.as_retriever())
    result = qa.invoke({"query": "Give a brief summary of this document in 3–5 sentences."})

    print(json.dumps({"summary": result["result"]}))

if __name__ == "__main__":
    main(sys.argv[1])
