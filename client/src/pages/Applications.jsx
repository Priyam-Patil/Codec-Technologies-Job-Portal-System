import React, { useContext, useState } from "react";
import Navbar from "../components/Navbar";
import moment from "moment";
import { AppContext } from "../context/AppContext";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

const Applications = () => {
  const { getToken } = useAuth();

  const [isEdit, setIsEdit] = useState(false);
  const [resume, setResume] = useState(null);

  const { backendUrl, userData, userApplications, fetchUserData } =
    useContext(AppContext);

  const updateResume = async () => {
    try {
      if (!resume) {
        return toast.error("Please select resume");
      }

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
        await fetchUserData();
        setIsEdit(false);
        setResume(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container px-4 2xl:px-20 mx-auto my-10 fade-up">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Your Resume
          </h2>

          <div className="flex gap-2 mt-3">
            {isEdit || (userData && userData.resume === "") ? (
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
                  className="bg-green-50 text-green-600 border border-green-200 rounded-xl px-5 py-2.5 font-medium hover:bg-green-600 hover:text-white transition-all duration-300 active:scale-95"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <a
                  className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-medium hover:bg-blue-600 hover:text-white transition-all duration-300"
                  href={userData?.resume}
                  target="_blank"
                  rel="noreferrer"
                >
                  Resume
                </a>

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

        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
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