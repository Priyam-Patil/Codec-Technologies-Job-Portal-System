import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext);

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanyJobApplications = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(backendUrl + "/api/company/applicants", {
        headers: {
          token: companyToken,
        },
      });

      if (data.success) {
        setApplicants(data.applications);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

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
      fetchCompanyJobApplications();
    } else {
      setLoading(false);
    }
  }, [companyToken]);

  return (
    <div className="container mx-auto p-4 fade-up">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">View Applications</h2>
        <p className="text-gray-500 text-sm mt-1">
          Review candidate applications and update their status.
        </p>
      </div>

      {loading ? (
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
                      <a
                        href={applicant.userId.resume}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl inline-flex gap-2 items-center font-medium hover:bg-blue-600 hover:text-white transition-all duration-300"
                      >
                        Resume
                        <img src={assets.resume_download_icon} alt="" />
                      </a>
                    ) : (
                      <span className="text-gray-400">No Resume</span>
                    )}
                  </td>

                  <td className="py-4 px-5 border-b relative">
                    {applicant.status === "Pending" ? (
                      <div className="relative inline-block text-left group">
                        <button className="text-gray-500 action-button px-3 py-1 rounded-lg hover:bg-gray-100 transition-all duration-300">
                          ...
                        </button>

                        <div className="z-10 hidden absolute right-0 md:left-0 top-0 mt-8 w-32 bg-white border border-gray-100 rounded-xl shadow-xl group-hover:block overflow-hidden">
                          <button
                            onClick={() =>
                              changeApplicationStatus(
                                applicant._id,
                                "Accepted"
                              )
                            }
                            className="block w-full text-left px-4 py-2 text-green-600 hover:bg-green-50 transition-all duration-200"
                          >
                            Accept
                          </button>

                          <button
                            onClick={() =>
                              changeApplicationStatus(
                                applicant._id,
                                "Rejected"
                              )
                            }
                            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-all duration-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                          applicant.status === "Accepted"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {applicant.status}
                      </span>
                    )}
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