import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { getAnalysis } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Report = () => {
  const { analysisId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [analysisId]);

  const fetchReport = async () => {
    try {
      const response = await getAnalysis(analysisId);
      const data = response.data;

      setReport(data);

      if (data.status === 'completed' || data.status === 'failed') {
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch report');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-lg">
            {report?.status === 'processing'
              ? 'Analysis in progress... This may take a few minutes.'
              : 'Loading report...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const reportData = report?.report;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Financial Analysis Report</h1>

        {report?.status === 'failed' && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-6">
            Analysis failed. Please try again.
          </div>
        )}

        {reportData && (
          <div className="space-y-6">
            {/* Section 1: Financial Health */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">1. Financial Health Overview</h2>

              {reportData.section_1_financial_health && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        ${reportData.section_1_financial_health.revenue?.total?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Total Expenses</p>
                      <p className="text-2xl font-bold">
                        ${reportData.section_1_financial_health.expenses?.total?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Net Profit Margin</p>
                      <p className="text-2xl font-bold">
                        {reportData.section_1_financial_health.metrics?.net_profit_margin || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Cash Flow */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">2. Cash Flow Forecast</h2>

              {reportData.section_2_cash_flow_forecast && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Monthly Burn Rate</p>
                      <p className="text-xl font-bold">
                        ${reportData.section_2_cash_flow_forecast.monthly_burn_rate?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Runway</p>
                      <p className="text-xl font-bold">
                        {reportData.section_2_cash_flow_forecast.runway_months || 0} months
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Risk Alerts */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">3. Risk Alerts</h2>

              {reportData.section_3_risk_alerts && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Risk Score</p>
                      <p className="text-3xl font-bold">
                        {reportData.section_3_risk_alerts.risk_score || 0}/100
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded text-lg font-semibold ${
                        reportData.section_3_risk_alerts.risk_level === 'low'
                          ? 'bg-green-100 text-green-800'
                          : reportData.section_3_risk_alerts.risk_level === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {reportData.section_3_risk_alerts.risk_level?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Loan Readiness */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">5. Loan Readiness Score</h2>

              <div className="text-center">
                <div className="inline-block">
                  <p className="text-6xl font-bold text-primary">
                    {reportData.section_5_loan_readiness_score || 0}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">out of 100</p>
                </div>
              </div>
            </div>

            {/* Section 6: Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">6. Recommended Actions</h2>

              {reportData.section_6_recommended_actions?.recommended_actions && (
                <div className="space-y-4">
                  {reportData.section_6_recommended_actions.recommended_actions.map(
                    (action, idx) => (
                      <div key={idx} className="border-l-4 border-primary pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">
                              Priority {action.priority}: {action.action}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{action.details}</p>
                            <div className="flex space-x-4 mt-2 text-xs">
                              <span className="text-gray-500">Impact: {action.impact}</span>
                              <span className="text-gray-500">Effort: {action.effort}</span>
                              <span className="text-gray-500">Timeline: {action.timeline}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Executive Summary */}
            {reportData.section_6_recommended_actions?.executive_summary && (
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
                <p className="whitespace-pre-wrap">
                  {reportData.section_6_recommended_actions.executive_summary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
