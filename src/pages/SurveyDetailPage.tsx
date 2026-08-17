import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSurvey, listQuestions, type Survey } from '../api/surveys';

export default function SurveyDetailPage() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;
    Promise.all([getSurvey(Number(surveyId)), listQuestions(Number(surveyId))]).then(([s, q]) => {
      setSurvey(s);
      setQuestionCount(q.length);
      setLoading(false);
    });
  }, [surveyId]);

  if (loading) return <p className="text-muted text-sm">Loading…</p>;
  if (!survey) return <p className="text-muted text-sm">Survey not found.</p>;

  return (
    <div>
      <Link to="/" className="text-sm text-burgundy-dark hover:underline">
        &larr; All surveys
      </Link>
      <div className="mt-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold">{survey.name}</h2>
        <p className="text-muted text-sm mt-2">{survey.description}</p>
        <p className="text-sm text-slate-500 mt-4">{questionCount} question{questionCount === 1 ? '' : 's'}</p>
        <Link
          to={`/surveys/${survey.id}/form`}
          className="inline-block mt-6 rounded-lg brand-gradient text-white text-sm font-medium px-5 py-2.5"
        >
          Start survey
        </Link>
      </div>
    </div>
  );
}
