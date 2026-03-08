'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  examsApi, Question, QuestionOption, Exam, ExamAttempt, ExamCorrection
} from '@/lib/api';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Award, ChevronLeft, ChevronRight,
  Play, RotateCcw, AlertCircle, BookOpen
} from 'lucide-react';

interface ModuleExamViewProps {
  examId: number;
  moduleTitle: string;
  onBack: () => void;
}

type ExamPhase = 'intro' | 'quiz' | 'results';

export default function ModuleExamView({ examId, moduleTitle, onBack }: ModuleExamViewProps) {
  const { token } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<ExamPhase>('intro');

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results state
  const [score, setScore] = useState<number | null>(null);
  const [corrections, setCorrections] = useState<ExamCorrection[]>([]);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);

  // Previous attempts
  const [previousAttempts, setPreviousAttempts] = useState<ExamAttempt[]>([]);

  useEffect(() => {
    loadExamData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId]);

  const loadExamData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [examData, questionsData, attemptsData] = await Promise.all([
        examsApi.get(examId, token),
        examsApi.getQuestions(examId, token),
        examsApi.myAttempts(token),
      ]);
      setExam(examData);
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      const examAttempts = (Array.isArray(attemptsData) ? attemptsData : [])
        .filter(a => a.examId === String(examId) && a.completedAt);
      setPreviousAttempts(examAttempts);
    } catch (err) {
      console.error('Failed to load exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!token) return;
    try {
      const attemptData = await examsApi.startAttempt(examId, token);
      setAttemptId(attemptData.id);
      setAnswers({});
      setCurrentIndex(0);
      setElapsedSec(0);
      setPhase('quiz');
      timerRef.current = setInterval(() => {
        setElapsedSec(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start attempt:', err);
    }
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const submitQuiz = async () => {
    if (!token || !attemptId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);
    try {
      const answersList = questions.map(q => ({
        questionId: String(q.id),
        selectedOptionId: answers[String(q.id)] || '',
        timeTakenSec: 0,
      }));
      const result = await examsApi.submitAttempt(attemptId, answersList, token);
      setScore(result.attempt.score);
      setCorrections(result.corrections);
      setAttempt(result.attempt);
      setPhase('results');
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryQuiz = () => {
    setPhase('intro');
    setAnswers({});
    setCorrections([]);
    setScore(null);
    setAttempt(null);
    setAttemptId(null);
    setCurrentIndex(0);
    setElapsedSec(0);
    loadExamData();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];
  const bestScore = previousAttempts.length > 0
    ? Math.max(...previousAttempts.map(a => a.score ?? 0))
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card text-center py-12">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">This quiz has no questions yet.</p>
        </div>
      </div>
    );
  }

  // ========== INTRO ==========
  if (phase === 'intro') {
    return (
      <div className="space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to module
        </button>

        <div className="card max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-orange-500" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{exam.title || moduleTitle}</h2>
            {exam.description && (
              <p className="text-sm text-gray-500 mt-2">{exam.description}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{questions.length} questions</span>
            </div>
            {exam.timeLimitMin > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{exam.timeLimitMin} min</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>Pass: {exam.passMark}%</span>
            </div>
          </div>

          {bestScore !== null && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              bestScore >= exam.passMark ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
            }`}>
              <Award className="w-4 h-4" />
              Best score: {bestScore}%
              {previousAttempts.length > 0 && (
                <span className="text-xs opacity-70">({previousAttempts.length} attempt{previousAttempts.length > 1 ? 's' : ''})</span>
              )}
            </div>
          )}

          <button
            onClick={startQuiz}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {previousAttempts.length > 0 ? 'Retry Quiz' : 'Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  // ========== QUIZ ==========
  if (phase === 'quiz' && currentQuestion) {
    return (
      <div className="space-y-4">
        {/* Header with timer & progress */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Question {currentIndex + 1} / {questions.length}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {formatTime(elapsedSec)}
            </span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {answeredCount}/{questions.length} answered
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <div className="card space-y-6">
          <p className="text-base font-medium text-gray-900 leading-relaxed">
            {currentQuestion.text}
          </p>

          {currentQuestion.imageUrl && (
            <img
              src={currentQuestion.imageUrl}
              alt="Question illustration"
              className="max-w-full max-h-64 object-contain mx-auto rounded-lg"
            />
          )}

          <div className="space-y-3">
            {currentQuestion.options.map((opt: QuestionOption) => {
              const isSelected = answers[String(currentQuestion.id)] === String(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => selectAnswer(String(currentQuestion.id), String(opt.id))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 text-gray-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {opt.label}
                    </span>
                    <span className="text-sm">{opt.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-4 py-2 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-lg flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={isSubmitting || answeredCount === 0}
              className="px-6 py-2 text-sm bg-orange-500 text-white hover:bg-orange-600 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Submit ({answeredCount}/{questions.length})
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
                i === currentIndex
                  ? 'bg-orange-500 text-white'
                  : answers[String(q.id)]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ========== RESULTS ==========
  if (phase === 'results' && attempt) {
    const passed = (score ?? 0) >= (exam?.passMark ?? 75);

    return (
      <div className="space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to module
        </button>

        {/* Score card */}
        <div className={`card text-center space-y-4 ${passed ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            passed ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            {passed ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <XCircle className="w-10 h-10 text-orange-500" />
            )}
          </div>

          <div>
            <h2 className="text-3xl font-bold">{score}%</h2>
            <p className={`text-sm font-medium mt-1 ${passed ? 'text-green-600' : 'text-orange-600'}`}>
              {passed ? 'Module Validated!' : 'Not yet passed'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>{attempt.correctCount}/{attempt.totalQuestions} correct</span>
            {attempt.durationSec && <span>{formatTime(attempt.durationSec)}</span>}
          </div>

          <button
            onClick={retryQuiz}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>

        {/* Corrections */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Review</h3>
          {questions.map((q, i) => {
            const correction = corrections.find(c => c.questionId === String(q.id));
            const isCorrect = correction?.isCorrect;
            const selectedOpt = q.options.find(o => String(o.id) === correction?.selectedOptionId);
            const correctOpt = q.options.find(o => String(o.id) === correction?.correctOptionId);

            return (
              <div key={q.id} className={`card border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-900 font-medium">{q.text}</p>
                    {!isCorrect && selectedOpt && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Your answer: {selectedOpt.label}. {selectedOpt.text}
                      </p>
                    )}
                    {correctOpt && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Correct: {correctOpt.label}. {correctOpt.text}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-gray-500 italic mt-1">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
