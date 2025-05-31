'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { soundManager } from '@/utils/sounds';

const Chat = dynamic(() => import('@/components/Chat'), { ssr: false });

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);

  useEffect(() => {
    soundManager.init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      soundManager.play('click');
      setIsKeySet(true);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    soundManager.play('click');
    setApiKey(e.target.value);
  };

  if (isKeySet) {
    return <Chat apiKey={apiKey} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-12">
        <div>
          <h1 className="text-6xl md:text-7xl font-bold text-center text-rose-600 mb-6">
            AI Notebook
          </h1>
          <p className="mt-4 text-center text-slate-600 text-2xl md:text-3xl">
            Enter your OpenAI API key to start writing
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-12 space-y-8">
          <div className="space-y-4">
            <label htmlFor="apiKey" className="block text-xl text-slate-700 font-medium">
              Your API Key
            </label>
            <textarea
              id="apiKey"
              value={apiKey}
              onChange={handleKeyChange}
              required
              rows={3}
              className="chat-input appearance-none rounded-xl relative block w-full px-6 py-4 border placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xl md:text-2xl"
              placeholder="Paste your OpenAI API key here..."
              style={{ resize: 'none' }}
            />
            <p className="text-slate-500 text-lg">
              Your API key is only used for making requests and is never stored.
            </p>
          </div>
          <div>
            <button
              type="submit"
              className="send-button group relative w-full flex justify-center py-4 px-6 border border-transparent text-xl md:text-2xl rounded-xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all duration-200 hover:scale-[1.02]"
            >
              Start Writing
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
