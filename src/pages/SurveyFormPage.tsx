import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSurvey, listQuestions, submitSurveyResponse, type Question, type Survey } from '../api/surveys';
import { ApiError } from '../api/client';

type Answers = Record<string, string | string[]>;
type Files = Record<string, File[]>;

export default function SurveyFormPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0..questions.length-1, questions.length = review
  const [answers, setAnswers] = useState<Answers>({});
  const [files, setFiles] = useState<Files>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surveyId) return;
    Promise.all([getSurvey(Number(surveyId)), listQuestions(Number(surveyId))]).then(([s, q]) => {
      setSurvey(s);
      setQuestions(q);
      setLoading(false);
    });
  }, [surveyId]);

  if (loading) return <p className="text-muted text-sm">Loading survey…</p>;
  if (!survey) return <p className="text-muted text-sm">Survey not found.</p>;

  const isReview = step === questions.length;
  const currentQuestion = questions[step];

  function isAnswered(q: Question): boolean {
    if (q.type === 'file_upload') return (files[q.name]?.length ?? 0) > 0;
    const v = answers[q.name];
    if (Array.isArray(v)) return v.length > 0;
    return !!v && v.trim() !== '';
  }

  function validateCurrent(): boolean {
    if (!currentQuestion) return true;
    if (currentQuestion.required && !isAnswered(currentQuestion)) {
      setTouched((t) => ({ ...t, [currentQuestion.name]: true }));
      return false;
    }
    if (currentQuestion.type === 'email') {
      const v = answers[currentQuestion.name];
      if (typeof v === 'string' && v && !/^\S+@\S+\.\S+$/.test(v)) {
        setTouched((t) => ({ ...t, [currentQuestion.name]: true }));
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateCurrent()) return;
    setStep((s) => Math.min(s + 1, questions.length));
  }
  function goPrev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function setAnswer(name: string, value: string | string[]) {
    setAnswers((a) => ({ ...a, [name]: value }));
  }
  function setQuestionFiles(name: string, list: FileList | null) {
    setFiles((f) => ({ ...f, [name]: list ? Array.from(list) : [] }));
  }

  async function handleSubmit() {
    if (!surveyId) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const q of questions) {
        if (q.type === 'file_upload') {
          for (const f of files[q.name] || []) formData.append(q.name, f);
        } else {
          const v = answers[q.name];
          if (Array.isArray(v)) formData.append(q.name, v.join(','));
          else if (v) formData.append(q.name, v);
        }
      }
      await submitSurveyResponse(Number(surveyId), formData);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <h2 className="font-display text-xl font-semibold mb-2">Thank you!</h2>
        <p className="text-muted text-sm mb-6">Your response to "{survey.name}" has been submitted.</p>
        <button onClick={() => navigate('/')} className="text-sm font-medium text-burgundy-dark hover:underline">
          Back to surveys
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-1">{survey.name}</h2>
      <ProgressBar current={Math.min(step + 1, questions.length + 1)} total={questions.length + 1} />

      {error && <div className="mb-4 rounded-lg bg-red-50 text-danger text-sm px-3 py-2 mt-4">{error}</div>}

      <div className="rounded-xl border border-border bg-surface p-6 mt-4 min-h-[220px]">
        {isReview ? (
          <ReviewStep questions={questions} answers={answers} files={files} />
        ) : (
          <QuestionStep
            question={currentQuestion}
            value={answers[currentQuestion.name]}
            fileList={files[currentQuestion.name]}
            showError={!!touched[currentQuestion.name] && currentQuestion.required && !isAnswered(currentQuestion)}
            onChange={(v) => setAnswer(currentQuestion.name, v)}
            onFilesChange={(list) => setQuestionFiles(currentQuestion.name, list)}
          />
        )}
      </div>

      <div className="flex justify-between mt-6">
        {step > 0 ? (
          <button onClick={goPrev} className="text-sm font-medium text-slate-600 px-4 py-2.5">
            Previous
          </button>
        ) : (
          <span />
        )}

        {isReview ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-5 py-2.5 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit response'}
          </button>
        ) : (
          <button onClick={goNext} className="rounded-lg brand-gradient text-white text-sm font-medium px-5 py-2.5">
            Next
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full brand-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted mt-1.5">
        Step {current} of {total}
      </p>
    </div>
  );
}

function QuestionStep({
  question,
  value,
  fileList,
  showError,
  onChange,
  onFilesChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  fileList: File[] | undefined;
  showError: boolean;
  onChange: (v: string | string[]) => void;
  onFilesChange: (list: FileList | null) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">
        {question.text}
        {question.required && <span className="text-danger ml-1">*</span>}
      </label>
      {question.description && <p className="text-sm text-muted mb-3">{question.description}</p>}

      <QuestionInput question={question} value={value} fileList={fileList} onChange={onChange} onFilesChange={onFilesChange} />

      {showError && <p className="text-sm text-danger mt-2">This question is required.</p>}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  fileList,
  onChange,
  onFilesChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  fileList: File[] | undefined;
  onChange: (v: string | string[]) => void;
  onFilesChange: (list: FileList | null) => void;
}) {
  const inputClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy';

  switch (question.type) {
    case 'short_text':
    case 'email':
      return (
        <input
          type={question.type === 'email' ? 'email' : 'text'}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
    case 'long_text':
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={inputClass}
        />
      );
    case 'single_choice':
      return (
        <div className="space-y-2">
          {question.options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={question.name}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    case 'multiple_choice': {
      const selected = (value as string[]) || [];
      return (
        <div className="space-y-2">
          {question.options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, o.value]);
                  else onChange(selected.filter((v) => v !== o.value));
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    case 'file_upload':
      return (
        <div>
          <input
            type="file"
            multiple={question.fileMultiple}
            accept={question.fileFormat}
            onChange={(e) => onFilesChange(e.target.files)}
            className="text-sm"
          />
          {question.fileMaxSize && (
            <p className="text-xs text-muted mt-1">Max {question.fileMaxSize} per file · {question.fileFormat}</p>
          )}
          {fileList && fileList.length > 0 && (
            <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
              {fileList.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>
      );
    default:
      return null;
  }
}

function ReviewStep({ questions, answers, files }: { questions: Question[]; answers: Answers; files: Files }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold mb-4">Review your answers</h3>
      <dl className="divide-y divide-border">
        {questions.map((q) => (
          <div key={q.name} className="py-3">
            <dt className="text-sm font-medium text-slate-700">{q.text}</dt>
            <dd className="text-sm text-muted mt-1">{renderAnswer(q, answers, files)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function renderAnswer(q: Question, answers: Answers, files: Files): string {
  if (q.type === 'file_upload') {
    const list = files[q.name] || [];
    return list.length ? list.map((f) => f.name).join(', ') : 'No file uploaded';
  }
  const v = answers[q.name];
  if (Array.isArray(v)) {
    const labels = v.map((val) => q.options.find((o) => o.value === val)?.label ?? val);
    return labels.length ? labels.join(', ') : 'Not answered';
  }
  if (q.type === 'single_choice' && v) {
    return q.options.find((o) => o.value === v)?.label ?? v;
  }
  return v || 'Not answered';
}
