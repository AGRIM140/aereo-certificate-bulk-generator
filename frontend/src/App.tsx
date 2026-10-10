import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { CreateJobPage } from './pages/CreateJobPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobHistoryPage } from './pages/JobHistoryPage';
import { CertificateGalleryPage } from './pages/CertificateGalleryPage';
import { InspectorLoading } from './components/inspector/InspectorLoading';

import { DynamicPaperBackground } from './components/layout/DynamicPaperBackground';

// Lazy-load LandingPage and CertificateInspectorPage for code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const CertificateInspectorPage = React.lazy(
  () => import('./pages/CertificateInspectorPage')
);

export function App() {
  return (
    <BrowserRouter>
      {/* Persistent Dynamic Archival Paper Background across all routes */}
      <DynamicPaperBackground />

      <Routes>
        {/* Dedicated Cinematic 3D Landing Page */}
        <Route
          path="/"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#f6f3eb]" />}>
              <LandingPage />
            </Suspense>
          }
        />

        {/* Operational Console Shell for Internal Applications */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs/new" element={<CreateJobPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/jobs/:jobId/certificates" element={<CertificateGalleryPage />} />
          <Route
            path="/certificates/:certificateId"
            element={
              <Suspense fallback={<InspectorLoading stage="loading_metadata" />}>
                <CertificateInspectorPage />
              </Suspense>
            }
          />
          <Route path="/jobs" element={<JobHistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
