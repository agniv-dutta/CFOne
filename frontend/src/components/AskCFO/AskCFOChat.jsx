import React, { useState, useRef, useEffect } from 'react';
import { askCFO } from '../../services/api';

/**
 * AskCFOChat Component
 * 
 * Chat interface for AgentCFO – CEO asks financial questions
 * about the generated report, gets CFO-level strategic guidance.
 * 
 * Props:
 *   analysisId  – The completed analysis ID (required for context)
 *   reportData  – Optional report data for display context
 */
const AskCFOChat = ({ analysisId, reportData }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m **AgentCFO**, your financial advisor. Ask me anything about this report—cash runway, profit margins, funding strategy, expense optimization, or financial risks.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setError(null);
    const userMessage = { role: 'user', content: question };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build chat history (exclude system greeting and latest user turn)
      const historyForAPI = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = {
        question,
        analysis_id: analysisId,
        chat_history: historyForAPI,
      };

      const response = await askCFO(payload);
      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.error?.message ||
        'Failed to get AgentCFO response. Please try again.';
      setError(errMsg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suggested questions for executive-level inquiries
  const suggestedQuestions = [
    'How can we improve our profit margin?',
    'What is our biggest financial risk?',
    'Should we raise funding right now?',
    'How can we extend our runway?',
    'Which expenses should we cut first?',
    'Is our burn rate dangerous?',
  ];

  const handleSuggestion = (q) => {
    setInput(q);
  };

  return (
    <div className="surface-card flex flex-col overflow-hidden rounded-sm" style={{ height: '700px', borderTop: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-[var(--primary-accent)] to-[var(--secondary-accent)] flex items-center justify-center">
            <span className="font-mono text-[10px] font-bold text-[var(--bg-color)]">CFO</span>
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">AgentCFO</h2>
            <p className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] uppercase">Financial Strategic Advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--positive-color)] animate-pulse"></span>
          <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] uppercase">Ready</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-sm bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[7px] text-[var(--primary-accent)]">CFO</span>
            </div>
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-accent)] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-accent)] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-accent)] animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="font-mono text-[11px] text-[var(--negative-color)] border border-[var(--negative-color)] bg-[rgba(255,59,59,0.05)] rounded-sm px-4 py-3">
            ⚠ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions (show only when there's just the greeting) */}
      {messages.length === 1 && (
        <div className="px-6 pb-3 flex flex-wrap gap-2 flex-shrink-0">
          {suggestedQuestions.slice(0, 4).map((q, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(q)}
              className="font-mono text-[9px] tracking-wider px-3 py-1.5 border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--primary-accent)] hover:text-[var(--primary-accent)] transition-colors rounded-sm whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-end gap-3 flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AgentCFO... (Enter to send)"
          rows={2}
          disabled={loading}
          className="flex-1 resize-none bg-[var(--bg-color)] border border-[var(--border-color)] rounded-sm px-4 py-3 font-mono text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-accent)] transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="h-full px-5 py-3 bg-[var(--primary-accent)] text-[var(--bg-color)] font-mono text-[11px] tracking-widest uppercase rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};

// =====================================================================
// Individual message bubble with markdown-like formatting
// =====================================================================

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  // Simple markdown rendering (**text** → bold)
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Render line breaks
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {line}
          {j < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-[var(--primary-accent)] text-[var(--bg-color)] rounded-sm px-4 py-3">
          <p className="font-mono text-[12px] leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="w-6 h-6 rounded-sm bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0 mb-0.5">
        <span className="font-mono text-[7px] text-[var(--primary-accent)]">CFO</span>
      </div>
      <div className="max-w-[85%] bg-[var(--surface-color)] border border-[var(--border-color)] rounded-sm px-4 py-3">
        <p className="font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {renderContent(message.content)}
        </p>
      </div>
    </div>
  );
};

export default AskCFOChat;
