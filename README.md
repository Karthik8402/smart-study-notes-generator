# 📚 Smart Study Notes Generator & Organizer

An AI-powered study notes generator that uses **RAG (Retrieval-Augmented Generation)** and **MCP (Model Context Protocol)** to help students organize and learn from their study materials.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- 📄 **Multi-format Upload** - Support for PDF, PPT/PPTX, images (OCR), and YouTube transcripts
- 🧠 **AI-Powered RAG** - Intelligent question-answering based on your uploaded content
- 📝 **Auto-generated Notes** - Create summaries, topic-wise notes, MCQs, and concept explanations
- 💬 **Chat with AI** - Ask questions and get personalized answers from your study materials
- 🔧 **MCP Tool Integration** - Integration with Drive, Calendar, and local file system
- 🌙 **Dark Mode** - Beautiful UI with light/dark theme support
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | FastAPI (Python 3.10+) |
| **User Database** | MongoDB Atlas |
| **Vector Database** | ChromaDB |
| **Embeddings** | Sentence Transformers (all-MiniLM-L6-v2) |
| **LLM** | OpenAI GPT-3.5/4 |
| **File Processing** | pypdf, python-pptx, pytesseract, youtube-transcript-api |

## 📁 Project Structure

```
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── config.py          # Configuration settings
│   │   ├── database/          # MongoDB & ChromaDB connections
│   │   ├── routers/           # API endpoints
│   │   │   ├── auth.py        # Authentication
│   │   │   ├── upload.py      # File uploads
│   │   │   ├── chat.py        # RAG-powered chat
│   │   │   └── notes.py       # AI note generation
│   │   ├── services/          # Business logic
│   │   │   ├── extraction.py  # File text extraction
│   │   │   ├── rag_engine.py  # RAG pipeline
│   │   │   ├── llm_service.py # OpenAI integration
│   │   │   └── note_generator.py
│   │   └── mcp/               # MCP tool implementations
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                   # React frontend
    ├── src/
    │   ├── components/        # Reusable UI components
    │   ├── pages/             # Page components
    │   ├── context/           # React context providers
    │   └── services/          # API client
    ├── package.json
    └── tailwind.config.js
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier works)
- OpenAI API key
- Tesseract OCR (for image text extraction)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Start the server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Start development server
npm run dev
```

## ⚙️ Environment Variables

### Backend (.env)

```env
# MongoDB Atlas
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smart_study_notes
DATABASE_NAME=smart_study_notes

# JWT Authentication
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# ChromaDB
CHROMA_PERSIST_DIRECTORY=./chroma_db

# File Upload
UPLOAD_DIRECTORY=./uploads
MAX_UPLOAD_SIZE_MB=50

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Embedding Model
EMBEDDING_MODEL=all-MiniLM-L6-v2

# RAG Settings
CHUNK_SIZE=800
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## 📖 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/upload/file` | Upload file (PDF/PPT/Image/TXT) |
| `POST` | `/api/upload/youtube` | Extract YouTube transcript |
| `GET` | `/api/upload/documents` | List user documents |
| `POST` | `/api/chat/` | Send chat message (RAG) |
| `GET` | `/api/chat/sessions` | Get chat sessions |
| `POST` | `/api/notes/generate` | Generate AI notes |
| `GET` | `/api/notes/` | Get saved notes |

## 🎯 Usage

1. **Register/Login** - Create an account or sign in
2. **Upload Materials** - Upload your PDFs, PPTs, images, or YouTube links
3. **Chat with AI** - Ask questions about your study materials
4. **Generate Notes** - Create summaries, topic notes, MCQs, or explanations
5. **Save & Review** - Save generated notes for later review

## 📸 Screenshots

*Coming soon*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Karthi Kumar**

- Final Year Project
- College: *Your College Name*

---

⭐ If you find this project helpful, please give it a star!
