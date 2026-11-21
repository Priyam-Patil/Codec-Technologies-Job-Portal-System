import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../lib/api';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, companyToken, fetchJobs } = useContext(AppContext);
  const [result, setResult] = useState({});
  const [retry, setRetry] = useState(0);
  const requestKey = `${id}:${retry}`;
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    axios.get(backendUrl + '/api/company/list-jobs', { headers: { token: companyToken }, signal: controller.signal })
      .then(({ data }) => { const found = data.jobsData?.find(job => job._id === id); if (!data.success || !found) throw new Error(data.message || 'Job unavailable'); setResult({ key: requestKey, job: found }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ key: requestKey, error: error.response?.data?.message || error.message }); });
    return () => controller.abort();
  }, [id, backendUrl, companyToken, requestKey]);
  if (result.key !== requestKey) return <p role="status">Loading job…</p>;
  if (result.error) return <div className="panel" role="alert"><p>{result.error}</p><button className="secondary-button mt-3" onClick={() => setRetry(value => value + 1)}>Retry</button><button className="secondary-button mt-3 ml-3" onClick={() => navigate('/dashboard/manage-jobs')}>Back to jobs</button></div>;
  const job = result.job;
  const save = async event => {
    event.preventDefault(); setSaving(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const { data } = await axios.put(backendUrl + '/api/company/jobs/' + id, fields, { headers: { token: companyToken } });
      if (!data.success) throw new Error(data.message);
      await fetchJobs(); toast.success('Job updated'); navigate('/dashboard/manage-jobs');
    } catch (error) { toast.error(error.response?.data?.message || error.message); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className="panel max-w-3xl space-y-5"><h1 className="text-2xl font-bold">Edit job</h1>
    {['title', 'location', 'category', 'level'].map(field => <label key={field} className="field-label capitalize">{field}<input required name={field} maxLength={200} className="field" defaultValue={job[field]} /></label>)}
    <label className="field-label">Description (basic HTML supported)<textarea aria-label="Description (basic HTML supported)" required name="description" maxLength={50000} className="field min-h-64" defaultValue={job.description} /></label>
    <label className="field-label">Salary (existing CTC units)<input required type="number" name="salary" min="0" className="field" defaultValue={job.salary} /></label>
    <label className="field-label">Job type<select aria-label="Job type" name="jobType" className="field" defaultValue={job.jobType || 'Full-time'}>{['Full-time', 'Part-time', 'Contract', 'Internship'].map(value => <option key={value}>{value}</option>)}</select></label>
    <label className="field-label">Work mode<select aria-label="Work mode" name="workMode" className="field" defaultValue={job.workMode || 'Onsite'}>{['Remote', 'Hybrid', 'Onsite'].map(value => <option key={value}>{value}</option>)}</select></label>
    <button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button><button type="button" className="secondary-button ml-3" onClick={() => navigate('/dashboard/manage-jobs')}>Cancel</button>
  </form>;
}
