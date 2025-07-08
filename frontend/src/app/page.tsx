'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { soundManager } from '@/utils/sounds';
import { config } from '../config';

const Chat = dynamic(() => import('@/components/Chat'), { ssr: false });

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    soundManager.init();
  }, []);

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setPdfStatus('idle');
      setPdfError(null);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setPdfStatus('uploading');
    setPdfError(null);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('api_key', apiKey);
      const res = await fetch(`${config.apiUrl}/api/upload_pdf`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload PDF');
      setPdfStatus('uploaded');
      soundManager.play('receive');
    } catch (err: any) {
      setPdfStatus('error');
      setPdfError(err.message || 'Unknown error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim() && pdfStatus === 'uploaded') {
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
            Employee Handbook Guide
          </h1>
          <p className="mt-4 text-center text-slate-600 text-2xl md:text-3xl">
            Enter your OpenAI API key to get started. Then upload your employee handbook (PDF, Markdown, or Text) and chat with it to get instant answers to your workplace questions!
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-12 space-y-8">
          <div className="space-y-4">
            <label htmlFor="apiKey" className="block text-xl text-slate-700 font-medium">
              OpenAI API Key
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
              Your API key is only used to process your requests and is never stored.
            </p>
          </div>
          <div className="space-y-4">
            <label htmlFor="pdfUpload" className="block text-xl text-slate-700 font-medium">
              Upload your Employee Handbook (PDF, Markdown, or Text)
            </label>
            <input
              id="pdfUpload"
              type="file"
              accept=".pdf,.md,.txt,application/pdf,text/markdown,text/plain"
              onChange={handlePdfChange}
              className="block w-full text-lg"
              disabled={pdfStatus === 'uploading'}
            />
            {pdfFile && pdfStatus !== 'uploaded' && (
              <button
                type="button"
                onClick={handlePdfUpload}
                className="send-button group relative flex justify-center py-2 px-4 border border-transparent text-lg rounded-xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all duration-200 hover:scale-[1.02]"
                disabled={pdfStatus === 'uploading'}
              >
                {pdfStatus === 'uploading' ? 'Uploading...' : 'Upload Handbook'}
              </button>
            )}
            {pdfStatus === 'uploaded' && (
              <p className="text-green-600 text-lg">Handbook uploaded and indexed! You can now chat with it below.</p>
            )}
            {pdfStatus === 'error' && (
              <p className="text-red-600 text-lg">Error: {pdfError}</p>
            )}
          </div>
          <div>
            <button
              type="submit"
              className="send-button group relative w-full flex justify-center py-4 px-6 border border-transparent text-xl md:text-2xl rounded-xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all duration-200 hover:scale-[1.02]"
              disabled={pdfStatus !== 'uploaded'}
            >
              Start Chatting
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
