import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './apiConfig';
import Chatbot from './Chatbot';
import './App.css';

// QuizQuestion component remains the same
function QuizQuestion({ questionData, onAnswer }) {
    const { question, options, answer } = questionData;
    const [selected, setSelected] = useState(null);
    const handleSelect = (option) => {
        setSelected(option);
        onAnswer(option);
    };
    return (
        <div className="quiz-question-container">
            <h3>{question}</h3>
            <div className="options-grid">
                {options.map((option, index) => {
                    let buttonClass = 'option-button';
                    if (selected) {
                        if (option === answer) buttonClass += ' correct';
                        else if (option === selected) buttonClass += ' incorrect';
                    }
                    return <button key={index} className={buttonClass} onClick={() => handleSelect(option)} disabled={!!selected}>{option}</button>;
                })}
            </div>
        </div>
    );
}

function HomePage() {
    const { user, token } = useContext(AuthContext);
    const [topic, setTopic] = useState('');
    const [quiz, setQuiz] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [studyPlan, setStudyPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;
        const savedState = sessionStorage.getItem(`pathfinderState_${user.email}`);
        if (savedState) {
            const data = JSON.parse(savedState);
            setTopic(data.topic || '');
            setQuiz(data.quiz);
            setUserAnswers(data.userAnswers || {});
            setScore(data.score);
            setStudyPlan(data.studyPlan);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const stateToSave = { topic, quiz, userAnswers, score, studyPlan };
        sessionStorage.setItem(`pathfinderState_${user.email}`, JSON.stringify(stateToSave));
    }, [topic, quiz, userAnswers, score, studyPlan, user]);

    const handleQuizGeneration = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setQuiz(null);
        setStudyPlan(null);
        setUserAnswers({});
        setScore(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE_URL}/generate-quiz`, { topic }, config);
            setQuiz(response.data.quiz);
        } catch (err) {
            setError('Failed to generate quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (selectedOption, index) => {
        setUserAnswers(prev => ({ ...prev, [index]: selectedOption }));
    };

    const handleSubmitQuiz = async () => {
        let correctCount = quiz.reduce((acc, q, i) => userAnswers[i] === q.answer ? acc + 1 : acc, 0);
        setScore(correctCount);
        const resultData = {
            topic,
            score: correctCount,
            totalQuestions: quiz.length,
            quizData: quiz.map((q, i) => ({ ...q, userAnswer: userAnswers[i], isCorrect: userAnswers[i] === q.answer })),
            studyPlan: null,
        };
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (correctCount < quiz.length) {
            setLoading(true);
            setError(null);
            try {
                const planResponse = await axios.post(`${API_BASE_URL}/generate-plan`, { topic, quizData: resultData.quizData }, config);
                const newStudyPlan = planResponse.data.plan;
                setStudyPlan(newStudyPlan);
                await axios.post(`${API_BASE_URL}/save-result`, { ...resultData, studyPlan: newStudyPlan }, config);
            } catch (err) {
                setError('Failed to generate study plan.');
            } finally {
                setLoading(false);
            }
        } else {
            await axios.post(`${API_BASE_URL}/save-result`, resultData, config);
        }
    };
    
    const resetApp = () => {
        setTopic('');
        setQuiz(null);
        setUserAnswers({});
        setScore(null);
        setStudyPlan(null);
        if (user) sessionStorage.removeItem(`pathfinderState_${user.email}`);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Welcome, {user?.email}!</h1>
                <p>Ready to start your learning journey?</p>
            </header>
            <main>
                {!quiz && (
                    <form onSubmit={handleQuizGeneration} className="topic-form">
                        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter a topic..." className="topic-input" disabled={loading} />
                        <button type="submit" className="submit-button" disabled={loading}>{loading ? 'Generating...' : 'Generate Quiz'}</button>
                    </form>
                )}
                
                {/* Corrected Loading and Error Messages */}
                {error && !loading && <p className="status-message error">{error}</p>}
                {loading && !quiz && <p className="status-message">Generating your personalized quiz...</p>}
                {loading && score !== null && <p className="status-message">Analyzing results and building your plan...</p>}

                {quiz && score === null && (
                    <section className="quiz-section">
                        <h2>Quiz on: {topic}</h2>
                        {quiz.map((q, index) => <QuizQuestion key={index} questionData={q} onAnswer={(selected) => handleAnswer(selected, index)} />)}
                        {Object.keys(userAnswers).length === quiz.length && <button onClick={handleSubmitQuiz} className="submit-button">Submit & Get Plan</button>}
                    </section>
                )}
                
                {studyPlan && (
                    <section className="study-plan-section">
                        <h2>Your Personalized Study Plan</h2>
                        <div className="results-summary">Your Score: {score} / {quiz.length}</div>
                        <div className="plan-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{studyPlan}</ReactMarkdown></div>
                        <hr className="history-divider" />
                        <h3>Have a Question? Ask Your AI Tutor!</h3>
                        <Chatbot topic={topic} />
                        <button onClick={resetApp} className="submit-button">Start New Topic</button>
                    </section>
                )}
                
                {score !== null && score === quiz.length && !loading && (
                    <section className="results-section">
                        <h2>Great work!</h2>
                        <div className="results-summary">Your Score: {score} / {quiz.length}</div>
                        <p>You answered all questions correctly. No study plan needed!</p>
                        <button onClick={resetApp} className="submit-button">Start New Topic</button>
                    </section>
                )}
            </main>
        </div>
    );
}

export default HomePage;

