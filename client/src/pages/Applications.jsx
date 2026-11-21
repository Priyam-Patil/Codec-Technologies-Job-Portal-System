import { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import moment from "moment";
import { AppContext } from "../context/AppContext";
import { useAuth } from "@clerk/clerk-react";
import axios from "../lib/api";
import { toast } from "react-toastify";
import ResumeAccess from '../components/ResumeAccess';
import { Link } from 'react-router-dom';

const Applications = () => {
  const { getToken } = useAuth();

  const [isEdit, setIsEdit] = useState(false);
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { backendUrl, userData, setUserData, userError, userLoading, applicationsError, userApplications, fetchUserData, fetchUserApplications } =
    useContext(AppContext);
  useEffect(() => {
    const refresh = () => { void fetchUserApplications(); };
    // Synchronize remote statuses on entry and when returning from the recruiter window.
    refresh();
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [fetchUserApplications]);

  const updateResume = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      if (!resume) {
        return toast.error("Please select resume");
      }
      if (resume.type !== 'application/pdf' || resume.size > 5 * 1024 * 1024) return toast.error('Choose a PDF no larger than 5 MB');

      const formData = new FormData();
      formData.append("resume", resume);

      const token = await getToken();

      const { data } = await axios.post(
        backendUrl + "/api/users/update-resume",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        if (data.user) setUserData(data.user); else await fetchUserData();
        setIsEdit(false);
        setResume(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container px-4 2xl:px-20 mx-auto my-10 fade-up">
        {userError && <div role="alert" className="panel mb-5"><p>{userError}</p><button className="secondary-button mt-3" onClick={() => fetchUserData().catch(() => {})}>Retry profile</button></div>}
        {userLoading && <p role="status">Loading your candidate profile…</p>}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Your Resume
          </h2>

          <div className="flex gap-2 mt-3">
            {isEdit || (userData && !userData.resume) ? (
              <div className="flex flex-wrap gap-3">
                <label
                  htmlFor="resumeUpload"
                  className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl mr-2 cursor-pointer font-medium hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  {resume ? resume.name : "Select Resume"}
                </label>

                <input
                  id="resumeUpload"
                  onChange={(e) => setResume(e.target.files[0])}
                  accept="application/pdf"
                  type="file"
                  hidden
                />

                <button
                  onClick={updateResume}
                  disabled={uploading}
                  className="bg-green-50 text-green-600 border border-green-200 rounded-xl px-5 py-2.5 font-medium hover:bg-green-600 hover:text-white transition-all duration-300 active:scale-95"
                >
                  {uploading ? 'Uploading…' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {userData?.resume && <ResumeAccess />}

                <button
                  className="text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-900 hover:text-white transition-all duration-300 active:scale-95"
                  onClick={() => setIsEdit(true)}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-5 text-gray-900">Jobs Applied</h2>
        <button className="secondary-button mb-5" onClick={fetchUserApplications}>Refresh applications</button>
        {applicationsError && <p role="alert" className="panel mb-5">{applicationsError}</p>}
        {userData?.resume && <section aria-label="Resume analysis summary" className="panel mb-8">
          <h2 className="text-xl font-bold">Resume analysis</h2>
          <p className="text-slate-600 mt-2">Processing: {userData.resumeAsset?.processingStatus || 'not_processed'}. Extracted from your uploaded PDF; manually entered profile skills are separate.</p>
          <div className="flex flex-wrap gap-2 mt-4">{userData.resumeAnalysis?.skills?.length ? userData.resumeAnalysis.skills.map(skill => <span key={skill} className="skill-chip">{skill}</span>) : <p>No technical skills were recognized. Try a text-based PDF with an explicit skills section or add profile skills for matching.</p>}</div>
          <p className="mt-4 text-sm text-slate-600">Experience mention: {userData.resumeAnalysis?.experienceYears ?? 'Not detected'} years. This text hint is not verified work history.</p>
          <ul className="list-disc pl-5 mt-3 text-sm text-slate-600 space-y-2">{userData.resumeAnalysis?.suggestions?.map(value => <li key={value}>{value}</li>)}</ul>
          <Link to="/career?tab=analysis" className="primary-button mt-5">Compare skills and find matching jobs</Link>
        </section>}
        <p className="text-slate-600 mb-5">Resumes: PDF, up to 5 MB and 20 pages for analysis. Scanned PDFs need manually entered profile skills.</p>
        {!userApplications.length && <div className="panel mb-5">No applications yet. Explore jobs to find your next role.</div>}

        <div className="sm:hidden space-y-4">
          {userApplications.map(application => <article key={application._id} data-testid="application-card" className="panel">
            <p className="text-sm text-slate-500">{application.companyId?.name || 'Company unavailable'}</p>
            <h3 className="font-semibold text-lg mt-1">{application.jobId?.title || 'Job unavailable'}</h3>
            <p className="text-sm text-slate-600 mt-2">{application.jobId?.location} · {moment(application.date).format('ll')}</p>
            <p className="inline-block bg-blue-50 text-blue-800 rounded-full px-3 py-1 mt-3 text-sm font-medium">{application.status}</p>
            {application.interview?.scheduledAt && <div className="mt-4 pt-4 border-t text-sm text-slate-700 whitespace-pre-wrap break-words"><p className="font-semibold">Interview · {application.interview.status}</p><p className="mt-2">{new Date(application.interview.scheduledAt).toLocaleString()}</p><p>{Intl.DateTimeFormat().resolvedOptions().timeZone}</p><p className="mt-2">{application.interview.meetingDetails}</p></div>}
          </article>)}
        </div>
        <div className="hidden sm:block overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
          <table className="min-w-full bg-white rounded-2xl overflow-hidden">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="text-left py-4 px-5 border-b">Company</th>
                <th className="text-left py-4 px-5 border-b">Job Title</th>
                <th className="text-left py-4 px-5 border-b max-sm:hidden">
                  Location
                </th>
                <th className="text-left py-4 px-5 border-b max-sm:hidden">
                  Date
                </th>
                <th className="text-left py-4 px-5 border-b">Status</th>
              </tr>
            </thead>

            <tbody>
              {userApplications.map((job, index) => (
                <tr
                  key={index}
                  className="border-b text-gray-700 hover:bg-blue-50/40 transition-all duration-300"
                >
                  <td className="py-4 px-5 flex items-center gap-3 border-b">
                    <img
                      className="w-10 h-10 rounded-xl border border-gray-100 object-contain p-1"
                      src={job.companyId?.image}
                      alt=""
                    />
                    {job.companyId?.name}
                  </td>

                  <td className="py-4 px-5 border-b">{job.jobId?.title}</td>

                  <td className="py-4 px-5 border-b max-sm:hidden">
                    {job.jobId?.location}
                  </td>

                  <td className="py-4 px-5 border-b max-sm:hidden">
                    {moment(job.date).format("ll")}
                  </td>

                  <td className="py-4 px-5 border-b">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        job.status === "Accepted"
                          ? "bg-green-50 text-green-600"
                          : job.status === "Rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-yellow-50 text-yellow-600"
                      }`}
                    >
                      {job.status}
                    </span>
                    {job.interview?.scheduledAt && <div className="text-sm text-slate-600 mt-3 whitespace-pre-wrap"><p className="font-semibold">Interview · {job.interview.status}</p><p>{new Date(job.interview.scheduledAt).toLocaleString()} ({Intl.DateTimeFormat().resolvedOptions().timeZone})</p><p>{job.interview.meetingDetails}</p></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer></footer>
    </>
  );
};

export default Applications;
