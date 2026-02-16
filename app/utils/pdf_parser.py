"""PDF parsing utilities"""

import pdfplumber
from PyPDF2 import PdfReader
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> Dict[str, Any]:
    """
    Extract text and tables from PDF documents

    Args:
        file_path: Path to PDF file

    Returns:
        Dictionary containing text, tables, metadata
    """
    result = {
        "text": "",
        "tables": [],
        "page_count": 0,
        "metadata": {}
    }

    try:
        # Try pdfplumber first (better for tables)
        with pdfplumber.open(file_path) as pdf:
            result["page_count"] = len(pdf.pages)

            all_text = []
            for page_num, page in enumerate(pdf.pages, start=1):
                # Extract text
                page_text = page.extract_text()
                if page_text:
                    all_text.append(page_text)

                # Extract tables
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        result["tables"].append({
                            "page": page_num,
                            "data": table
                        })

            result["text"] = "\n\n".join(all_text)

            # Get metadata if available
            if pdf.metadata:
                result["metadata"] = {
                    "author": pdf.metadata.get("Author", ""),
                    "creation_date": str(pdf.metadata.get("CreationDate", ""))
                }

        # Check if PDF is empty
        if not result["text"].strip():
            return {"error": "Document appears to be empty"}

        return result

    except Exception as e:
        # If pdfplumber fails, try PyPDF2 as fallback
        try:
            reader = PdfReader(file_path)
            result["page_count"] = len(reader.pages)

            all_text = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    all_text.append(text)

            result["text"] = "\n\n".join(all_text)

            if reader.metadata:
                result["metadata"] = {
                    "author": reader.metadata.get("/Author", ""),
                    "creation_date": str(reader.metadata.get("/CreationDate", ""))
                }

            if not result["text"].strip():
                return {"error": "Document appears to be empty"}

            return result

        except Exception as fallback_error:
            logger.error(f"PDF parsing failed: {str(fallback_error)}")

            # Check for common errors
            if "encrypted" in str(e).lower() or "password" in str(e).lower():
                return {"error": "Document is password-protected. Please provide an unencrypted version."}

            return {"error": f"Failed to parse PDF: {str(e)}"}
