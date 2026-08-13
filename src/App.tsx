import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { BrandingProvider } from './config/branding.tsx';
import { AuthProvider } from './lib/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import BrandingPreviewPage from './pages/BrandingPreviewPage';

function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <LanguageProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-slate-50">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/admin/branding" element={<BrandingPreviewPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </LanguageProvider>
      </BrandingProvider>
    </AuthProvider>
  );
}

export default App;
