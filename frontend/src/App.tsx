import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import SqlReports from './components/SqlReports';
import Footer from './components/Footer';
import RoktoBot from './components/RoktoBot';
import Toast from './components/Toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import CreateRequest from './pages/CreateRequest';
import RequestsPage from './pages/RequestsPage';
import RequestDetail from './pages/RequestDetail';
import DonorRegisterPage from './pages/DonorRegisterPage';
import DonorDashboardPage from './pages/DonorDashboardPage';
import VolunteerApplyPage from './pages/VolunteerApplyPage';
import LifesaversPage from './pages/LifesaversPage';
import StaticPages from './pages/StaticPages';
import DonorsPage from './pages/DonorsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AdminVolunteersPage from './pages/AdminVolunteersPage';

const App: React.FC = () => {
  const [isBn, setIsBn] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toggleLang = () => {
    setIsBn((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('bn');
        showToast('ভাষা বাংলায় পরিবর্তিত হয়েছে');
      } else {
        document.body.classList.remove('bn');
        showToast('Language switched to English');
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col justify-between selection:bg-red-500 selection:text-white">
          <Navbar isBn={isBn} toggleLang={toggleLang} />

          <div className="flex-grow">
            <Routes>
              {/* Home */}
              <Route path="/" element={<Home isBn={isBn} onToast={showToast} />} />

              {/* How It Works */}
              <Route path="/how-it-works" element={<HowItWorksPage isBn={isBn} />} />

              {/* Authentication */}
              <Route path="/login" element={<Login isBn={isBn} onToast={showToast} />} />
              <Route path="/register" element={<Register isBn={isBn} onToast={showToast} />} />
              <Route path="/verify-email" element={<VerifyEmail isBn={isBn} onToast={showToast} />} />
              <Route path="/forgot-password" element={<ForgotPassword isBn={isBn} onToast={showToast} />} />
              <Route path="/reset-password" element={<ResetPassword isBn={isBn} onToast={showToast} />} />

              {/* Emergency Requests (Logged in & verified required to create) */}
              <Route path="/requests" element={<RequestsPage isBn={isBn} onToast={showToast} />} />
              <Route
                path="/requests/create"
                element={
                  <ProtectedRoute isBn={isBn} purpose="request">
                    <CreateRequest isBn={isBn} onToast={showToast} />
                  </ProtectedRoute>
                }
              />
              <Route path="/requests/:id" element={<RequestDetail isBn={isBn} onToast={showToast} />} />

              {/* Donors (Logged in & verified required to register/manage) */}
              <Route
                path="/donor/register"
                element={
                  <ProtectedRoute isBn={isBn} purpose="donate">
                    <DonorRegisterPage isBn={isBn} onToast={showToast} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/dashboard"
                element={
                  <ProtectedRoute isBn={isBn} purpose="dashboard">
                    <DonorDashboardPage isBn={isBn} onToast={showToast} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute isBn={isBn} purpose="dashboard">
                    <DonorDashboardPage isBn={isBn} onToast={showToast} />
                  </ProtectedRoute>
                }
              />
              <Route path="/donors" element={<DonorsPage isBn={isBn} />} />

              {/* Volunteers (Rule 6: Only registered verified users can apply) */}
              <Route
                path="/volunteer/apply"
                element={
                  <ProtectedRoute isBn={isBn} purpose="volunteer">
                    <VolunteerApplyPage isBn={isBn} onToast={showToast} />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/volunteers" element={<AdminVolunteersPage isBn={isBn} onToast={showToast} />} />

              {/* Wall of Lifesavers */}
              <Route path="/lifesavers" element={<LifesaversPage isBn={isBn} />} />

              {/* SQL Reports / Query Engine */}
              <Route path="/reports" element={<SqlReports />} />

              {/* Trust & Legal Static Pages */}
              <Route path="/privacy" element={<StaticPages type="privacy" isBn={isBn} />} />
              <Route path="/terms" element={<StaticPages type="terms" isBn={isBn} />} />
              <Route path="/safety" element={<StaticPages type="safety" isBn={isBn} />} />
              <Route path="/guidelines" element={<StaticPages type="guidelines" isBn={isBn} />} />
              <Route path="/about" element={<StaticPages type="about" isBn={isBn} />} />

              {/* Fallback to home */}
              <Route path="*" element={<Home isBn={isBn} onToast={showToast} />} />
            </Routes>
          </div>

          <Footer isBn={isBn} />
          <RoktoBot isBn={isBn} />
          <Toast message={toastMsg} />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
