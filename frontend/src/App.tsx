import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InspectionProvider } from './context/InspectionContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SplashScreen } from './components/splash/SplashScreen';
import { AuthModal } from './components/auth/AuthModal';
import { Dashboard } from './pages/Dashboard';
import { BikeInformationForm } from './pages/BikeInformationForm';
import { CameraInspectionPage } from './pages/CameraInspectionPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { InspectionResultPage } from './pages/InspectionResultPage';
import { ContractSubmissionPage } from './pages/ContractSubmissionPage';
import { InspectionHistoryPage } from './pages/InspectionHistoryPage';

function AppContent() {
  const { showSplash, dismissSplash, notification, clearNotification } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FC] text-[#102A43] font-sans antialiased">
      {/* Dynamic Splash Screen inspired by Glafit Bangladesh / IRINFOSYS */}
      {showSplash && <SplashScreen onDismiss={dismissSplash} />}

      {/* Global Auth Modal for Login / Registration */}
      <AuthModal />

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-emerald-900/90 text-white border-emerald-500/40' 
              : notification.type === 'error'
              ? 'bg-rose-900/90 text-white border-rose-500/40'
              : 'bg-[#102A43]/95 text-white border-blue-500/40'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />}
            
            <p className="text-xs font-semibold flex-1 leading-snug">{notification.message}</p>
            
            <button
              onClick={clearNotification}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-inspection" element={<BikeInformationForm />} />
          <Route path="/inspection/camera" element={<CameraInspectionPage />} />
          <Route path="/inspection/analyze" element={<AIAnalysisPage />} />
          <Route path="/inspection/result/:id" element={<InspectionResultPage />} />
          <Route path="/contract/submit/:inspectionId" element={<ContractSubmissionPage />} />
          <Route path="/history" element={<InspectionHistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <InspectionProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </InspectionProvider>
    </AuthProvider>
  );
}

export default App;
