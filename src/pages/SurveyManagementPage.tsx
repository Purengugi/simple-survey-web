import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createSurvey, deleteSurvey, listSurveys, updateSurvey, type Survey } from '../api/surveys';

export default function SurveyManagementPage() {
  const { token } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Survey | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setSurveys(await listSurveys());
    } catch (err) {
      setError('Could not load surveys.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: number) {
    if (!token) return;
    if (!confirm('Delete this survey? This also removes its questions and responses.')) return;
    await deleteSurvey(id, token);
    refresh();
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Surveys</h1>
          <p className="text-muted text-sm">Create and manage the surveys users can respond to.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-2.5"
        >
          New survey
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 text-danger text-sm px-3 py-2">{error}</div>}

      {loading ? (
        <p className="text-muted text-sm">Loading surveys…</p>
      ) : surveys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted text-sm">
          No surveys yet. Create your first one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-surface p-5 flex items-start justify-between">
              <div>
                <h2 className="font-medium">{s.name}</h2>
                <p className="text-sm text-muted mt-1">{s.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  to={`/admin/surveys/${s.id}/questions`}
                  className="text-sm font-medium text-burgundy-dark hover:underline px-2 py-1"
                >
                  Questions
                </Link>
                <Link
                  to={`/admin/surveys/${s.id}/responses`}
                  className="text-sm font-medium text-burgundy-dark hover:underline px-2 py-1"
                >
                  Responses
                </Link>
                <button onClick={() => setEditing(s)} className="text-sm font-medium text-slate-600 hover:underline px-2 py-1">
                  Edit
                </button>
                <button onClick={() => handleDelete(s.id)} className="text-sm font-medium text-danger hover:underline px-2 py-1">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SurveyFormModal
          survey={editing}
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

function SurveyFormModal({
  survey,
  onClose,
  onSaved,
}: {
  survey: Survey | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState(survey?.name ?? '');
  const [description, setDescription] = useState(survey?.description ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      if (survey) {
        await updateSurvey(survey.id, name, description, token);
      } else {
        await createSurvey(name, description, token);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-surface rounded-2xl p-6 shadow-lg">
        <h2 className="font-display text-lg font-semibold mb-4">{survey ? 'Edit survey' : 'New survey'}</h2>

        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full mb-4 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full mb-6 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy"
        />

        <div className="flex justify-end gap-2">
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
