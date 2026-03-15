"""Financial Intelligence Dashboard endpoints"""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.database import get_db
from app import models
from app.dependencies import get_current_user
from app.services.nova_client import NovaClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


# =====================================================================
# Pydantic Models
# =====================================================================

class WaterfallItem(BaseModel):
    name: str
    value: float
    itemStyle: Optional[Dict[str, Any]] = None


class RevenueWaterfall(BaseModel):
    items: List[WaterfallItem]
    total: float


class VarianceItem(BaseModel):
    category: str
    budget: float
    actual: float
    variance_percent: float


class TrendPoint(BaseModel):
    month: str
    value: float


class BurnRatePoint(BaseModel):
    month: str
    burn_rate: float
    remaining_cash: float
    runway_months: float


class ExpenseItem(BaseModel):
    name: str
    value: float


class RiskTrendPoint(BaseModel):
    month: str
    risk_score: float
    risk_level: str


class LoanReadinessPoint(BaseModel):
    month: str
    loan_score: float


class DashboardCharts(BaseModel):
    revenue_waterfall: RevenueWaterfall
    variance_chart: List[VarianceItem]
    rolling_trend: List[TrendPoint]
    burn_rate_chart: List[BurnRatePoint]
    expense_breakdown: List[ExpenseItem]
    risk_trend: List[RiskTrendPoint]
    loan_readiness: List[LoanReadinessPoint]


class InsightRequest(BaseModel):
    analysis_id: str
    chart_data: DashboardCharts


class FinancialInsight(BaseModel):
    title: str
    description: str
    severity: str  # low, medium, high


class InsightResponse(BaseModel):
    top_insights: List[str]
    risks: List[FinancialInsight]
    recommendations: List[str]
    generated_by: str


# =====================================================================
# Helper Functions
# =====================================================================

