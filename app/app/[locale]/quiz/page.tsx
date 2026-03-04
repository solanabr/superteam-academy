'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  category: string;
  difficulty: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  solana: 'from-purple-600 to-purple-800',
  rust: 'from-orange-600 to-orange-800',
  typescript: 'from-blue-600 to-blue-800',
  nft: 'from-pink-600 to-pink-800',
  defi: 'from-green-600 to-green-800',
  web3: 'from-cyan-600 to-cyan-800',
};

const CATEGORY_ICONS: Record<string, string> = {
  solana: '◎',
  rust: '🦀',
  typescript: '𝕋',
  nft: '🖼️',
  defi: '💰',
  web3: '🌐',
};

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function QuizPage() {
  const { user, authenticated } = usePrivy();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuizQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [quizMode, setQuizMode] = useState<'browse' | 'quiz' | 'results'>('browse');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<{ correct: boolean; selected: number }[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  const wallet = user?.wallet?.address || '';

  useEffect(() => { loadQuestions(); }, []);

  useEffect(() => {
    let filtered = questions;
    if (selectedCategory !== 'all') filtered = filtered.filter(q => q.category === selectedCategory);
    if (selectedDifficulty !== 'all') filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    setFilteredQuestions(filtered);
  }, [questions, selectedCategory, selectedDifficulty]);

  async function loadQuestions() {
    setLoading(true);
    const { data } = await supabase.from('quiz_questions').select('*').eq('is_active', true).order('category').order('difficulty');
    setQuestions(data || []);
    setLoading(false);
  }

  function startQuiz(questionSet: QuizQuestion[]) {
    const shuffled = [...questionSet].sort(() => Math.random() - 0.5).slice(0, Math.min(10, questionSet.length));
    setQuizQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setXpEarned(0);
    setQuizMode('quiz');
  }

  function handleAnswer(index: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    const correct = index === quizQuestions[currentIndex].correct_index;
    setAnswers(prev => [...prev, { correct, selected: index }]);
    if (correct) setXpEarned(prev => prev + 25);
  }

  async function nextQuestion() {
    const newAnswers = [...answers];
    if (currentIndex + 1 >= quizQuestions.length) {
      if (authenticated && wallet) {
        for (let i = 0; i < quizQuestions.length; i++) {
          await supabase.from('quiz_attempts').insert({ user_wallet: wallet, question_id: quizQuestions[i].id, selected_index: newAnswers[i].selected, is_correct: newAnswers[i].correct });
        }
        if (xpEarned > 0) {
          await supabase.from('xp_transactions').insert({ user_wallet: wallet, amount: xpEarned, reason: 'quiz_completion' });
        }
      }
      setQuizMode('results');
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }

  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category)))];
  const score = answers.filter(a => a.correct).length;
  const pct = quizQuestions.length > 0 ? Math.round((score / quizQuestions.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Loading quiz questions...</p>
      </div>
    </div>
  );

  if (quizMode === 'results') return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className={`w-40 h-40 mx-auto rounded-full flex items-center justify-center text-5xl font-bold border-8 ${pct >= 80 ? 'border-green-500 text-green-400' : pct >= 60 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'}`}>{pct}%</div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Job!' : 'Keep Practicing!'}</h2>
          <p className="text-gray-400">{score} of {quizQuestions.length} correct</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex justify-around">
          <div><div className="text-3xl font-bold text-green-400">{score}</div><div className="text-sm text-gray-500">Correct</div></div>
          <div><div className="text-3xl font-bold text-red-400">{quizQuestions.length - score}</div><div className="text-sm text-gray-500">Wrong</div></div>
          <div><div className="text-3xl font-bold text-purple-400">+{xpEarned}</div><div className="text-sm text-gray-500">XP</div></div>
        </div>
        <div className="space-y-2 text-left">
          {quizQuestions.map((q, i) => (
            <div key={q.id} className={`flex items-start gap-3 p-3 rounded-xl ${answers[i]?.correct ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <span>{answers[i]?.correct ? '✓' : '✗'}</span>
              <div><p className="text-sm text-white">{q.question}</p>{!answers[i]?.correct && <p className="text-xs text-green-400 mt-1">Correct: {q.options[q.correct_index]}</p>}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => startQuiz(quizQuestions)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl">Retry</button>
          <button onClick={() => setQuizMode('browse')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl">Browse</button>
        </div>
      </div>
    </div>
  );

  if (quizMode === 'quiz') {
    const q = quizQuestions[currentIndex];
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={() => setQuizMode('browse')} className="text-gray-500 hover:text-white text-sm">← Exit</button>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">{currentIndex + 1} / {quizQuestions.length}</span>
              <span className="text-purple-400 font-semibold">+{xpEarned} XP</span>
            </div>
          </div>
          <div className="max-w-2xl mx-auto mt-3">
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(currentIndex / quizQuestions.length) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm border border-purple-500/30 capitalize">{CATEGORY_ICONS[q.category]} {q.category}</span>
              <span className={`px-3 py-1 rounded-full text-xs border capitalize ${DIFFICULTY_BADGE[q.difficulty]}`}>{q.difficulty}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{q.question}</h2>
            <div className="space-y-3">
              {q.options.map((option, idx) => {
                let cls = 'w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ';
                if (selectedAnswer === null) cls += 'border-gray-700 bg-gray-900 hover:border-purple-500 hover:bg-purple-500/10 text-white cursor-pointer';
                else if (idx === q.correct_index) cls += 'border-green-500 bg-green-500/20 text-green-300';
                else if (idx === selectedAnswer) cls += 'border-red-500 bg-red-500/20 text-red-300';
                else cls += 'border-gray-800 bg-gray-900/50 text-gray-500';
                return (
                  <button key={idx} className={cls} onClick={() => handleAnswer(idx)}>
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${selectedAnswer === null ? 'bg-gray-800' : idx === q.correct_index ? 'bg-green-500 text-white' : idx === selectedAnswer ? 'bg-red-500 text-white' : 'bg-gray-800'}`}>{String.fromCharCode(65 + idx)}</span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {showExplanation && (
              <div className={`p-4 rounded-xl border ${selectedAnswer === q.correct_index ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <p className="text-sm font-semibold mb-1 text-white">{selectedAnswer === q.correct_index ? '✓ Correct! +25 XP' : '✗ Incorrect'}</p>
                <p className="text-sm text-gray-300">{q.explanation}</p>
              </div>
            )}
            {selectedAnswer !== null && (
              <button onClick={nextQuestion} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-4 rounded-xl transition-colors">
                {currentIndex + 1 >= quizQuestions.length ? 'See Results →' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Quiz Arena</h1>
          <p className="text-gray-400">Test your Solana knowledge with {questions.length}+ questions</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <div onClick={() => startQuiz(filteredQuestions)} className="col-span-2 md:col-span-1 cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 border border-purple-500/30 hover:border-purple-400/60 transition-all hover:scale-[1.02]">
            <div className="text-4xl mb-3">🎯</div>
            <div className="font-bold text-xl text-white">Random Quiz</div>
            <div className="text-purple-200 text-sm mt-1">10 questions, all topics</div>
            <div className="mt-3 text-xs bg-white/10 rounded-lg px-3 py-1 inline-block text-purple-100">+250 XP max</div>
          </div>
          {categories.filter(c => c !== 'all').slice(0, 5).map(category => (
            <div key={category} onClick={() => startQuiz(questions.filter(q => q.category === category))} className="cursor-pointer p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all hover:scale-[1.02]">
              <div className="text-3xl mb-2">{CATEGORY_ICONS[category] || '📚'}</div>
              <div className="font-semibold text-white capitalize">{category}</div>
              <div className="text-gray-500 text-xs mt-1">{questions.filter(q => q.category === category).length} questions</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}>
                {cat === 'all' ? 'All' : `${CATEGORY_ICONS[cat] || ''} ${cat}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            {['all', 'beginner', 'intermediate', 'advanced'].map(diff => (
              <button key={diff} onClick={() => setSelectedDifficulty(diff)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${selectedDifficulty === diff ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-500 border border-gray-800'}`}>
                {diff === 'all' ? 'All Levels' : diff}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <div key={q.id} onClick={() => startQuiz([q])} className="group cursor-pointer flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${CATEGORY_COLORS[q.category] || 'from-gray-600 to-gray-800'}`}>{CATEGORY_ICONS[q.category] || '📚'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{q.question}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 capitalize">{q.category}</span>
                  <span className="text-gray-700">•</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_BADGE[q.difficulty]}`}>{q.difficulty}</span>
                </div>
              </div>
              <span className="text-purple-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Practice →</span>
            </div>
          ))}
        </div>
        {filteredQuestions.length > 1 && (
          <div className="mt-8 text-center">
            <button onClick={() => startQuiz(filteredQuestions)} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
              Start Quiz ({Math.min(10, filteredQuestions.length)} questions) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
