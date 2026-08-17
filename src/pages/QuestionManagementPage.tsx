import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createQuestion,
  deleteQuestion,
  getSurvey,
  listQuestions,
  updateQuestion,
  type Question,
  type QuestionOption,
  type QuestionType,
  type Survey,
} from '../api/surveys';

const TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  email: 'Email',
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  file_upload: 'File Upload',
};

export default function QuestionManagementPage() {
  const { surveyId } = useParams();
  const { token } = useAuth();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    if (!surveyId) return;
    setLoading(true);
    const [s, q] = await Promise.all([getSurvey(Number(surveyId)), listQuestions(Number(surveyId))]);
    setSurvey(s);
    setQuestions(q);
    setLoading(false);
  }

  useEffect(() => {
    refresh();

  }, [surveyId]);

  async function handleDelete(questionId: number) {
    if (!token || !surveyId) return;
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(Number(surveyId), questionId, token);
    refresh();
  }

  if (!surveyId) return null;

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/admin/surveys" className="text-sm text-burgundy-dark hover:underline">
        &larr; All surveys
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{survey?.name ?? 'Questions'}</h1>
          <p className="text-muted text-sm">Add, edit, and reorder the questions in this survey.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-2.5"
        >
          Add question
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading questions…</p>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted text-sm">
          No questions yet. Add the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block text-xs font-medium text-burgundy-dark bg-burgundy-light rounded-full px-2 py-0.5 mb-2">
                    {TYPE_LABELS[q.type]}
                    {q.required ? ' · required' : ''}
                  </span>
                  <h2 className="font-medium">{q.text}</h2>
                  {q.description && <p className="text-sm text-muted mt-1">{q.description}</p>}
                  {q.options.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {q.options.map((o) => (
                        <li key={o.value} className="text-xs bg-slate-100 rounded-full px-2 py-0.5 text-slate-600">
                          {o.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(q)} className="text-sm font-medium text-slate-600 hover:underline px-2 py-1">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="text-sm font-medium text-danger hover:underline px-2 py-1">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <QuestionFormModal
          surveyId={Number(surveyId)}
          question={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function QuestionFormModal({
  surveyId,
  question,
  onClose,
  onSaved,
}: {
  surveyId: number;
  question: Question | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState(question?.name ?? '');
  const [type, setType] = useState<QuestionType>(question?.type ?? 'short_text');
  const [text, setText] = useState(question?.text ?? '');
  const [description, setDescription] = useState(question?.description ?? '');
  const [required, setRequired] = useState(question?.required ?? true);
  const [options, setOptions] = useState<QuestionOption[]>(question?.options ?? []);
  const [fileFormat, setFileFormat] = useState(question?.fileFormat ?? '.pdf');
  const [fileMaxSize, setFileMaxSize] = useState(1);
  const [fileMultiple, setFileMultiple] = useState(question?.fileMultiple ?? true);
  const [saving, setSaving] = useState(false);

  const isChoice = type === 'single_choice' || type === 'multiple_choice';
  const isFile = type === 'file_upload';

  function addOption() {
    setOptions([...options, { value: '', label: '' }]);
  }
  function updateOption(idx: number, field: 'value' | 'label', value: string) {
    setOptions(options.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  }
  function removeOption(idx: number) {
    setOptions(options.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    const input = {
      name,
      type,
      required,
      text,
      description,
      options: isChoice ? options : undefined,
      fileFormat: isFile ? fileFormat : undefined,
      fileMaxSize: isFile ? fileMaxSize : undefined,
      fileMaxSizeUnit: 'mb',
      fileMultiple: isFile ? fileMultiple : undefined,
    };
    try {
      if (question) {
        await updateQuestion(surveyId, question.id, input, token);
      } else {
        await createQuestion(surveyId, input, token);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-surface rounded-2xl p-6 shadow-lg my-8">
        <h2 className="font-display text-lg font-semibold mb-4">{question ? 'Edit question' : 'Add question'}</h2>

        <label className="block text-sm font-medium text-slate-700 mb-1">Key name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. full_name"
          required
          disabled={!!question}
          className="w-full mb-4 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy disabled:bg-slate-50"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Question type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          disabled={!!question}
          className="w-full mb-4 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy disabled:bg-slate-50"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium text-slate-700 mb-1">Question text</label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          className="w-full mb-4 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Helper text (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-4 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy"
        />

        <label className="flex items-center gap-2 mb-4 text-sm text-slate-700">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Required
        </label>

        {isChoice && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Options</span>
              <button type="button" onClick={addOption} className="text-xs font-medium text-burgundy-dark hover:underline">
                + Add option
              </button>
            </div>
            <div className="space-y-2">
              {options.map((o, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={o.value}
                    onChange={(e) => updateOption(idx, 'value', e.target.value)}
                    placeholder="VALUE"
                    required
                    className="w-28 rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    value={o.label}
                    onChange={(e) => updateOption(idx, 'label', e.target.value)}
                    placeholder="Label shown to users"
                    required
                    className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                  <button type="button" onClick={() => removeOption(idx)} className="text-danger text-sm px-1">
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isFile && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allowed format</label>
              <input
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max size (MB)</label>
              <input
                type="number"
                min={1}
                value={fileMaxSize}
                onChange={(e) => setFileMaxSize(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
              <input type="checkbox" checked={fileMultiple} onChange={(e) => setFileMultiple(e.target.checked)} />
              Allow multiple files
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-600 px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
