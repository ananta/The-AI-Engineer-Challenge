import { useState, useRef, useEffect } from 'react';
import { config } from '../config';
import { soundManager } from '@/utils/sounds';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  apiKey: string;
}

export default function Chat({ apiKey }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    soundManager.init();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    soundManager.play('send');
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Use the PDF chat endpoint
      const response = await fetch(`${config.apiUrl}/api/pdf_chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_message: userMessage,
          api_key: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      soundManager.play('receive');
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="p-6">
        <h1 className="text-5xl md:text-6xl mb-4 font-bold text-rose-600">AI Notebook</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`chat-bubble ${
                message.role === 'user' ? 'user-bubble' : 'assistant-bubble'
              }`}
            >
              <p className="whitespace-pre-wrap text-xl">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-6 border-t border-slate-200">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              soundManager.play('click');
              setInput(e.target.value);
            }}
            placeholder="Write your message..."
            className="flex-1 p-4 rounded-xl chat-input text-xl"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-rose-600 text-white rounded-xl hover:bg-rose-700 send-button disabled:opacity-50 text-xl"
          >
            {isLoading ? 'Writing...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
} 