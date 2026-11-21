import { createContext, useCallback, useEffect, useState } from 'react';
import axios from '../lib/api';
import { toast } from 'react-toastify';
import { useAuth, useUser } from '@clerk/clerk-react';

// Kept in this module for backward-compatible imports from existing pages.
// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();
export const AppContextProvider = ({ children }) => {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <div className="panel m-8" role="status">Loading your session…</div>;
  return <AppContextState key={user?.id || 'guest'}>{children}</AppContextState>;
};
const AppContextState = ({ children }) => {
  const backendUrl = String(import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/+$/, '');
  const { user } = useUser();
  const { getToken } = useAuth();
  const [searchFilter, setSearchFilter] = useState({ title: '', location: '' });
  const [isSearched, setIsSearched] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);
  const [companyToken, setCompanyToken] = useState(localStorage.getItem('companyToken'));
  const [companyData, setCompanyData] = useState(null);
  const [companyError, setCompanyError] = useState('');
  const [userData, setUserData] = useState(null);
  const [userError, setUserError] = useState('');
  const [userLoading, setUserLoading] = useState(Boolean(user));
  const [userApplications, setUserApplications] = useState([]);
  const [applicationsError, setApplicationsError] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const candidateRequest = useCallback(async (path, options = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to continue');
    const { data } = await axios({ url: backendUrl + '/api/users' + path, ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` } });
    if (!data.success) throw new Error(data.message);
    return data;
  }, [backendUrl, getToken]);
  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/jobs');
      if (!data.success) throw new Error(data.message);
      setJobs(data.jobs);
      setJobsError('');
    } catch (error) { setJobsError(error.response?.data?.message || error.message); }
    finally { setJobsLoading(false); }
  }, [backendUrl]);
  const logoutCompany = useCallback(() => {
    localStorage.removeItem('companyToken'); setCompanyToken(null); setCompanyData(null);
  }, []);
  const fetchCompanyData = useCallback(async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/company/company', { headers: { token: companyToken } });
      if (!data.success) throw new Error(data.message);
      setCompanyData(data.company);
      setCompanyError('');
    } catch (error) {
      if (error.response?.status === 401) logoutCompany();
      setCompanyError(error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendUrl, companyToken, logoutCompany]);
  const fetchUserData = useCallback(async () => {
    try { const data = await candidateRequest('/user'); setUserData(data.user); setUserError(''); return data.user; }
    catch (error) { setUserError(error.response?.data?.message || error.message); throw error; }
    finally { setUserLoading(false); }
  }, [candidateRequest]);
  const fetchUserApplications = useCallback(async () => {
    try { setUserApplications([...(await candidateRequest('/applications')).applications].reverse()); setApplicationsError(''); }
    catch (error) { setApplicationsError(error.response?.data?.message || error.message); }
  }, [candidateRequest]);
  const fetchSavedJobs = useCallback(async () => {
    try { setSavedJobs((await candidateRequest('/saved-jobs')).jobs); }
    catch (error) { toast.error(error.response?.data?.message || error.message); }
  }, [candidateRequest]);
  const toggleSavedJob = async job => {
    const saved = savedJobs.some(item => item._id === job._id);
    await candidateRequest('/saved-jobs/' + job._id, { method: saved ? 'DELETE' : 'PUT' });
    await fetchSavedJobs();
    toast.success(saved ? 'Job removed' : 'Job saved');
  };
  useEffect(() => {
    // Initial remote synchronization; loading state is also used by manual refreshes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchJobs();
  }, [fetchJobs]);
  useEffect(() => {
    // Fetch an external recruiter identity when its stored token changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (companyToken) void fetchCompanyData();
  }, [companyToken, fetchCompanyData]);
  useEffect(() => {
    let active = true;
    if (user?.id) {
      Promise.allSettled([candidateRequest('/user'), candidateRequest('/applications'), candidateRequest('/saved-jobs')])
        .then(([profile, applications, saved]) => {
          if (!active) return;
          if (profile.status === 'fulfilled') { setUserData(profile.value.user); setUserError(''); }
          else setUserError(profile.reason.response?.data?.message || profile.reason.message);
          if (applications.status === 'fulfilled') setUserApplications([...applications.value.applications].reverse());
          else setApplicationsError(applications.reason.response?.data?.message || applications.reason.message);
          if (saved.status === 'fulfilled') setSavedJobs(saved.value.jobs);
          else toast.error(saved.reason.response?.data?.message || saved.reason.message);
          setUserLoading(false);
        });
    }
    return () => { active = false; };
  }, [user?.id, candidateRequest]);
  return <AppContext.Provider value={{ searchFilter, setSearchFilter, isSearched, setIsSearched, jobs, setJobs, jobsLoading, jobsError,
    showRecruiterLogin, setShowRecruiterLogin, companyToken, setCompanyToken, companyData, setCompanyData,
    userData, setUserData, userError, userLoading, companyError, applicationsError, userApplications, setUserApplications, backendUrl, fetchJobs, fetchCompanyData,
    fetchUserData, fetchUserApplications, logoutCompany, savedJobs, fetchSavedJobs, toggleSavedJob, candidateRequest }}>{children}</AppContext.Provider>;
};
