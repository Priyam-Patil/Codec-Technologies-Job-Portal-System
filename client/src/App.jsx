import { lazy, Suspense, useContext } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ApplyJob from "./pages/ApplyJob";
import Applications from "./pages/Applications";
import RecruiterLogin from "./components/RecruiterLogin";
import { AppContext } from "./context/AppContext";

import Dashboard from "./pages/Dashboard";
const AddJob = lazy(() => import('./pages/AddJob'));
const ManageJobs = lazy(() => import('./pages/ManageJobs'));
const ViewApplications = lazy(() => import('./pages/ViewApplications'));
const CandidateHub = lazy(() => import('./pages/CandidateHub'));
const Analytics = lazy(() => import('./pages/Analytics'));
const EditJob = lazy(() => import('./pages/EditJob'));
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import "quill/dist/quill.snow.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CandidateProtectedRoute({ children }) {
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search + location.hash);
  return <><SignedIn>{children}</SignedIn><SignedOut><Navigate to={'/candidate-login?next=' + next} replace /></SignedOut></>;
}

function CandidateLoginPage() {
  const location = useLocation();
  let next = '/';
  try {
    const requested = new URL(new URLSearchParams(location.search).get('next') || '/', window.location.origin);
    if (requested.origin === window.location.origin && ['/career', '/applications'].includes(requested.pathname)) next = requested.pathname + requested.search + requested.hash;
  } catch { /* Invalid return locations use the public homepage. */ }
  return <><SignedIn><Navigate to={next} replace /></SignedIn><SignedOut><div className="panel m-8"><p>{next.startsWith('/applications') ? 'Sign in to view your applications and upload a resume.' : 'Sign in to open your career hub.'}</p><SignInButton mode="modal" forceRedirectUrl={next}><button className="primary-button mt-4">Sign in</button></SignInButton><a href="/" className="secondary-button ml-3">Browse jobs</a></div></SignedOut></>;
}

const App = () => {
  const { showRecruiterLogin, companyToken, companyData, companyError, fetchCompanyData } = useContext(AppContext);

  return (
    <div>
      {showRecruiterLogin && <RecruiterLogin />}

      <ToastContainer position="bottom-right" autoClose={3500} closeOnClick />

      <Suspense fallback={<div className="panel m-8" role="status">Loading page…</div>}><Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply-job/:id" element={<ApplyJob />} />
        <Route path="/applications" element={<CandidateProtectedRoute><Applications /></CandidateProtectedRoute>} />
        <Route path="/career" element={<CandidateProtectedRoute><CandidateHub /></CandidateProtectedRoute>} />
        <Route path="/candidate-login" element={<CandidateLoginPage />} />

        <Route
          path="/dashboard"
          element={companyToken ? companyData ? <Dashboard /> : <div className="panel m-8" role={companyError ? 'alert' : 'status'}>{companyError || 'Verifying recruiter session…'}{companyError && <button className="secondary-button ml-3" onClick={fetchCompanyData}>Retry</button>}</div> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="edit-job/:id" element={<EditJob />} />
          <Route path="add-job" element={<AddJob />} />
          <Route path="manage-jobs" element={<ManageJobs />} />
          <Route path="view-applications" element={<ViewApplications />} />
        </Route>
        <Route path="*" element={<div className="panel m-8"><h1 className="text-2xl font-bold">Page not found</h1><a className="text-blue-700 underline" href="/">Explore jobs</a></div>} />
      </Routes></Suspense>
    </div>
  );
};

export default App;
