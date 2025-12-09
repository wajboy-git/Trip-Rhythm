import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HomePage } from './pages/HomePage';

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const GuestItineraryPage = lazy(() => import('./pages/GuestItineraryPage').then(m => ({ default: m.GuestItineraryPage })));
const NewTripPage = lazy(() => import('./pages/NewTripPage').then(m => ({ default: m.NewTripPage })));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage').then(m => ({ default: m.TripDetailPage })));

function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot-password" element={<Suspense fallback={<RouteLoadingFallback />}><ForgotPasswordPage /></Suspense>} />
            <Route path="reset-password" element={<Suspense fallback={<RouteLoadingFallback />}><ResetPasswordPage /></Suspense>} />
            <Route path="guest-itinerary" element={<Suspense fallback={<RouteLoadingFallback />}><GuestItineraryPage /></Suspense>} />
            <Route path="home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="new-trip" element={<Suspense fallback={<RouteLoadingFallback />}><ProtectedRoute><NewTripPage /></ProtectedRoute></Suspense>} />
            <Route path="trip/:tripId" element={<Suspense fallback={<RouteLoadingFallback />}><ProtectedRoute><TripDetailPage /></ProtectedRoute></Suspense>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
