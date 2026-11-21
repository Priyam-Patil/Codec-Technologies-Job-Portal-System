import { useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';

export default function CandidateHub() {
  const { user } = useUser();
  const { userData, setUserData, userError, fetchUserData, candidateRequest, savedJobs, jobs } = useContext(AppContext);
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'analysis' ? 'Resume analysis' : 'Matches');
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    candidateRequest('/recommendations' + (jobId ? '?jobId=' + jobId : ''))
      .then(data => { if (active) { setError(''); setResult(data); } })
      .catch(error => { if (active) setError(error.response?.data?.message || error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [candidateRequest, jobId, retry]);
  const saveProfile = async event => {
    event.preventDefault(); setSaving(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    fields.skills = fields.skills.split(',').map(value => value.trim()).filter(Boolean);
    try {
      const data = await candidateRequest('/profile', { method: 'PUT', data: fields });
      setUserData(data.user); setLoading(true); setError(''); setRetry(value => value + 1); toast.success(data.message);
    } catch (error) { toast.error(error.response?.data?.message || error.message); }
    finally { setSaving(false); }
  };
  return <><Navbar /><main className="container mx-auto px-4 py-10 max-w-7xl">
    <header className="career-banner"><div><p className="eyebrow">YOUR NEXT CHAPTER</p><h1 className="text-3xl sm:text-4xl font-bold mt-3">A career that fits your skills.</h1><p className="mt-3 text-blue-100 max-w-2xl">Keep your profile current, explore skill matches, and build your shortlist.</p></div><Link className="bg-white text-blue-800 rounded-xl px-5 py-3 font-semibold" to="/applications">Resume & applications</Link></header>
    <nav aria-label="Career hub" className="flex gap-2 my-7 flex-wrap">{['Matches', 'Resume analysis', 'Saved jobs', 'Profile'].map(item => <button key={item} onClick={() => setTab(item)} aria-current={tab === item ? 'page' : undefined} className={tab === item ? 'primary-button' : 'secondary-button'}>{item}</button>)}</nav>
    {tab === 'Profile' ? <section className="panel max-w-3xl"><h2 className="text-2xl font-bold">Candidate profile</h2><p className="text-slate-600 mt-2">{userData?.name || user?.fullName} · {userData?.email || user?.primaryEmailAddress?.emailAddress}</p><p className="text-sm text-slate-500 mb-6">Manage your full name and identity using the account menu. Other profile fields are stored in MongoDB.</p>
      {userData ? <form key={userData._id} onSubmit={saveProfile} className="space-y-5">
        <label className="field-label">Skills (comma separated)<input className="field" name="skills" maxLength={3000} defaultValue={userData.skills?.join(', ')} placeholder="React, Node.js, MongoDB" /></label>
        {['education', 'experience'].map(field => <label key={field} className="field-label capitalize">{field}<textarea aria-label={field} className="field min-h-28" maxLength={5000} name={field} defaultValue={userData[field]} /></label>)}
        {['github', 'linkedin', 'portfolio'].map(field => <label key={field} className="field-label capitalize">{field}<input aria-label={field} className="field" type="url" name={field} maxLength={500} placeholder="https://" defaultValue={userData[field]} /></label>)}
        <button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
      </form> : <div role={userError ? 'alert' : 'status'}><p>{userError || 'Loading your candidate profile…'}</p>{userError && <button className="secondary-button mt-3" onClick={() => fetchUserData().catch(() => {})}>Retry profile</button>}</div>}</section>
      : tab === 'Saved jobs' ? <><h2 className="text-2xl font-bold mb-5">Your shortlist · {savedJobs.length}</h2>{savedJobs.length ? <div className="job-grid">{savedJobs.map(job => <JobCard key={job._id} job={job} />)}</div> : <div className="panel text-center py-16"><h3 className="text-xl font-semibold">Start your shortlist</h3><p className="text-slate-600 mt-2">Use “Save job” on any listing. Hidden or removed jobs are not displayed.</p><Link to="/" className="primary-button inline-block mt-5">Explore jobs</Link></div>}</>
      : loading ? <div role="status" className="grid gap-5 sm:grid-cols-3">{[1,2,3].map(item => <div key={item} className="panel h-64 animate-pulse bg-slate-100" />)}<span className="sr-only">Loading your career insights</span></div>
      : error ? <div className="panel" role="alert"><p>{error}</p><button className="secondary-button mt-4" onClick={() => setRetry(value => value + 1)}>Retry</button></div>
      : tab === 'Resume analysis' ? <section className="panel max-w-4xl"><p className="eyebrow text-blue-700">EXPLAINABLE INSIGHTS</p><h2 className="text-2xl font-bold mt-2">Resume analysis</h2><p className="text-slate-600 mt-3">Processing: {result?.processingStatus}. PDF text is processed locally on the server and discarded; only extracted skills and summary metadata are retained. No external AI service receives your resume.</p>
        <h3 className="font-semibold mt-6 mb-3">Skills extracted from your PDF</h3><div className="flex flex-wrap gap-2">{result?.analysis?.skills?.length ? result.analysis.skills.map(skill => <span key={skill} className="skill-chip">{skill}</span>) : <p>Upload a text-based PDF with an explicit skills section. Profile skills are used separately for job matching.</p>}</div>
        <p className="mt-5 text-slate-600">Explicit years-of-experience mention: {result?.analysis?.experienceYears ?? 'Not detected'}. This is a text hint; it does not calculate or verify employment history.</p>
        <ul className="list-disc pl-5 mt-5 space-y-2 text-slate-600">{result?.analysis?.suggestions?.map(suggestion => <li key={suggestion}>{suggestion}</li>)}</ul>
        <label className="field-label mt-7">Compare with a job<select aria-label="Compare with a job" className="field" value={jobId} onChange={event => { setLoading(true); setError(''); setJobId(event.target.value); }}><option value="">Choose a job</option>{jobs.map(job => <option key={job._id} value={job._id}>{job.title}</option>)}</select></label>
        {result?.comparison && <div className="mt-5 rounded-xl bg-slate-50 p-5"><h3 className="font-semibold">{result.comparison.title} · {result.comparison.score == null ? 'No recognized requirements' : `${result.comparison.score}% skill coverage`}</h3><p className="mt-2">Matching: {result.comparison.matchingSkills.join(', ') || 'None detected'}</p><p className="mt-2">Missing: {result.comparison.missingSkills.join(', ') || 'None detected'}</p><p className="text-sm text-slate-500 mt-3">Tailor your project examples to relevant requirements. Add skills only when you can support them.</p></div>}
      </section> : <><div className="flex justify-between items-end gap-5 mb-5"><div><h2 className="text-2xl font-bold">Jobs matched to your skills</h2><p className="text-slate-600 mt-2">Score = matched recognized job skills ÷ recognized job skills × 100. An explainable heuristic, never a hiring probability.</p></div></div>
        {result?.fallback && <p className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">{result.fallback}</p>}
        {result?.recommendations?.length ? <div className="job-grid">{result.recommendations.map(item => <article key={item.job._id} className="space-y-3"><div className="rounded-xl bg-indigo-50 px-4 py-3"><p className="font-semibold text-indigo-800">{item.score == null ? 'Requirements not recognized' : `${item.score}% skill coverage`}</p><p className="text-sm mt-2">Matching: {item.matchingSkills.join(', ') || 'None detected'}</p><p className="text-sm mt-1 text-slate-600">Missing: {item.missingSkills.join(', ') || 'None detected'}</p></div><JobCard job={item.job} /></article>)}</div> : <div className="panel">No unapplied jobs are available right now. Check back for new roles.</div>}
      </>}
  </main></>;
}
