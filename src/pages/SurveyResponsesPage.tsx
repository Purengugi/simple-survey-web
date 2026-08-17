import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSurvey, listResponses, type Survey, type SurveyResponseRecord } from '../api/surveys';
import { downloadFile } from '../api/client';

const PAGE_SIZE = 10;

export default function SurveyResponsesPage() {
  const { surveyId } = useParams();
  const { token } = useAuth();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [records, setRecords] = useState<SurveyResponseRecord[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;
    getSurvey(Number(surveyId)).then(setSurvey);
  }, [surveyId]);

  useEffect(() => {
    if (!surveyId || !token) return;
    setLoading(true);
    listResponses(Number(surveyId), { page, pageSize: PAGE_SIZE, email: email || undefined }, token).then((res) => {
      setRecords(res.records);
      setLastPage(res.lastPage);
      setTotalCount(res.totalCount);
      setLoading(false);
    });
  }, [surveyId, token, page, email]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setEmail(emailInput.trim());
  }

  async function handleDownload(certificateId: number, filename: string) {
    if (!token) return;
    await downloadFile(`/api/certificates/${certificateId}`, token, filename);
  }

  if (!surveyId) return null;

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/admin/surveys" className="text-sm text-burgundy-dark hover:underline">
        &larr; All surveys
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="font-display text-2xl font-semibold">{survey?.name ?? 'Responses'}</h1>
        <p className="text-muted text-sm">{totalCount} response{totalCount === 1 ? '' : 's'} submitted</p>
      </div>

      <form onSubmit={handleFilter} className="flex gap-2 mb-6">
        <input
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Filter by email address"
          className="flex-1 max-w-xs rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy"
        />
        <button type="submit" className="rounded-lg bg-slate-800 text-white text-sm font-medium px-4 py-2">
          Filter
        </button>
        {email && (
          <button
            type="button"
            onClick={() => {
              setEmailInput('');
              setEmail('');
              setPage(1);
            }}
            className="text-sm font-medium text-slate-500 px-2"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <p className="text-muted text-sm">Loading responses…</p>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted text-sm">
          No responses found.
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.responseId} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted">Response #{r.responseId}</span>
                <span className="text-xs text-muted">{r.dateResponded}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(r.answers).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{key.replace(/_/g, ' ')}</dt>
                    <dd className="text-sm text-slate-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
              {r.certificates.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Certificates</p>
                  <div className="flex flex-wrap gap-2">
                    {r.certificates.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleDownload(c.id, c.filename)}
                        className="text-sm font-medium text-burgundy-dark hover:underline"
                      >
                        {c.filename} &darr;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {lastPage}
          </span>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
