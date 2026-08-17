import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { BrandingProvider } from './config/branding';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrganisationsPage from './pages/OrganisationsPage';
import CorpIDPage from './pages/CorpIDPage';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <LanguageProvider>
      <BrandingProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-white">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/organisations" element={<ProtectedRoute><OrganisationsPage /></ProtectedRoute>} />
                  <Route path="/corpid" element={<ProtectedRoute><CorpIDPage /></ProtectedRoute>} />
                  <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </BrandingProvider>
    </LanguageProvider>
  );
}

export default App;
