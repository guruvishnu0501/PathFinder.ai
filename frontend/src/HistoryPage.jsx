import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './apiConfig';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SkeletonLoader from './SkeletonLoader';
import Chatbot from './Chatbot';
import './App.css';

// NEW: Component for a single question with an explanation feature
function QuestionReviewItem({ question, index }) {
  const { token } = useContext(AuthContext);
  const [explanation, setExplanation] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const handleExplain = async () => {
    if (explanation) { // Don't fetch again if already have it
      setExplanation(''); // Allow toggling
      return;
    }
    setIsLoadingExplanation(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE_URL}/explain-question`, {
        question: question.question,
        answer: question.answer
      }, config);
      setExplanation(response.data.explanation);
    } catch (error) {
      setExplanation('Sorry, I couldn\'t get an explanation right now.');
      console.error("Explanation fetch failed:", error);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  return (
    <div className="review-question-container">
      <h4>{index + 1}. {question.question}</h4>
      <div className="review-options-grid">
        {question.options.map((option, optIndex) => {
          let btnClass = 'review-option';
          if (option === question.answer) btnClass += ' correct-answer';
          else if (option === question.userAnswer) btnClass += ' user-answer-incorrect';
          return <div key={optIndex} className={btnClass}>{option}</div>;
        })}
      </div>
      <button onClick={handleExplain} className="explanation-button" disabled={isLoadingExplanation}>
        {explanation ? 'Hide Explanation' : 'Explain this'}
      </button>
      {isLoadingExplanation && <p className="explanation-loading">Pathfinder is thinking...</p>}
      {explanation && (
        <div className="explanation-box">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// Updated QuizReview component to use the new item component
function QuizReview({ quizData }) {
    if (!quizData) return null;
    return (
        <div className="quiz-review-container">
            {quizData.map((q, i) => (
                <QuestionReviewItem key={i} question={q} index={i} />
            ))}
        </div>
    );
}

// HistoryItem and HistoryPage remain largely the same, but are included for completeness
function HistoryItem({ result }) {
  const [isOpen, setIsOpen] = useState(false);
  const { topic, score, totalQuestions, completedAt, studyPlan, quizData } = result;
  const formattedDate = new Date(completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="history-item">
      <button className="history-item-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="history-topic">{topic}</span>
        <span className="history-details">Score: {score}/{totalQuestions}</span>
        <span className="history-date">{formattedDate}</span>
        <span className={`history-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="history-item-body">
          {studyPlan && studyPlan !== "Great job! No incorrect answers found." && (
            <div className="plan-content"><h4>Study Plan:</h4><ReactMarkdown remarkPlugins={[remarkGfm]}>{studyPlan}</ReactMarkdown></div>
          )}
          <hr className="history-divider" />
          <h4>Quiz Review:</h4>
          <QuizReview quizData={quizData} />
          <hr className="history-divider" />
          <h3>Have a Question? Ask Your AI Tutor!</h3>
          <Chatbot topic={topic} />
        </div>
      )}
    </div>
  );
}

function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) { setLoading(false); return; }
            setError('');
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${API_BASE_URL}/history`, config);
                setHistory(response.data);
            } catch (err) {
                setError('Failed to load quiz history.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [token]);

    return (
        <div className="app">
            <header className="app-header">
                <h1>Your Quiz History</h1>
                <p>Review your past performance and study plans.</p>
            </header>
            <main className="history-container">
                {loading && <SkeletonLoader type="table-row" count={5} />}
                {error && <p className="status-message error">{error}</p>}
                {!loading && !history.length && <p className="status-message">You haven't completed any quizzes yet.</p>}
                {!loading && history.map((result) => <HistoryItem key={result._id} result={result} />)}
            </main>
        </div>
    );
}

export default HistoryPage;

