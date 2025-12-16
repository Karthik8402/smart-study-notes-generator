# 📚 Smart Study Notes Generator & Organizer

An AI-powered study notes generator that uses **RAG (Retrieval-Augmented Generation)** and **MCP (Model Context Protocol)** to help students organize, learn from their study materials, and prepare for exams and **Campus Recruitment Training (CRT)**.

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
- 📊 **Interactive Dashboard** - Track your progress, study hours, and recent activity
- 📅 **Smart Study Scheduler** - MCP-powered calendar integration to auto-schedule study sessions

## 🎓 Campus Recruitment Training (CRT)

A dedicated suite of tools designed to help students ace their campus placements:

- 🧠 **Aptitude & Logical Reasoning**
  - Upload practice sheets (PDF/Images) and get instant solutions with explanations.
  - Generate unlimited practice problems based on your weak areas.

- 💻 **Technical Interview Prep**
  - Mock interview simulation for core subjects (OS, DBMS, CN, Java/Python).
  - "Explain code" feature to help you articulate logic clearly.

- 🏢 **Company-Specific Patterns**
  - Analyze uploaded past papers to identify recurring topics.
  - Generate company-specific preparation strategies.

- 🗣️ **HR Round Preparation**
  - Behavioral question simulator with feedback on your answers.
  - Resume screening and optimization tips.

## 🔌 MCP Integration (Model Context Protocol)

Smart Study Notes leverages the **Model Context Protocol** to connect AI with your local tools:

### 📅 Calendar Server
- **Auto-Scheduling**: "Plan a study schedule for DBMS exam starting Monday" -> Automatically blocks entries in your calendar.
- **Conflict Detection**: Checks your existing events before scheduling.
- **Study Reminders**: Smart notifications for upcoming sessions.

### 📂 Filesystem & Drive
- **Direct Access**: Chat with files directly from your computer or Google Drive without manual uploading.
- **Organization**: Auto-organize generated notes into your actual file system folders.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | FastAPI (Python 3.10+) |
| **User Database** | MongoDB Atlas |
| **Vector Database** | ChromaDB |
| **Embeddings** | Sentence Transformers (all-MiniLM-L6-v2) |
| **LLM** | Ollama (Local Models: Llama 3, Mistral) |
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
python -m uvicorn app.main:app --reload --port 8000
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
# Ollama configuration
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3

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


## ☁️ AWS EC2 Deployment

Deploy to AWS EC2 Free Tier (t2.micro with swap file for memory extension).

### Prerequisites
- AWS account with EC2 access
- GitHub repository pushed with your code
- MongoDB Atlas connection string
- Groq API key (free at https://console.groq.com)

### Quick Deploy

1. **Launch EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance: t2.micro (Free tier)
   - Security Group: Allow SSH (22), HTTP (80), HTTPS (443)

2. **Connect to EC2**
   ```bash
   ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
   ```

3. **Run Deployment Script**
   ```bash
   curl -O https://raw.githubusercontent.com/Karthik8402/smart-study-notes-generator/main/deploy_ec2.sh
   chmod +x deploy_ec2.sh
   ./deploy_ec2.sh
   ```

4. **Configure Environment**
   ```bash
   nano /home/ubuntu/smart-study-notes/backend/.env
   # Add your MongoDB URL, GROQ_API_KEY, SECRET_KEY
   pm2 restart all
   ```

5. **Access Your App**
   - Open `http://<EC2-PUBLIC-IP>` in browser
   - Health check: `curl http://<EC2-PUBLIC-IP>/api/health`

### Server Management
```bash
pm2 status          # View running processes
pm2 logs            # View logs
pm2 restart all     # Restart all services
pm2 stop all        # Stop all services
```

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
