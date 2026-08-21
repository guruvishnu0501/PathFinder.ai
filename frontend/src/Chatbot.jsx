import React, { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from './apiConfig';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

function Chatbot({ topic }) {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `I'm Pathfinder, your AI tutor. Ask me anything about ${topic}!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useContext(AuthContext);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE_URL}/ask-follow-up`, {
        topic: topic,
        question: input
      }, config);
      
      setMessages([...newMessages, { sender: 'ai', text: response.data.answer }]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'ai', text: 'Sorry, I had trouble getting an answer right now. Please try again.' }]);
      console.error("Chatbot error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        ))}
        {loading && <div className="chat-message ai loading"><span></span><span></span><span></span></div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chatbot-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          className="topic-input"
          disabled={loading}
        />
        <button type="submit" className="submit-button" disabled={loading}>Send</button>
      </form>
    </div>
  );
}

export default Chatbot;
