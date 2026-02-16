import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDocuments, getAnalyses } from '../services/api';
import Navbar from '../components/Layout/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    documents: 0,
    analyses: 0,
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.company_name}!</h1>
        <p className="text-gray-600 mb-8">Financial overview dashboard</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Documents</h3>
            <p className="text-3xl font-bold text-primary mt-2">{stats.documents}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Analyses</h3>
            <p className="text-3xl font-bold text-success mt-2">{stats.analyses}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Latest Status</h3>
            <p className="text-2xl font-bold mt-2 capitalize">
              {stats.latest ? stats.latest.status : 'None'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/documents"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">Upload Documents</h2>
            <p className="text-gray-600">Upload bank statements, GST reports, or sales sheets</p>
          </Link>

          <Link
            to="/analysis"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-2">Run Analysis</h2>
            <p className="text-gray-600">Generate comprehensive financial analysis reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
