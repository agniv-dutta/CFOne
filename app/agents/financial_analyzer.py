"""Agent 1: Financial Data Extraction and Analysis"""

from app.agents.base_agent import BaseAgent
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class FinancialAnalyzer(BaseAgent):
    """Extract and structure financial data from uploaded documents"""

    SYSTEM_PROMPT = """You are a Financial Data Extraction Agent. Extract structured financial data from the provided documents.
Identify revenue streams, expense categories, liabilities, loan EMIs, and tax payments.
Return results in strict JSON format with numerical values only (no currency symbols).
If information is missing or unclear, use null values.

Output format must be valid JSON matching this structure:
{
  "revenue": {
    "total": float,
    "breakdown": [{"category": str, "amount": float}]
  },
  "expenses": {
    "total": float,
    "breakdown": [{"category": str, "amount": float}]
  },
  "liabilities": {
    "total": float,
    "breakdown": [{"type": str, "amount": float, "due_date": str}]
  },
  "loan_emis": [{"lender": str, "amount": float, "frequency": str}],
  "tax_payments": [{"type": str, "amount": float, "date": str}],
  "metrics": {
    "gross_margin": float,
    "net_profit_margin": float,
    "expense_ratio": float
  }
}"""

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute financial analysis"""
        logger.info("Starting Financial Analyzer execution")

        result, exec_time = self.run_with_retry(
            context=context,
            system_prompt=self.SYSTEM_PROMPT,
            temperature=0.1,
            max_tokens=2000,
            reasoning_effort="low",
        )

        return result

    def _build_prompt(self, context: Dict[str, Any]) -> str:
        """Build prompt for financial analysis"""
        documents_text = context.get("documents_text", "")
        document_types = context.get("document_types", [])

        prompt = f"""Analyze the following financial documents and extract structured data:

Document Types: {', '.join(document_types) if document_types else 'Mixed financial documents'}

Documents Content:
{documents_text[:15000]}

Extract all financial information including:
- Total revenue and breakdown by categories
- Total expenses and breakdown by categories
- Liabilities with due dates
- Loan EMI information
- Tax payments

Calculate financial metrics:
- Gross margin percentage
- Net profit margin
- Expense ratio

Return only valid JSON without any markdown formatting or explanations."""

        return prompt

    def _validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate financial analyzer output"""
        if not super()._validate_output(output):
            return False

        # Check for required keys
        required_keys = ["revenue", "expenses", "liabilities", "loan_emis", "tax_payments", "metrics"]

        for key in required_keys:
            if key not in output:
                logger.warning(f"Missing required key in output: {key}")
                # Don't fail validation, just warn
        return True
