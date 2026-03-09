import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SubjectBrowser } from './pages/SubjectBrowser';
import { SubjectOverview } from './pages/SubjectOverview';
import { TopicPage } from './pages/TopicPage';
import { EntryPage } from './pages/EntryPage';
import { ProblemPage } from './pages/ProblemPage';
import { ValidationErrorsPage } from './pages/ValidationErrorsPage';
import { SearchPage } from './pages/SearchPage';
import { TrainingPage } from './pages/TrainingPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { ImportPage } from './pages/ImportPage';
import { ProgressPage } from './pages/ProgressPage';
import { LoginPage } from './pages/LoginPage';

import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './hooks/useAuth';
import { KnowledgeDataProvider } from './hooks/useKnowledgeData';
import { ProgressProvider } from './hooks/useProgress';
import { RequireAdmin } from './components/auth/RequireAdmin';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <KnowledgeDataProvider>
          <ProgressProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/study" element={<TrainingPage />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/subjects" element={<SubjectBrowser />} />
                <Route path="/subjects/:subjectId" element={<SubjectOverview />} />
                <Route path="/topics/:topicId" element={<TopicPage />} />
                <Route path="/entries/:entryId" element={<EntryPage />} />
                <Route path="/problems/:problemId" element={<ProblemPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/review-queue" element={<ReviewQueuePage />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/errors" element={<ValidationErrorsPage />} />
                  <Route path="/import" element={<ImportPage />} />
                </Route>
              </Route>
            </Routes>
          </ProgressProvider>
        </KnowledgeDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
