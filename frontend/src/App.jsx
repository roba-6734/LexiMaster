import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from  './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WordsPage from './pages/WordsPage';
import StudyPage from './pages/StudyPage';
import './App.css';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Placeholder routes for future pages */}
          <Route path="/words" element={
            <ProtectedRoute>
              <Layout>
                <WordsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/study" element={
            <ProtectedRoute>
              <Layout>
                <StudyPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/quiz" element={
            <ProtectedRoute>
              <Layout>
                <div className="mx-auto w-full max-w-7xl px-6 py-8">
                  <h1 className="text-3xl font-semibold">Quiz</h1>
                  <p className="caption mt-2">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/progress" element={
            <ProtectedRoute>
              <Layout>
                <div className="mx-auto w-full max-w-7xl px-6 py-8">
                  <h1 className="text-3xl font-semibold">Progress</h1>
                  <p className="caption mt-2">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
