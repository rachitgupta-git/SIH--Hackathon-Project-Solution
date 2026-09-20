from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import re
from collections import Counter
from google import genai

app = FastAPI()

# 🛡️ THE FIREWALL HACK (CORS) - Yeh browser ko block karne se rokega
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⚠️ APNI ASLI SECRET KEY YAHAN DAALO
GEMINI_API_KEY = "AQ.Ab8RN6KMIan9pFAPzw8xU9EYb740VzeJ0vjuvuUmejuqzcBWGg"
client = genai.Client(api_key=GEMINI_API_KEY)

STOPWORDS = {"the", "and", "is", "in", "to", "of", "it", "that", "this", "for", "on", "a", "an", "are", "was"}

@app.get("/")
def read_root():
    return {"status": "success", "message": "Terra Sight Core Online."}

@app.post("/extract-and-analyze/")
async def extract_and_analyze(file: UploadFile = File(...)):
    file_content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
    extracted_text = " ".join([page.extract_text() for page in pdf_reader.pages if page.extract_text()])
    
    if not extracted_text.strip():
        return {"error": "Scanned PDF detected. No text found."}

    words = re.findall(r'\b[a-zA-Z]{4,}\b', extracted_text.lower()) 
    meaningful_words = [word for word in words if word not in STOPWORDS]
    word_counts = Counter(meaningful_words)
    
    return {"filename": file.filename, "word_cloud_data": [{"word": w, "weight": c} for w, c in word_counts.most_common(15)]}

@app.post("/ask-pdf/")
async def ask_pdf(question: str = Form(...), file: UploadFile = File(...)):
    file_content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
    extracted_text = " ".join([page.extract_text() for page in pdf_reader.pages if page.extract_text()])
    
    if not extracted_text.strip():
        return {"error": "Scanned PDF detected. No text found."}

    prompt = f"Based on this document text: {extracted_text[:15000]}\n\nAnswer this question: {question}"
    
    response = client.models.generate_content(
        model='gemini-3.6-flash', 
        contents=prompt
    )
    
    return {"question": question, "answer": response.text}