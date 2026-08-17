import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSurveys, type Survey } from '../api/surveys';

export default function AvailableSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSurveys()
      .then(setSurveys)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-1">Available surveys</h2>
      <p className="text-muted text-sm mb-6">Pick a survey below to get started.</p>

      {loading ? (
        <p className="text-muted text-sm">Loading surveys…</p>
      ) : surveys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted text-sm">
          No surveys are available right now. Check back soon.
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => (
            <Link
              key={s.id}
              to={`/surveys/${s.id}`}
              className="block rounded-xl border border-border bg-surface p-5 hover:border-burgundy transition"
            >
              <h3 className="font-medium">{s.name}</h3>
              <p className="text-sm text-muted mt-1">{s.description}</p>
              <span className="inline-block mt-3 text-sm font-medium text-burgundy-dark">Start survey &rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
