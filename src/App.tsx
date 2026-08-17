import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';
import LoginPage from './pages/LoginPage';
import SurveyManagementPage from './pages/SurveyManagementPage';
import QuestionManagementPage from './pages/QuestionManagementPage';
import SurveyResponsesPage from './pages/SurveyResponsesPage';
import AvailableSurveysPage from './pages/AvailableSurveysPage';
import SurveyDetailPage from './pages/SurveyDetailPage';
import SurveyFormPage from './pages/SurveyFormPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<AvailableSurveysPage />} />
            <Route path="/surveys/:surveyId" element={<SurveyDetailPage />} />
            <Route path="/surveys/:surveyId/form" element={<SurveyFormPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/surveys" element={<SurveyManagementPage />} />
              <Route path="/admin/surveys/:surveyId/questions" element={<QuestionManagementPage />} />
              <Route path="/admin/surveys/:surveyId/responses" element={<SurveyResponsesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
