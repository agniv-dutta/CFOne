import React, { useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import { getDocuments, uploadDocuments, deleteDocument } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(null);

  const fetchDocuments = async () => {
    try {
      const response = await getDocuments();
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      formData.append('files', file);
    });

    try {
      await uploadDocuments(formData);
      setSelectedFiles(null);
      e.target.reset();
      fetchDocuments();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(id);
      fetchDocuments();
    } catch (error) {
      alert('Failed to delete document');
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
        <h1 className="text-3xl font-bold mb-6">Documents</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Upload Documents</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.xlsx,.xls"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-blue-700"
              />
              <p className="text-sm text-gray-500 mt-2">
                Accepted formats: PDF, Excel (.xlsx, .xls). Max 10MB per file.
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Your Documents</h2>

          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className="border rounded p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{doc.filename}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()} •{' '}
                      {(doc.size_bytes / 1024).toFixed(2)} KB
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                        doc.processed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {doc.processed ? 'Processed' : 'Processing'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(doc.document_id)}
                    className="text-red-600 hover:text-red-800 px-4 py-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
