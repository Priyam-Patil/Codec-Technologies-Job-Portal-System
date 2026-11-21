import { useContext, useState } from 'react';
import axios from '../lib/api';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

export default function InterviewForm({ application, onUpdate }) {
  const { backendUrl, companyToken } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const interview = application.interview;
  const localDate = interview?.scheduledAt ? new Date(new Date(interview.scheduledAt).getTime() - new Date(interview.scheduledAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  const save = async event => {
    event.preventDefault(); setSaving(true);
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      fields.scheduledAt = new Date(fields.scheduledAt).toISOString();
      const { data } = await axios.put(backendUrl + '/api/company/interviews/' + application._id, fields, { headers: { token: companyToken } });
      if (!data.success) throw new Error(data.message);
      onUpdate(data.application); setOpen(false); toast.success(data.message);
      if (data.notification === 'failed') toast.info('Interview saved; email could not be sent.');
    } catch (error) { toast.error(error.response?.data?.message || error.message); }
    finally { setSaving(false); }
  };
  return <div className="mt-3 min-w-48"><button className="text-sm text-blue-700 underline" onClick={() => setOpen(value => !value)} aria-expanded={open}>{interview?.scheduledAt ? 'Update interview' : 'Schedule interview'}</button>
    {interview?.scheduledAt && <p className="text-sm text-slate-600 mt-2">{new Date(interview.scheduledAt).toLocaleString()} · {interview.status}</p>}
    {open && <form onSubmit={save} className="space-y-3 mt-3 p-3 rounded-xl bg-slate-50">
      <label className="field-label">Date & time ({Intl.DateTimeFormat().resolvedOptions().timeZone})<input className="field" type="datetime-local" name="scheduledAt" required defaultValue={localDate} /></label>
      <label className="field-label">Meeting details<textarea aria-label="Meeting details" className="field" name="meetingDetails" maxLength={2000} required defaultValue={interview?.meetingDetails || ''} placeholder="Meeting URL, location or instructions" /></label>
      <label className="field-label">Interview status<select aria-label="Interview status" className="field" name="status" defaultValue={interview?.status || 'Scheduled'}>{['Scheduled', 'Completed', 'Cancelled'].map(status => <option key={status}>{status}</option>)}</select></label>
      <button className="primary-button text-sm" disabled={saving}>{saving ? 'Saving…' : 'Save interview'}</button>
    </form>}
  </div>;
}
