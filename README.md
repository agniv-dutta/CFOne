# AstraCFO - AI Chief Financial Officer

AstraCFO is an autonomous AI Chief Financial Officer system designed for small and medium enterprises. It analyzes financial documents (bank statements, GST reports, Excel sheets) to provide financial health summaries, cash flow forecasts, risk detection, compliance reminders, loan approval insights, and actionable recommendations.

## Features

- **Multi-Agent AI System**: 5 specialized AI agents powered by AWS Bedrock Nova 2 Lite
  - Financial Analyzer: Extract structured financial data
  - Cash Flow Forecaster: Predict future cash positions
  - Risk Detector: Identify financial risks and anomalies
  - Compliance Agent: Track tax deadlines and suggest automation
  - Explainability Agent: Provide clear insights and recommendations

- **Document Processing**: Upload and analyze PDFs and Excel files
- **Web Interface**: React-based UI for document management and report viewing
- **RESTful API**: FastAPI backend with automatic OpenAPI documentation
- **Secure Authentication**: JWT-based authentication system
- **Vector Search**: Semantic search capabilities using ChromaDB

## Architecture

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: SQLite
- **AI Models**: AWS Bedrock (Nova 2 Lite, Titan Embeddings)
- **Vector Store**: ChromaDB
- **Document Parsing**: pdfplumber, openpyxl

## Prerequisites

- Python 3.9+
- Node.js 18+
- AWS Account with Bedrock access
- AWS credentials with permissions for Bedrock Runtime

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to project directory
cd CFOne

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env file with your AWS credentials and settings
# Required variables:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - AWS_REGION (default: us-east-1)
# - SECRET_KEY (generate with: openssl rand -hex 32)

# Create required directories
mkdir -p data/vector_store uploads logs

# Initialize database (will be created automatically on first run)
# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file if needed (default points to localhost:8000)
# VITE_API_BASE_URL=http://localhost:8000

# Run development server
npm run dev
```

The frontend will be available at: http://localhost:5173

### 3. AWS Bedrock Setup

Ensure your AWS account has access to:
- Amazon Bedrock
- Nova 2 Lite model (global.amazon.nova-2-lite-v1:0)
- Titan Embeddings model (amazon.titan-embed-text-v1)

Your IAM user/role needs permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/global.amazon.nova-2-lite-v1:0",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1"
      ]
    }
  ]
}
```

## Usage

### 1. Register and Login

1. Navigate to http://localhost:5173
2. Click "Register" and create an account
3. Login with your credentials

### 2. Upload Documents

1. Go to "Documents" page
2. Click "Upload Documents"
3. Select PDF or Excel files (bank statements, GST reports, sales sheets)
4. Wait for processing to complete

### 3. Run Analysis

1. Go to "Analysis" page
2. Select documents to analyze
3. Click "Start Analysis"
4. Wait for analysis to complete (3-5 minutes)

### 4. View Reports

1. Click "View Report" on completed analysis
2. Review all 6 sections:
   - Financial Health Overview
   - Cash Flow Forecast
   - Risk Alerts
   - Compliance & Automation
   - Loan Readiness Score
   - Recommended Actions

## Project Structure

```
CFOne/
├── app/                      # Backend application
│   ├── agents/              # AI agent implementations
│   ├── routers/             # API endpoints
│   ├── services/            # AWS Bedrock, vector store
│   ├── utils/               # Parsers, auth, metrics
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Database setup
│   └── main.py              # FastAPI application
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # Auth context
│   │   ├── services/        # API client
│   │   └── App.jsx          # Main app component
│   └── package.json
├── data/                     # SQLite database and vector store
├── uploads/                  # Uploaded documents
├── requirements.txt          # Python dependencies
├── .env.example             # Environment template
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Documents
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents` - List all documents
- `GET /api/documents/{id}` - Get document details
- `DELETE /api/documents/{id}` - Delete document

### Analysis
- `POST /api/analysis/run` - Start new analysis
- `GET /api/analysis` - List all analyses
- `GET /api/analysis/{id}` - Get analysis report

### Health
- `GET /api/health` - Check system health

## Development

### Run Tests
```bash
# Backend tests
pytest

# Frontend tests
cd frontend && npm test
```

### Code Formatting
```bash
# Backend (Python)
black app/
flake8 app/

# Frontend (JavaScript)
cd frontend && npm run lint
```

### Production Build
```bash
# Backend: Use production ASGI server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend: Build for production
cd frontend && npm run build
```

## Environment Variables

### Backend (.env)
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
SECRET_KEY=your_jwt_secret
DATABASE_URL=sqlite:///./data/astracfo.db
UPLOAD_DIR=./uploads
VECTOR_STORE_PATH=./data/vector_store
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
```

## Troubleshooting

### AWS Bedrock Connection Issues
- Verify AWS credentials are correct
- Check AWS region is set to supported region (us-east-1)
- Ensure IAM permissions are granted for Bedrock access

### Database Issues
- Delete `data/astracfo.db` and restart to reset database
- Check file permissions on data directory

### Upload Issues
- Verify file size is under 10MB
- Check supported formats: PDF, .xlsx, .xls
- Ensure uploads directory exists and is writable

### Frontend Connection Issues
- Verify backend is running on port 8000
- Check CORS_ORIGINS in backend .env includes frontend URL
- Clear browser cache and localStorage

## Security Notes

- Never commit `.env` files to version control
- Generate secure SECRET_KEY: `openssl rand -hex 32`
- Use HTTPS in production
- Rotate AWS credentials regularly
- Enable rate limiting for production deployments

## License

Copyright © 2025 AstraCFO. All rights reserved.

## Support

For issues and questions, please contact support or file an issue in the repository.
