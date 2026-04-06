import { useState, useEffect, useCallback } from 'react';
import { allTerms } from '@/lib/glossary';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export interface LetterEvaluation {
  letter: string;
  status: LetterStatus;
}

// Simple seeded PRNG
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function useTermo(seedVal: string = new Date().toDateString()) {
  const [targetWord, setTargetWord] = useState('');
  const [wordLength, setWordLength] = useState(5);
  const [guesses, setGuesses] = useState<LetterEvaluation[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isInvalidWord, setIsInvalidWord] = useState(false);

  useEffect(() => {
    // 1. Filter valid single words from glossary (letters only, no spaces or dashes)
    const validWords = allTerms
      .map(t => t.term.toLowerCase())
      .filter(w => /^[a-z]+$/.test(w) && w.length >= 4 && w.length <= 8);
    
    // Remove duplicates
    const uniqueValidWords = Array.from(new Set(validWords));

    // 2. Determinate daily word
    let seedNum = 0;
    for (let i = 0; i < seedVal.length; i++) {
      seedNum += seedVal.charCodeAt(i) * Math.pow(10, i % 3);
    }
    const rand = mulberry32(seedNum);
    
    // Shuffle and pick
    const shuffled = uniqueValidWords.sort(() => rand() - 0.5);
    // Ensure we have at least one word
    const chosenWord = shuffled[0] || 'block';

    setTargetWord(chosenWord.toUpperCase());
    setWordLength(chosenWord.length);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
  }, [seedVal]);

  const onKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) {
        // Shake animation for invalid length
        setIsInvalidWord(true);
        setTimeout(() => setIsInvalidWord(false), 500);
        return;
      }
      
      // Evaluate guess
      const guessArray = currentGuess.split('');
      const targetArray: (string | null)[] = targetWord.split('');
      
      const evaluation: LetterEvaluation[] = guessArray.map(l => ({ letter: l, status: 'absent' }));

      for (let i = 0; i < wordLength; i++) {
        if (guessArray[i] === targetArray[i]) {
          evaluation[i]!.status = 'correct';
          targetArray[i] = null; // Mark as consumed
        }
      }

      // Second pass: mark 'present'
      for (let i = 0; i < wordLength; i++) {
        if (evaluation[i]!.status !== 'correct' && targetArray.includes(guessArray[i]!)) {
          evaluation[i]!.status = 'present';
          const consumableIndex = targetArray.indexOf(guessArray[i]!);
          if (consumableIndex !== -1) {
            targetArray[consumableIndex] = null; // Consume
          }
        }
      }

      const newGuesses = [...guesses, evaluation];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord) {
        setGameStatus('won');
      } else if (newGuesses.length === 6) {
        setGameStatus('lost');
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, wordLength, targetWord, gameStatus, guesses]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onKeyPress('ENTER');
      else if (e.key === 'Backspace') onKeyPress('BACKSPACE');
      else {
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) onKeyPress(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  // Compute used letters status for the virtual keyboard
  const usedLetters: Record<string, LetterStatus> = {};
  guesses.forEach(guess => {
    guess.forEach(item => {
      const currentStatus = usedLetters[item.letter];
      if (item.status === 'correct') {
        usedLetters[item.letter] = 'correct';
      } else if (item.status === 'present' && currentStatus !== 'correct') {
        usedLetters[item.letter] = 'present';
      } else if (item.status === 'absent' && !currentStatus) {
        usedLetters[item.letter] = 'absent';
      }
    });
  });

  return {
    targetWord,
    wordLength,
    guesses,
    currentGuess,
    gameStatus,
    isInvalidWord,
    usedLetters,
    onKeyPress
  };
}
