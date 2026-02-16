import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Analysis</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Run New Analysis</h2>

            {documents.length === 0 ? (
              <p className="text-gray-500">
                No documents available. Please upload documents first.
              </p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Select documents to analyze:
                  </p>

                  {documents.map((doc) => (
                    <label key={doc.document_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.document_id)}
                        onChange={() => toggleDocument(doc.document_id)}
                        className="rounded"
                      />
                      <span className="text-sm">{doc.filename}</span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleRunAnalysis}
                  disabled={running || selectedDocs.length === 0}
                  className="w-full bg-primary text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {running ? 'Starting Analysis...' : 'Start Analysis'}
                </button>
              </>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Analysis History</h2>

            {analyses.length === 0 ? (
              <p className="text-gray-500">No analyses run yet.</p>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.analysis_id}
                    className="border rounded p-4"
                    onClick={() => navigate(`/report/${analysis.analysis_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(analysis.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm mt-1">
                          {analysis.document_count} document(s)
                        </p>
                      </div>

                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          analysis.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : analysis.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {analysis.status}
                      </span>
                    </div>

                    {analysis.status === 'completed' && (
                      <button className="mt-2 text-primary text-sm hover:underline">
                        View Report →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
