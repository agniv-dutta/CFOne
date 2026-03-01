import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocuments, getAnalyses } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    documents: 2, // Default visual placeholders
    analyses: 3,
    latest: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [docsRes, analysesRes] = await Promise.all([
          getDocuments({ limit: 1 }),
          getAnalyses({ limit: 1 }),
        ]);

        setStats({
          documents: docsRes.data.total,
          analyses: analysesRes.data.total,
          latest: analysesRes.data.analyses[0] || null,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column (Wide) */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        {/* Welcome Panel */}
        <div className="surface-card p-10 animate-fade-up fade-delay-1 relative overflow-hidden">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="font-display text-5xl mb-4 text-[var(--text-primary)] tracking-wide">
                Welcome back, <span className="italic text-[var(--primary-accent)] font-serif">{user?.company_name || 'KJSCE'}</span>
              </h1>
              <p className="font-mono text-[10px] tracking-widest text-[var(--text-secondary)] uppercase">FINANCIAL OVERVIEW — 28 FEB 2026, 14:32 IST</p>
            </div>
            <div className="px-4 py-1.5 font-mono text-[9px] tracking-widest flex items-center gap-3 border border-opacity-30 border-[var(--positive-color)] rounded-full text-[var(--positive-color)] bg-[var(--bg-color)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive-color)] animate-pulse"></span>
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>

          <div className="font-mono text-xs text-[var(--text-muted)]">
            <span className="text-[var(--cmd-line-color)]">cfone $ running financial health check — {stats.analyses} reports ready for review</span>
            <span className="inline-block w-2 h-3 bg-[var(--cmd-line-color)] ml-1 animate-blink align-middle"></span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-0 surface-card py-8 animate-fade-up fade-delay-2 divide-x divide-[var(--border-color)]">
          <div className="px-8 flex flex-col">
            <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-5 uppercase">· TOTAL DOCUMENTS</span>
            <span className="font-mono text-5xl font-bold text-[var(--primary-accent)] mb-3">{stats.documents.toString().padStart(2, '0')}</span>
            <span className="text-xs text-[var(--text-secondary)]">Bank statements & GST reports</span>
          </div>
          <div className="px-8 flex flex-col">
            <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-5 uppercase">· TOTAL ANALYSES</span>
            <span className="font-mono text-5xl font-bold text-[var(--secondary-accent)] mb-3">{stats.analyses.toString().padStart(2, '0')}</span>
            <span className="text-xs text-[var(--text-secondary)]">Comprehensive reports</span>
          </div>
          <div className="px-8 flex flex-col">
            <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-5 uppercase">· LATEST STATUS</span>
            <span className="font-mono text-3xl font-bold text-[var(--positive-color)] mb-3 mt-1 tracking-widest uppercase">
              {stats.latest ? stats.latest.status : 'COMPLETED'}
            </span>
            <span className="text-xs text-[var(--text-muted)] mt-auto">Last run: 2 hrs ago</span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="grid grid-cols-2 gap-0 surface-card animate-fade-up fade-delay-3 divide-x divide-[var(--border-color)]">
          <div className="p-8 pb-10 flex flex-col">
            <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-6">01 / INGEST</span>
            <h3 className="font-display text-3xl font-semibold mb-4 text-[var(--text-primary)]">Upload Documents</h3>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-8 flex-1 pr-4">
              Import bank statements, GST reports, or Excel sales sheets. All formats processed and indexed for multi-agent analysis.
            </p>
            <button onClick={() => navigate('/documents')} className="btn-select py-3.5 px-6 font-mono text-[11px] tracking-wider flex justify-between items-center w-full">
              <span className="mr-6 uppercase font-bold">SELECT FILES</span> <span>→</span>
            </button>
          </div>
          <div className="p-8 pb-10 flex flex-col">
            <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-6">02 / PROCESS</span>
            <h3 className="font-display text-3xl font-semibold mb-4 text-[var(--text-primary)]">Run Analysis</h3>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-8 flex-1 pr-4">
              Deploy all 5 AI agents across your documents. Generates a full financial health report with risk flags and forecasts.
            </p>
            <button onClick={() => navigate('/analysis')} className="btn-generate py-3.5 px-6 font-mono text-[11px] tracking-wider flex justify-between items-center w-full">
              <span className="mr-6 uppercase font-bold">GENERATE REPORT</span> <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar (320px logic) */}
      <div className="lg:col-span-4 w-full flex flex-col space-y-6">
        {/* AI AGENTS Panel */}
        <div className="surface-card p-6 animate-fade-up fade-delay-4">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4 mb-5 font-mono text-[9px] tracking-widest text-[var(--primary-accent)] uppercase">
            <span>AI AGENTS</span>
            <span className="text-[var(--text-muted)]">5/5 ONLINE</span>
          </div>
          <div className="space-y-4 font-mono text-[11px]">
            {['Financial Analyzer', 'Cash Flow Forecaster', 'Risk Detector', 'Compliance Agent', 'Explainability Agent'].map((agent, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div className="flex items-center space-x-3 text-[var(--text-primary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-accent)] shadow-[0_0_6px_var(--primary-accent)] group-hover:scale-150 transition-transform"></span>
                  <span className="group-hover:text-[var(--primary-accent)] transition-colors font-semibold tracking-wide">{agent}</span>
                </div>
                <span className="text-[var(--secondary-accent)] text-[9px] tracking-widest">READY</span>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE Panel */}
        <div className="surface-card p-6 animate-fade-up fade-delay-5">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4 mb-5 font-mono text-[9px] tracking-widest text-[var(--primary-accent)] uppercase">
            <span>PERFORMANCE</span>
            <span className="text-[var(--text-muted)]">LIVE</span>
          </div>

          <div className="space-y-7">
            <div>
              <div className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-3">ACCURACY RATE</div>
              <div className="flex justify-between items-end mb-3">
                <span className="font-mono text-3xl font-bold text-[var(--primary-accent)]">98.5%</span>
              </div>
              <div className="font-body text-xs text-[var(--text-secondary)] mb-3 text-[11px]">↑ +0.3% from last batch</div>
              <div className="flex gap-1 h-5 w-full">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`flex-1 ${i < 6 ? 'bg-[var(--primary-accent)]' : 'bg-[var(--border-color)]'}`} style={{ opacity: i < 6 ? 1 - ((5 - i) * 0.10) : 0.3 }}></div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-3 uppercase">WEEK-OVER-WEEK TREND</div>
              <div className="flex justify-between items-end mb-3">
                <span className="font-mono text-3xl font-bold text-[var(--secondary-accent)] flex items-center">
                  <span className="text-xl mr-2 rotate-[-0deg]">↑</span> 15%
                </span>
                <span className="font-body text-[10px] text-[var(--text-muted)] pb-1.5">Week-over-week growth</span>
              </div>
              <div className="flex gap-1 h-5 w-full justify-end">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`flex-1 ${i > 1 ? 'bg-[var(--secondary-accent)]' : 'bg-transparent border border-opacity-30 border-[var(--border-color)]'}`} style={{ opacity: i > 1 ? 0.3 + (i * 0.14) : 0.4 }}></div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mb-2">RECENT UPLOAD</div>
              <div className="font-mono text-[13px] font-bold text-[var(--text-primary)]">2 hours ago</div>
              <div className="font-mono text-[10px] text-[var(--text-muted)] mt-1 tracking-wide">Q4_bank_statement.pdf</div>
            </div>
          </div>
        </div>

        {/* VECTOR SEARCH Panel */}
        <div className="surface-card p-6 pb-8 animate-fade-up fade-delay-6">
          <div className="flex justify-between items-center mb-5 font-mono text-[9px] tracking-widest text-[var(--primary-accent)] uppercase">
            <span>VECTOR SEARCH</span>
            <span className="text-[var(--text-muted)]">CHROMADB</span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)] space-y-3 pl-1">
            <div className="flex tracking-wide"><span className="text-[var(--primary-accent)] mr-3 opacity-60">›</span> collections: <span className="text-[var(--text-primary)] ml-2">3 active</span></div>
            <div className="flex tracking-wide"><span className="text-[var(--primary-accent)] mr-3 opacity-60">›</span> embeddings: <span className="text-[var(--text-primary)] ml-2">1,247 docs</span></div>
            <div className="flex tracking-wide"><span className="text-[var(--primary-accent)] mr-3 opacity-60">›</span> last query: <span className="text-[var(--secondary-accent)] ml-3">14:28:03</span></div>
            <div className="flex tracking-wide"><span className="text-[var(--primary-accent)] mr-3 opacity-60">›</span> latency: <span className="text-[var(--text-primary)] ml-6">42ms avg</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
