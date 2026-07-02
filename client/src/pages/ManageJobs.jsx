import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const ManageJobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const { backendUrl, companyToken } = useContext(AppContext);

  const fetchCompanyJobs = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        backendUrl + "/api/company/list-jobs",
        {
          headers: {
            token: companyToken,
          },
        }
      );

      if (data.success) {
        setJobs([...data.jobsData].reverse());
        console.log(data.jobsData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeJobVisibility = async (id) => {
    try {
      const { data } = await axios.put(
        backendUrl + "/api/company/change-visibility",
        { id },
        {
          headers: {
            token: companyToken,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        fetchCompanyJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobs();
    } else {
      setLoading(false);
    }
  }, [companyToken]);

  return (
    <div className="container p-4 max-w-6xl fade-up">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Jobs</h2>
          <p className="text-gray-500 text-sm mt-1">
            Track job posts, applicants and visibility.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[55vh] flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm text-center px-4">
          <div className="loader-ring"></div>
          <p className="text-gray-500 mt-4 font-medium">
            Loading posted jobs...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="min-h-[55vh] flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
            <span className="text-3xl">💼</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">
            No Jobs Available or Posted
          </h2>

          <p className="text-gray-500 mt-2 max-w-md">
            You have not posted any jobs yet. Add your first job to start
            receiving applications from candidates.
          </p>

          <button
            onClick={() => navigate("/dashboard/add-job")}
            className="mt-6 bg-blue-600 text-white py-3 rounded-xl px-6 font-medium btn-animate hover:bg-blue-700"
          >
            Add New Job
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
            <table className="min-w-full bg-white max-sm:text-sm rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="py-4 px-5 border-b text-left max-sm:hidden">
                    #
                  </th>
                  <th className="py-4 px-5 border-b text-left">Job Title</th>
                  <th className="py-4 px-5 border-b text-left max-sm:hidden">
                    Date
                  </th>
                  <th className="py-4 px-5 border-b text-left max-sm:hidden">
                    Location
                  </th>
                  <th className="py-4 px-5 border-b text-center">
                    Applicants
                  </th>
                  <th className="py-4 px-5 border-b text-left">Visible</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job, index) => (
                  <tr
                    key={job._id}
                    className="text-gray-700 hover:bg-blue-50/40 transition-all duration-300"
                  >
                    <td className="py-4 px-5 border-b max-sm:hidden">
                      {index + 1}
                    </td>

                    <td className="py-4 px-5 border-b font-medium text-gray-800">
                      {job.title}
                    </td>

                    <td className="py-4 px-5 border-b max-sm:hidden">
                      {moment(job.date).format("ll")}
                    </td>

                    <td className="py-4 px-5 border-b max-sm:hidden">
                      {job.location}
                    </td>

                    <td className="py-4 px-5 border-b text-center">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                        {job.applicants || 0}
                      </span>
                    </td>

                    <td className="py-4 px-5 border-b">
                      <input
                        onChange={() => changeJobVisibility(job._id)}
                        className="scale-125 ml-4 accent-blue-600 cursor-pointer"
                        type="checkbox"
                        checked={job.visible}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => navigate("/dashboard/add-job")}
              className="bg-blue-600 text-white py-2.5 rounded-xl px-5 font-medium btn-animate hover:bg-blue-700"
            >
              Add new job
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageJobs;