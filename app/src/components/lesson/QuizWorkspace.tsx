"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizWorkspaceProps {
  questions: Question[];
  onComplete: (success: boolean) => void;
}

export function QuizWorkspace({ questions, onComplete }: QuizWorkspaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = questions?.[currentQuestionIndex];

  if (!questions || questions.length === 0 || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-gray-400 text-lg">No questions available for this quiz.</p>
      </div>
    );
  }

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsAnswered(true);
    setIsCorrect(correct);
    
    if (correct) {
        setScore(prev => prev + 1);
        toast.success("Correct Answer!");
    } else {
        toast.error("Incorrect Answer");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setIsCorrect(false);
    } else {
        finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    const passed = score >= Math.ceil(questions.length * 0.7); // 70% pass rate
    onComplete(passed);
  };

  if (quizFinished) {
      const passed = score >= Math.ceil(questions.length * 0.7);
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="mb-6">
                  {passed ? (
                      <CheckCircle className="w-20 h-20 text-[#14F195]" />
                  ) : (
                      <XCircle className="w-20 h-20 text-red-500" />
                  )}
              </div>
              <h2 className="text-2xl font-bold mb-2">Quiz Completed</h2>
              <p className="text-gray-400 mb-6">
                  You scored {score} out of {questions.length}
              </p>
              
              {passed ? (
                  <div className="text-[#14F195] font-bold text-xl mb-8">
                      Congratulations! You passed the quiz.
                  </div>
              ) : (
                  <div className="text-red-500 font-bold text-xl mb-8">
                      You didn't pass this time. Try again or review the material.
                  </div>
              )}

              <Button onClick={() => {
                  setCurrentQuestionIndex(0);
                  setSelectedOption(null);
                  setIsAnswered(false);
                  setIsCorrect(false);
                  setScore(0);
                  setQuizFinished(false);
              }}>
                  Retry Quiz
              </Button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F] border-l border-[#2E2E36]">
      <div className="p-6 border-b border-[#2E2E36]">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Question {currentQuestionIndex + 1} of {questions.length}</h3>
              <span className="text-sm text-gray-500">Score: {score}</span>
          </div>
          <p className="text-xl text-white">{currentQuestion.question}</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        selectedOption === index ? "border-[#9945FF] bg-[#9945FF]/10" : "border-[#2E2E36] bg-[#1E1E24] hover:bg-[#2E2E36]",
                        isAnswered && index === currentQuestion.correctAnswer && "border-[#14F195] bg-[#14F195]/10",
                        isAnswered && selectedOption === index && index !== currentQuestion.correctAnswer && "border-red-500 bg-red-500/10"
                    )}
                  >
                      <div className="flex items-center gap-3">
                          <div className={cn(
                              "w-6 h-6 rounded-full border flex items-center justify-center text-xs",
                              selectedOption === index ? "border-[#9945FF] text-[#9945FF]" : "border-gray-500 text-gray-500",
                              isAnswered && index === currentQuestion.correctAnswer && "border-[#14F195] text-[#14F195]",
                             isAnswered && selectedOption === index && index !== currentQuestion.correctAnswer && "border-red-500 text-red-500"
                          )}>
                              {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="p-6 border-t border-[#2E2E36]">
          {!isAnswered ? (
              <Button 
                className="w-full bg-[#9945FF] hover:bg-[#7e37d0] text-white"
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
              >
                  Submit Answer
              </Button>
          ) : (
              <Button 
                className="w-full bg-[#1E1E24] hover:bg-[#2E2E36] text-white"
                onClick={handleNextQuestion}
              >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "See Results"}
              </Button>
          )}
      </div>
    </div>
  );
}
