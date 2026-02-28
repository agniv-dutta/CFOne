"""Agent 4: Compliance and Automation Suggestions"""

from app.agents.base_agent import BaseAgent
from typing import Dict, Any
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class AutomationAgent(BaseAgent):
    """Identify compliance requirements and suggest automation opportunities"""

    SYSTEM_PROMPT = """You are a Compliance and Automation Agent. Identify upcoming tax deadlines, check for compliance issues, and suggest automation opportunities.
Generate draft payment reminder emails. Recommend automated GST filing actions.
Focus on Indian tax compliance (GST, Income Tax, TDS).
Return results in strict JSON format with clear deadlines and actionable suggestions.

Output format must be valid JSON matching this structure:
{
  "upcoming_deadlines": [
    {
      "type": str,
      "due_date": str,
      "description": str,
      "estimated_amount": float,
      "status": str
    }
  ],
  "compliance_issues": [
    {
      "type": str,
      "description": str,
      "severity": str,
      "resolution_steps": [str]
    }
  ],
  "automation_suggestions": [
    {
      "category": str,
      "description": str,
      "potential_savings": str,
      "implementation_complexity": str
    }
  ],
  "draft_emails": [
    {
      "subject": str,
      "body": str,
      "recipient_type": str
    }
  ]
}"""

    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute compliance and automation analysis"""
        logger.info("Starting Automation Agent execution")

        result, exec_time = self.run_with_retry(
            context=context,
            system_prompt=self.SYSTEM_PROMPT,
            temperature=0.4,
            max_tokens=800,
            reasoning_effort="low",
        )

        return result

    def _build_prompt(self, context: Dict[str, Any]) -> str:
        """Build prompt for compliance and automation"""
        financial_data = context.get("financial_data", {})
        current_date = datetime.now().strftime("%Y-%m-%d")

        prompt = f"""Analyze financial data for compliance and automation opportunities:

Current Date: {current_date}

Financial Data:
{json.dumps(financial_data, indent=2)}

Tasks:
1. Identify upcoming tax deadlines (next 90 days):
   - GST filing deadlines (monthly/quarterly)
   - Income Tax advance tax payments
   - TDS return filing
   - Annual tax return deadlines

2. Check for compliance issues:
   - Late or missed tax payments
   - Missing documentation
   - Regulatory violations
   - Severity levels: "low", "medium", "high"

3. Suggest automation opportunities in categories:
   - "payment": Automated bill payments
   - "filing": Automated tax filing
   - "reporting": Automated financial reporting

   Include:
   - Description of automation
   - Potential time/cost savings
   - Implementation complexity: "low", "medium", "high"

4. Generate 2-3 draft emails:
   - Payment reminders to vendors
   - Tax deadline reminders
   - Recipient types: "vendor", "client", "tax_authority"

Return only valid JSON without any markdown formatting or explanations."""

        return prompt

    def _validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate automation agent output"""
        if not super()._validate_output(output):
            return False

        required_keys = ["upcoming_deadlines", "compliance_issues", "automation_suggestions", "draft_emails"]

        for key in required_keys:
            if key not in output:
                logger.warning(f"Missing required key in output: {key}")

        return True
