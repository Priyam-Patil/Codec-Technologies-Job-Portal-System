import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "../lib/api";
import { toast } from "react-toastify";
import ResumeAccess from '../components/ResumeAccess';
import InterviewForm from '../components/InterviewForm';

const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext);

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchCompanyJobApplications = useCallback(async () => {
    try {
      setLoading(true); setLoadError('');

      const { data } = await axios.get(backendUrl + "/api/company/applicants", {
        headers: {
          token: companyToken,
        },
      });

      if (data.success) {
        setApplicants(data.applications);
      } else {
        setLoadError(data.message);
      }
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, companyToken]);

  const changeApplicationStatus = async (id, status) => {
    try {
      const { data } = await axios.put(
        backendUrl + "/api/company/change-status",
        {
          id,
          status,
        },
        {
          headers: {
            token: companyToken,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);

        setApplicants((prev) =>
          prev.map((application) =>
            application._id === id ? { ...application, status } : application
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (companyToken) {
      // Remote synchronization includes loading feedback for subsequent refreshes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCompanyJobApplications();
    } else {
      setLoading(false);
    }
  }, [companyToken, fetchCompanyJobApplications]);

  return (
    <div className="container mx-auto p-4 fade-up">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">View Applications</h2>
        <p className="text-gray-500 text-sm mt-1">
          Review candidate applications and update their status.
        </p>
      </div>

      {loadError ? <div className="panel" role="alert"><p>{loadError}</p><button className="secondary-button mt-3" onClick={fetchCompanyJobApplications}>Retry</button></div> : loading ? (
        <div className="min-h-[55vh] flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm text-center px-4">
          <div className="loader-ring"></div>
          <p className="text-gray-500 mt-4 font-medium">
            Loading applications...
          </p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="min-h-[55vh] flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
            <span className="text-3xl">📄</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">
            No Applications Found
          </h2>

          <p className="text-gray-500 mt-2 max-w-md">
            Candidates have not applied to your jobs yet. Once they apply, their
            details and resumes will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
          <table className="w-full max-w-5xl bg-white max-sm:text-sm rounded-2xl overflow-hidden">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="py-4 px-5 text-left">#</th>
                <th className="py-4 px-5 text-left">User Name</th>
                <th className="py-4 px-5 text-left max-sm:hidden">
                  Job Title
                </th>
                <th className="py-4 px-5 text-left max-sm:hidden">
                  Location
                </th>
                <th className="py-4 px-5 text-left">Resume</th>
                <th className="py-4 px-5 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {applicants.map((applicant, index) => (
                <tr
                  key={applicant._id}
                  className="text-gray-700 hover:bg-blue-50/40 transition-all duration-300"
                >
                  <td className="py-4 px-5 border-b">{index + 1}</td>

                  <td className="py-4 px-5 border-b">
                    <div className="flex items-center">
                      <img
                        className="w-10 h-10 rounded-full mr-3 max-sm:hidden border border-gray-100 object-cover"
                        src={applicant.userId?.image}
                        alt=""
                      />
                      <span className="font-medium text-gray-800">
                        {applicant.userId?.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-5 border-b max-sm:hidden">
                    {applicant.jobId?.title}
                  </td>

                  <td className="py-4 px-5 border-b max-sm:hidden">
                    {applicant.jobId?.location}
                  </td>

                  <td className="py-4 px-5 border-b">
                    {applicant.userId?.resume ? (
                      <ResumeAccess applicationId={applicant._id} />
                    ) : (
                      <span className="text-gray-400">No Resume</span>
                    )}
                  </td>

                  <td className="py-4 px-5 border-b relative">
                    <label className="field-label">Application status<select aria-label="Application status" className="field" value={applicant.status} onChange={event => changeApplicationStatus(applicant._id, event.target.value)}>{['Pending', 'Accepted', 'Rejected'].map(status => <option key={status}>{status}</option>)}</select></label>
                    <InterviewForm application={applicant} onUpdate={updated => setApplicants(previous => previous.map(item => item._id === updated._id ? { ...item, interview: updated.interview } : item))} />

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;