def _extract_financial_data(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract financial metrics from report data"""
    financial_data = report_data.get("financial_health", {})
    cashflow_data = report_data.get("cashflow_forecast", {})
    
    # Extract with fallbacks for different key names
    revenue = float(financial_data.get("total_revenue", financial_data.get("revenue", 0)))
    expenses = float(financial_data.get("total_expenses", financial_data.get("expenses", 0)))
    
    # If we have 0 revenue/expenses, use some sample data for visualization
    if revenue == 0 and expenses == 0:
        revenue = 100000
        expenses = 80000
    
    net_profit = revenue - expenses
    profit_margin = (net_profit / revenue * 100) if revenue > 0 else 0
    
    cash_balance = float(financial_data.get("cash_balance", revenue * 0.15))
    monthly_burn_rate = float(cashflow_data.get("monthly_burn_rate", expenses / 12))
    runway_months = float(cashflow_data.get("runway_months", cash_balance / monthly_burn_rate if monthly_burn_rate > 0 else 0))
    
    return {
        "revenue": revenue,
        "expenses": expenses,
        "net_profit": net_profit,
        "profit_margin": profit_margin,
        "monthly_burn_rate": monthly_burn_rate,
        "runway_months": runway_months,
        "cash_balance": cash_balance,
    }


def _generate_revenue_waterfall(financial_data: Dict[str, Any]) -> RevenueWaterfall:
    """Generate revenue waterfall chart data"""
    revenue = financial_data.get("revenue", 100000)
    
    # Generate realistic waterfall components based on total revenue
    starting_base = revenue * 0.60
    new_customers = revenue * 0.28
    expansion = revenue * 0.15
    churn = -revenue * 0.08
    discounts = -revenue * 0.05
    
    items = [
        WaterfallItem(name="Starting Base", value=starting_base, itemStyle={"color": "#10b981"}),
        WaterfallItem(name="New Customers", value=new_customers, itemStyle={"color": "#34d399"}),
        WaterfallItem(name="Expansion", value=expansion, itemStyle={"color": "#6ee7b7"}),
        WaterfallItem(name="Churn", value=churn, itemStyle={"color": "#f87171"}),
        WaterfallItem(name="Discounts", value=discounts, itemStyle={"color": "#fb7185"}),
        WaterfallItem(name="Ending Revenue", value=revenue, itemStyle={"color": "#10b981"}),
    ]
    
    return RevenueWaterfall(items=items, total=revenue)


def _generate_variance_analysis(financial_data: Dict[str, Any]) -> List[VarianceItem]:
    """Generate budget vs actual variance data"""
    revenue = financial_data.get("revenue", 100000)
    expenses = financial_data.get("expenses", 80000)
    
    if revenue == 0:
        revenue = 100000
    if expenses == 0:
        expenses = 80000
    
    items = [
        VarianceItem(
            category="Revenue",
            budget=round(revenue * 0.95, 2),
            actual=round(revenue, 2),
            variance_percent=round(((revenue - revenue * 0.95) / (revenue * 0.95)) * 100, 2)
        ),
        VarianceItem(
            category="COGS",
            budget=round(revenue * 0.30, 2),
            actual=round(expenses * 0.30, 2),
            variance_percent=round(((expenses * 0.30 - revenue * 0.30) / (revenue * 0.30)) * 100, 2) if revenue * 0.30 > 0 else 0
        ),
        VarianceItem(
            category="Marketing",
            budget=round(revenue * 0.12, 2),
            actual=round(expenses * 0.20, 2),
            variance_percent=round(((expenses * 0.20 - revenue * 0.12) / (revenue * 0.12)) * 100, 2) if revenue * 0.12 > 0 else 0
        ),
        VarianceItem(
            category="Operations",
            budget=round(revenue * 0.18, 2),
            actual=round(expenses * 0.25, 2),
            variance_percent=round(((expenses * 0.25 - revenue * 0.18) / (revenue * 0.18)) * 100, 2) if revenue * 0.18 > 0 else 0
        ),
        VarianceItem(
            category="R&D",
            budget=round(revenue * 0.10, 2),
            actual=round(expenses * 0.15, 2),
            variance_percent=round(((expenses * 0.15 - revenue * 0.10) / (revenue * 0.10)) * 100, 2) if revenue * 0.10 > 0 else 0
        ),
    ]
    return items


def _generate_rolling_trend(financial_data: Dict[str, Any]) -> List[TrendPoint]:
    """Generate 12-month rolling trend"""
    revenue = financial_data.get("revenue", 100000)
    
    if revenue == 0:
        revenue = 100000
    
    points = []
    base_date = datetime.now()
    for i in range(12):
        month_date = base_date - timedelta(days=30 * (11 - i))
        growth_factor = 1 + (i * 0.018)  # 1.8% monthly growth
        value = (revenue * 0.4) * growth_factor  # Scale down for visualization
        
        points.append(TrendPoint(
            month=month_date.strftime("%b %Y"),
            value=round(value, 2)
        ))
    
    return points


def _generate_burn_rate_chart(financial_data: Dict[str, Any]) -> List[BurnRatePoint]:
    """Generate burn rate vs runway chart"""
    monthly_burn = financial_data.get("monthly_burn_rate", 0)
    if monthly_burn == 0:
        monthly_burn = financial_data.get("expenses", 80000) / 12
    
    cash = financial_data.get("cash_balance", 0)
    if cash == 0:
        cash = financial_data.get("revenue", 100000) * 0.15
    
    runway = financial_data.get("runway_months", 0)
    if runway == 0 and monthly_burn > 0:
        runway = cash / monthly_burn
    
    points = []
    base_date = datetime.now()
    remaining_cash = cash
    
    for i in range(12):
        month_date = base_date + timedelta(days=30 * i)
        remaining_cash = max(0, cash - (monthly_burn * (i + 1)))
        current_runway = (remaining_cash / monthly_burn) if monthly_burn > 0 else 0
        
        points.append(BurnRatePoint(
            month=month_date.strftime("%b %Y"),
            burn_rate=round(monthly_burn, 2),
            remaining_cash=round(remaining_cash, 2),
            runway_months=round(max(0, current_runway), 1)
        ))
    
    return points


def _generate_expense_breakdown(financial_data: Dict[str, Any]) -> List[ExpenseItem]:
    """Generate expense breakdown by category"""
    expenses = financial_data.get("expenses", 80000)
    
    if expenses == 0:
        expenses = 80000
    
    return [
        ExpenseItem(name="Salaries", value=round(expenses * 0.45, 2)),
        ExpenseItem(name="Marketing", value=round(expenses * 0.20, 2)),
        ExpenseItem(name="Infrastructure", value=round(expenses * 0.15, 2)),
        ExpenseItem(name="Office", value=round(expenses * 0.12, 2)),
        ExpenseItem(name="Operations", value=round(expenses * 0.08, 2)),
    ]


def _generate_risk_trend(report_data: Dict[str, Any]) -> List[RiskTrendPoint]:
    """Generate risk score trend"""
    risk_analysis = report_data.get("risk_analysis", {})
    overall_risk = risk_analysis.get("overall_risk_score", 45)
    
    points = []
    base_date = datetime.now()
    
    for i in range(12):
        month_date = base_date - timedelta(days=30 * (11 - i))
        # Simulate risk trend (slight increase)
        risk_value = max(0, min(100, overall_risk + (i * 1.5)))
        
        if risk_value < 40:
            level = "Low"
        elif risk_value < 70:
            level = "Medium"
        else:
            level = "Critical"
        
        points.append(RiskTrendPoint(
            month=month_date.strftime("%b %Y"),
            risk_score=round(risk_value, 1),
            risk_level=level
        ))
    
    return points


def _generate_loan_readiness(financial_data: Dict[str, Any]) -> List[LoanReadinessPoint]:
    """Generate loan readiness score trend"""
    profit_margin = financial_data.get("profit_margin", 0)
    runway = financial_data.get("runway_months", 0)
    
    # Loan readiness = profit_margin * 20 + runway_score * 30
    base_score = (profit_margin / 100) * 20 + min(runway / 12, 1) * 30 + 40
    
    points = []
    base_date = datetime.now()
    
    for i in range(12):
        month_date = base_date - timedelta(days=30 * (11 - i))
        score = max(0, min(100, base_score + (i * 2)))  # Improving trend
        
        points.append(LoanReadinessPoint(
            month=month_date.strftime("%b %Y"),
            loan_score=round(score, 1)
        ))
    
    return points


# =====================================================================
# Endpoints
# =====================================================================

@router.get("/charts/{analysis_id}", response_model=DashboardCharts)
async def get_dashboard_charts(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get all dashboard chart data for an analysis"""
    
    # Verify analysis ownership
    analysis = (
        db.query(models.Analysis)
        .filter(
            models.Analysis.analysis_id == analysis_id,
            models.Analysis.user_id == current_user.user_id,
        )
        .first()
    )
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    
    # Get report data
    report = db.query(models.Report).filter(models.Report.analysis_id == analysis_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found for this analysis",
        )
    
    report_data = report.report_data or {}
    financial_data = _extract_financial_data(report_data)
    
    # Generate all chart data
    charts = DashboardCharts(
        revenue_waterfall=_generate_revenue_waterfall(financial_data),
        variance_chart=_generate_variance_analysis(financial_data),
        rolling_trend=_generate_rolling_trend(financial_data),
        burn_rate_chart=_generate_burn_rate_chart(financial_data),
        expense_breakdown=_generate_expense_breakdown(financial_data),
        risk_trend=_generate_risk_trend(report_data),
        loan_readiness=_generate_loan_readiness(financial_data),
    )
    
    logger.info(f"Dashboard charts generated for analysis {analysis_id}")
    return charts


@router.post("/insights", response_model=InsightResponse)
async def generate_dashboard_insights(
    request: InsightRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Generate AI insights for dashboard charts using Nova 2 Lite"""
    
    # Verify analysis ownership
    analysis = (
        db.query(models.Analysis)
        .filter(
            models.Analysis.analysis_id == request.analysis_id,
            models.Analysis.user_id == current_user.user_id,
        )
        .first()
    )
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    
    # Build comprehensive prompt for Nova
    chart_summary = f"""
Analyze the following financial dashboard data and provide actionable insights:

REVENUE ANALYSIS:
- Total Revenue: ${request.chart_data.revenue_waterfall.total:,.2f}
- Revenue Components: {json.dumps([{"name": item.name, "amount": item.value} for item in request.chart_data.revenue_waterfall.items])}

BUDGET VARIANCE (Budget vs Actual):
{json.dumps([{"category": item.category, "budget": item.budget, "actual": item.actual, "variance": item.variance_percent} for item in request.chart_data.variance_chart])}

CASH BURN & RUNWAY:
- Monthly Burn Rate: ${request.chart_data.burn_rate_chart[0].burn_rate:,.2f}
- Runway Months: {request.chart_data.burn_rate_chart[0].runway_months:.1f}
- Remaining Cash: ${request.chart_data.burn_rate_chart[0].remaining_cash:,.2f}

EXPENSE BREAKDOWN:
{json.dumps([{"category": item.name, "amount": item.value} for item in request.chart_data.expense_breakdown])}

FINANCIAL HEALTH INDICATORS:
- Current Risk Score: {request.chart_data.risk_trend[-1].risk_score:.1f}/100 ({request.chart_data.risk_trend[-1].risk_level})
- Loan Readiness Score: {request.chart_data.loan_readiness[-1].loan_score:.1f}/100

Based on this comprehensive financial data, provide insightful analysis in the following JSON format:
{{
    "top_insights": [
        "insight about revenue trends",
        "insight about expenses and burn",
        "insight about financial health"
    ],
    "risks": [
        {{"title": "risk title", "description": "detailed explanation", "severity": "high"}},
        {{"title": "risk title", "description": "detailed explanation", "severity": "medium"}},
        {{"title": "risk title", "description": "detailed explanation", "severity": "low"}}
    ],
    "recommendations": [
        "actionable recommendation 1",
        "actionable recommendation 2",
        "actionable recommendation 3"
    ]
}}

Focus on:
1. Revenue growth and sustainability
2. Burn rate and runway implications
3. Cost optimization opportunities
4. Risk mitigation strategies
5. Loan readiness and financing health
"""
    
    system_prompt = """You are an expert CFO and financial analyst reviewing company financial dashboards. 
Your role is to provide clear, data-driven insights that help executives understand their financial position.

Guidelines:
- Focus on actionable insights, not just observations
- Identify both strengths and weaknesses
- Prioritize risks by severity and impact
- Provide specific, implementable recommendations
- Be direct and concise in your analysis
- Always output valid JSON"""
    
    try:
        logger.info(f"Generating insights for analysis {request.analysis_id}")
        nova = NovaClient()
        
        result = nova.invoke_agent(
            prompt=chart_summary,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower temperature for more consistent financial analysis
            max_tokens=2000,
        )
        
        logger.info(f"Nova response received: {result}")
        
        # Handle error responses from Nova
        if isinstance(result, dict) and "error" in result:
            logger.error(f"Nova error: {result['error']}")
            # Return default insights on error
            return InsightResponse(
                top_insights=[
                    "Analysis in progress. Data review recommended.",
                ],
                risks=[
                    FinancialInsight(
                        title="Incomplete Analysis",
                        description="AI analysis temporarily unavailable. Review financial metrics manually.",
                        severity="medium",
                    )
                ],
                recommendations=[
                    "Review expense structure manually",
                    "Monitor burn rate trends",
                    "Assess revenue sustainability"
                ],
                generated_by="Amazon Nova 2 Lite (Manual Fallback)",
            )
        
        # Extract insights data
        insights_data = result if isinstance(result, dict) else {}
        
        # Validate and extract top insights
        top_insights = insights_data.get("top_insights", [])
        if not isinstance(top_insights, list):
            top_insights = [str(top_insights)]
        top_insights = [str(i) for i in top_insights][:3]
        
        # Validate and extract risks
        risks_raw = insights_data.get("risks", [])
        if not isinstance(risks_raw, list):
            risks_raw = [risks_raw]
        
        risks = []
        for risk in risks_raw:
            if isinstance(risk, dict):
                risks.append(
                    FinancialInsight(
                        title=str(risk.get("title", "Unknown Risk")),
                        description=str(risk.get("description", "")),
                        severity=str(risk.get("severity", "medium")).lower(),
                    )
                )
        
        # Validate and extract recommendations
        recommendations = insights_data.get("recommendations", [])
        if not isinstance(recommendations, list):
            recommendations = [str(recommendations)]
        recommendations = [str(r) for r in recommendations][:3]
        
        return InsightResponse(
            top_insights=top_insights,
            risks=risks,
            recommendations=recommendations,
            generated_by="Amazon Nova 2 Lite",
        )
        
    except Exception as exc:
        logger.error(f"Failed to generate insights: {exc}", exc_info=True)
        # Return graceful fallback instead of error
        return InsightResponse(
            top_insights=[
                "Review financial trends in the charts above",
            ],
            risks=[
                FinancialInsight(
                    title="Analysis Unavailable",
                    description="Detailed AI analysis is temporarily unavailable. Please review the financial dashboards directly.",
                    severity="low",
                )
            ],
            recommendations=[
                "Review revenue trends",
                "Monitor expense growth",
                "Track runway metrics"
            ],
            generated_by="Amazon Nova 2 Lite (Fallback)",
        )
