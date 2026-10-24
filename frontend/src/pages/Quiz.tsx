import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { englishApi } from '@/api/endpoints';
import type { QuizQuestion } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Field } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface QuestionState extends QuizQuestion {
  userAnswer: string;
  result: 'correct' | 'wrong' | null;
}

export function QuizPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { error } = useToast();

  const [count, setCount] = useState(10);
  const [mode, setMode] = useState('all');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup');
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finishPending, setFinishPending] = useState(false);

  // When finishPending is set and the answer has been submitted (state settled), finish the quiz
  useEffect(() => {
    if (finishPending && submitted) {
      setFinishPending(false);
      void finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishPending, submitted]);

  const correctCount = useMemo(() => questions.filter((q) => q.result === 'correct').length, [questions]);

  const start = async () => {
    try {
      const res = await englishApi.quizQuestions(count, mode);
      if (res.data.data.questions.length === 0) {
        error('No words available for this quiz. Add some vocabulary first!');
        return;
      }
      setQuestions(res.data.data.questions.map((q) => ({ ...q, userAnswer: '', result: null })));
      setIndex(0);
      setAnswer('');
      setSubmitted(false);
      setPhase('playing');
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const check = () => {
    const q = questions[index];
    const normalized = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const expected = q.type === 'to_english' ? q.word : q.meaning;
    const isCorrect = normalized(answer) === normalized(expected);
    setQuestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, userAnswer: answer, result: isCorrect ? 'correct' : 'wrong' } : item)),
    );
    setSubmitted(true);
  };

  const next = () => {
    // If the answer hasn't been checked yet, check it first
    if (!submitted) {
      check();
      // If this is the last question we still need to finish after checking,
      // but check() is synchronous (it sets state), so we use a callback approach.
      // We schedule finish after the state update flushes by deferring.
      if (index + 1 >= questions.length) {
        // Use a flag: finish will be triggered by the submitted state in a useEffect below
        setFinishPending(true);
      }
      return;
    }
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswer('');
      setSubmitted(false);
    } else {
      void finish();
    }
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      const correct = questions.filter((q) => q.result === 'correct').length;
      await englishApi.quizSubmit({
        totalQuestions: questions.length,
        correctAnswers: correct,
        wrongAnswers: questions.length - correct,
        details: questions.map((q) => ({
          wordId: q.wordId,
          word: q.word,
          givenAnswer: q.userAnswer,
          correct: q.result === 'correct',
          type: q.type,
        })),
      });
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setPhase('results');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'setup') {
    return (
      <div>
        <PageHeader
          title="Vocabulary quiz"
          subtitle="Test your word knowledge"
          icon={<BookOpen className="h-5 w-5" />}
          action={
            <Button variant="secondary" onClick={() => navigate('/english')}>
              <ArrowLeft className="h-4 w-4" />
              Back to vocabulary
            </Button>
          }
        />
        <Card className="mx-auto max-w-lg">
          <div className="space-y-5">
            <Field label="Number of questions">
              <Select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={15}>15 questions</option>
                <option value={20}>20 questions</option>
              </Select>
            </Field>
            <Field label="Question set">
              <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="all">All words</option>
                <option value="learned">Only learned words</option>
                <option value="unlearned">Only unlearned words</option>
                <option value="favorites">Only favorites</option>
              </Select>
            </Field>
            <Button className="w-full" onClick={start}>
              Start quiz <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'results') {
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <div>
        <PageHeader title="Quiz results" subtitle="Here's how you did" icon={<Trophy className="h-5 w-5" />} />
        <Card className="mx-auto max-w-lg text-center">
          <div
            className={cn(
              'mx-auto flex h-24 w-24 items-center justify-center rounded-full font-display text-3xl font-bold',
              score >= 80
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                : score >= 50
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
                  : 'bg-red-500/10 text-red-600 dark:text-red-300',
            )}
          >
            {score}%
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">
            {correctCount} of {questions.length} correct
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {score >= 80 ? 'Excellent work! Keep it up! 🎉' : score >= 50 ? 'Good effort — keep reviewing!' : 'Keep practicing — you\'ll get there!'}
          </p>

          <div className="mt-6 space-y-2 text-left">
            {questions.map((q, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 rounded-xl border px-3 py-2 text-sm',
                  q.result === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                    : 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10',
                )}
              >
                {q.result === 'correct' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white">{q.word}</p>
                  <p className="text-slate-500 dark:text-slate-400">{q.meaning}</p>
                  {q.result === 'wrong' && (
                    <p className="text-xs font-medium text-red-500">Your answer: {q.userAnswer || '—'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setPhase('setup')}>
              <RotateCcw className="h-4 w-4" />
              New quiz
            </Button>
            <Button className="flex-1" onClick={() => navigate('/english')}>
              Back to words
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const q = questions[index];
  const progress = ((index + (submitted ? 1 : 0)) / questions.length) * 100;

  return (
    <div>
      <PageHeader
        title="Quiz in progress"
        subtitle={`Question ${index + 1} of ${questions.length}`}
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <Button variant="secondary" onClick={() => setPhase('setup')}>
            <ArrowLeft className="h-4 w-4" />
            Quit
          </Button>
        }
      />
      <Card className="mx-auto max-w-xl">
        <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
          {q.type === 'to_arabic' ? 'Translate to Arabic' : 'Translate to English'}
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-bold text-slate-800 dark:text-white">
          {q.type === 'to_english' ? q.meaning : q.word}
        </h2>

        <div className="mt-6">
          <input
            autoFocus
            value={answer}
            disabled={submitted}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!submitted) check();
                else next();
              }
            }}
            placeholder="Type your answer…"
            className={cn(
              'input text-center text-lg',
              submitted && q.result === 'correct' && '!border-emerald-500 !bg-emerald-50 dark:!bg-emerald-500/10',
              submitted && q.result === 'wrong' && '!border-red-500 !bg-red-50 dark:!bg-red-500/10',
            )}
          />
        </div>

        {submitted && (
          <div
            className={cn(
              'mt-4 rounded-xl border p-4 text-center',
              q.result === 'correct'
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                : 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10',
            )}
          >
            {q.result === 'correct' ? (
              <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Correct!
              </p>
            ) : (
              <div className="text-sm text-red-600 dark:text-red-300">
                <p className="font-semibold">
                  Not quite — the answer is “{q.type === 'to_english' ? q.word : q.meaning}”
                </p>
                {q.userAnswer && <p className="mt-1 text-xs">You wrote: {q.userAnswer}</p>}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!submitted ? (
            <Button onClick={check}>Check answer</Button>
          ) : (
            <Button onClick={next} loading={index + 1 === questions.length && submitting}>
              {index + 1 === questions.length ? 'Finish' : 'Next question'} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
