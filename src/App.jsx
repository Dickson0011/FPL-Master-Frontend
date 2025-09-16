// src/App.jsx - Main Application with Routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { useUser } from './contexts/UserContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Players from './pages/Player';
import Insights from './pages/Insights';
import './styles/global.css';
import Fixtures from './pages/Fixtures';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useUser();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-fpl-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fpl-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useUser();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-fpl-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fpl-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes Component (needs to be inside UserProvider to use useUser)
const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-fpl-light">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/insights" element={<Insights />} />
          
          {/* Authentication Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/players" 
            element={
              <ProtectedRoute>
                <Players />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/fixtures"
            element={
              <ProtectedRoute>
                <Fixtures />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="bg-fpl-primary text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FPL AI Insights</h3>
              <p className="text-gray-300 text-sm">
                Powered by artificial intelligence to help you dominate your Fantasy Premier League mini-leagues.
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-3">Features</h4>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>AI-powered player recommendations</li>
                <li>Captaincy suggestions</li>
                <li>Differential picks analysis</li>
                <li>Fixture difficulty planning</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-3">About</h4>
              <p className="text-gray-300 text-sm">
                This app uses official FPL API data and advanced analytics to provide 
                insights for fantasy football managers.
              </p>
              <div className="mt-3 text-xs text-gray-400">
                Not affiliated with the Premier League or FPL
              </div>
            </div>
          </div>
          
          <div className="border-t border-fpl-secondary/20 mt-8 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2025 FPL AI Insights. Built for fantasy football enthusiasts.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component
export default function App() {
  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </Router>
  );
}