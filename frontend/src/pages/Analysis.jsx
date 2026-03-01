import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, getAnalyses, runAnalysis } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Analysis = () => {
  const [documents, setDocuments] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, analysesRes] = await Promise.all([
        getDocuments(),
        getAnalyses(),
      ]);

      setDocuments(docsRes.data.documents);
      setAnalyses(analysesRes.data.analyses);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (selectedDocs.length === 0) {
      alert('Please select at least one document');
      return;
    }

    setRunning(true);

    try {
      const response = await runAnalysis({
        document_ids: selectedDocs,
        analysis_type: 'full',
      });

      alert('Analysis started! You will be notified when complete.');
      navigate(`/report/${response.data.analysis_id}`);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to start analysis');
    } finally {
      setRunning(false);
    }
  };

  const toggleDocument = (docId) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter((id) => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 animate-fade-up">
      <h1 className="font-display text-4xl mb-6 text-[var(--text-primary)] tracking-wide">Analysis Control</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="surface-card p-8 flex flex-col h-full">
          <h2 className="font-display text-2xl font-semibold mb-6 text-[var(--text-primary)]">Run New Analysis</h2>

          {documents.length === 0 ? (
            <p className="text-[var(--text-secondary)] font-mono text-sm">
              No documents available. Please upload documents first.
            </p>
          ) : (
            <>
              <div className="mb-6 flex-1">
                <p className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] mt-2 mb-4 uppercase">
                  Select documents to analyze
                </p>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {documents.map((doc) => (
                    <label
                      key={doc.document_id}
                      className={`flex items-center space-x-3 p-3 border rounded-sm cursor-pointer transition-colors
                        ${selectedDocs.includes(doc.document_id)
                          ? 'border-[var(--primary-accent)] bg-[rgba(205,127,50,0.05)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-muted)]'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.document_id)}
                        onChange={() => toggleDocument(doc.document_id)}
                        className="rounded-sm border-[var(--primary-accent)] text-[var(--primary-accent)] focus:ring-[var(--primary-accent)] bg-transparent"
                      />
                      <span className="text-sm font-mono tracking-wide text-[var(--text-primary)] truncate">{doc.filename}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedDocs.length === 0 && (
                <p className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest mb-2 text-center uppercase">
                  ☑ Select at least one document above
                </p>
              )}
              {selectedDocs.length > 0 && (
                <p className="font-mono text-[10px] text-[var(--positive-color)] tracking-widest mb-2 text-center uppercase">
                  ✓ {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} selected
                </p>
              )}
              <button
                onClick={handleRunAnalysis}
                disabled={running || selectedDocs.length === 0}
                className="btn-generate w-full py-3 px-6 mt-auto font-mono text-xs tracking-wider uppercase font-bold text-center"
              >
                {running ? 'INITIALIZING AGENTS...' : 'START ANALYSIS →'}
              </button>
            </>
          )}
        </div>

        <div className="surface-card p-8 flex flex-col h-full">
          <h2 className="font-display text-2xl font-semibold mb-6 text-[var(--text-primary)]">Analysis History</h2>

          {analyses.length === 0 ? (
            <p className="text-[var(--text-secondary)] font-mono text-sm">No analyses run yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {analyses.map((analysis) => (
                <div
                  key={analysis.analysis_id}
                  className="border border-[var(--border-color)] rounded-sm p-5 cursor-pointer hover:border-[var(--secondary-accent)] transition-colors group"
                  onClick={() => navigate(`/report/${analysis.analysis_id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-xs text-[var(--text-muted)] tracking-wider mb-1">
                        {new Date(analysis.created_at).toLocaleString()}
                      </p>
                      <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {analysis.document_count} document(s)
                      </p>
                    </div>

                    <span
                      className={`px-2 py-1 text-[9px] uppercase font-mono tracking-widest rounded-sm border ${analysis.status === 'completed'
                          ? 'border-[var(--positive-color)] text-[var(--positive-color)]'
                          : analysis.status === 'processing'
                            ? 'border-[var(--primary-accent)] text-[var(--primary-accent)]'
                            : 'border-[var(--negative-color)] text-[var(--negative-color)]'
                        }`}
                    >
                      {analysis.status}
                    </span>
                  </div>

                  {analysis.status === 'completed' && (
                    <div className="mt-4 flex justify-end">
                      <span className="font-mono text-[10px] tracking-wider text-[var(--secondary-accent)] uppercase group-hover:underline">
                        View Report →
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;
