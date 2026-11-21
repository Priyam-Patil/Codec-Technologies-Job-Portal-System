import { useContext, useState } from "react";
import { AppContext } from '../context/AppContext';
import { useUser, useClerk } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { savedJobs, toggleSavedJob } = useContext(AppContext);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [saving, setSaving] = useState(false);
  const saved = savedJobs.some(item => item._id === job._id);

  return (
    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm card-hover">
      <div className="flex justify-between items-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
          <img className="max-w-10 max-h-10 object-contain" src={job.companyId?.image} alt={job.companyId?.name || 'Company'} />
        </div>
        <button type="button" aria-pressed={saved} disabled={saving} className="text-sm text-blue-700 border rounded-xl px-3 py-2" onClick={async () => {
          if (!user) return openSignIn();
          setSaving(true);
          try { await toggleSavedJob(job); } catch (error) { toast.error(error.response?.data?.message || error.message); }
          finally { setSaving(false); }
        }}>{saving ? 'Saving…' : saved ? 'Saved' : 'Save job'}</button>
      </div>

      <h4 className="font-semibold text-xl mt-4 text-gray-900 line-clamp-1">
        {job.title}
      </h4>

      <div className="flex items-center gap-3 mt-3 text-xs flex-wrap">
        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-full font-medium">
          {job.location}
        </span>
        <span className="bg-purple-50 text-purple-600 border border-purple-100 px-4 py-1.5 rounded-full font-medium">
          {job.level}
        </span>
      </div>

      <p className="text-gray-500 text-sm mt-4 leading-6 min-h-20">{job.description.replace(/<[^>]*>/g, ' ').slice(0, 150)}</p>
      <p className="text-sm text-slate-600">{[job.jobType, job.workMode].filter(Boolean).join(' · ')}</p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <button
          onClick={() => {
            navigate(`/apply-job/${job._id}`);
            window.scrollTo(0, 0);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium btn-animate hover:bg-blue-700"
        >
          Apply now
        </button>

        <button
          onClick={() => {
            navigate(`/apply-job/${job._id}`);
            window.scrollTo(0, 0);
          }}
          className="text-gray-600 border border-gray-200 rounded-xl px-5 py-2.5 font-medium hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 active:scale-95"
        >
          Learn more
        </button>
      </div>
    </div>
  );
};

export default JobCard;
