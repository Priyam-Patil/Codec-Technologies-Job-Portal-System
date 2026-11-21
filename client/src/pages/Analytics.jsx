import { useContext, useEffect, useState } from 'react';
import axios from '../lib/api';
import { AppContext } from '../context/AppContext';

export default function Analytics() {
  const { backendUrl, companyToken } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    axios.get(backendUrl + '/api/company/analytics', { headers: { token: companyToken }, signal: controller.signal })
      .then(({ data }) => { if (!data.success) throw new Error(data.message); setError(''); setData(data.analytics); })
      .catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || error.message); });
    return () => controller.abort();
  }, [backendUrl, companyToken, retry]);
  if (error) return <div className="panel" role="alert">{error}<button className="secondary-button ml-3" onClick={() => setRetry(value => value + 1)}>Retry</button></div>;
  if (!data) return <div className="panel animate-pulse h-64" role="status">Loading recruiter analytics…</div>;
  const cards = [['Posted jobs', data.totalJobs], ['Active jobs', data.activeJobs], ['Inactive jobs', data.inactiveJobs], ['Applications', data.totalApplications], ['Pending', data.pending], ['Accepted', data.accepted], ['Rejected', data.rejected]];
  const max = Math.max(1, ...data.applicationsPerJob.map(job => job.count));
  return <main className="max-w-7xl"><p className="eyebrow text-blue-700">RECRUITER OVERVIEW</p><h1 className="text-3xl font-bold mt-2">Your hiring, at a glance.</h1><p className="text-slate-600 mt-3 mb-8">Live totals from your company's jobs and applications.</p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([label, count]) => <div key={label} className="panel"><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-bold mt-3 text-slate-900">{count}</p></div>)}</div>
    <section className="panel mt-7"><h2 className="font-bold text-xl">Applications by job</h2><p className="text-slate-500 text-sm mt-2 mb-6">Includes active and inactive postings. Bar lengths use the largest application count.</p>
      {data.applicationsPerJob.length ? <ul className="space-y-5">{data.applicationsPerJob.map(job => <li key={job.id}><div className="flex justify-between gap-4 text-sm mb-2"><span>{job.title}</span><strong>{job.count}</strong></div><div className="h-3 rounded-full bg-slate-100" aria-hidden="true"><div className="h-3 rounded-full bg-blue-600" style={{ width: `${100 * job.count / max}%` }} /></div></li>)}</ul> : <p>No jobs posted yet. Add your first job to begin.</p>}
    </section>
  </main>;
}
