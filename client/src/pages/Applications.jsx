import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { jobsApplied } from "../assets/assets";
import moment from "moment";

const Applications = () => {
  const [isEdit, setIsEdit] = useState(false);

  return (
    <>
      <Navbar />

      <div className="container px-4 2xl:px-20 mx-auto my-10">
        <h2 className="text-xl font-semibold mb-4">Your Resume</h2>

        <div className="flex gap-2 mb-8 mt-3">
          {isEdit ? (
            <div className="flex gap-2">
              <input type="file" />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                onClick={() => setIsEdit(false)}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <a
                className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg"
                href="#"
              >
                Resume
              </a>

              <button
                className="text-gray-500 border border-gray-300 px-4 py-2 rounded-lg"
                onClick={() => setIsEdit(true)}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-4">Jobs Applied</h2>

        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 border-b">Company</th>
              <th className="text-left py-3 px-4 border-b">Job Title</th>
              <th className="text-left py-3 px-4 border-b max-sm:hidden">
                Location
              </th>
              <th className="text-left py-3 px-4 border-b max-sm:hidden">
                Date
              </th>
              <th className="text-left py-3 px-4 border-b">Status</th>
            </tr>
          </thead>

          <tbody>
            {jobsApplied.map((job, index) => (
              <tr key={index} className="border-b text-gray-700">
                <td className="py-3 px-4 flex items-center gap-3 border-b">
                  <img className="w-8 h-8" src={job.logo} alt="" />
                  {job.company}
                </td>

                <td className="py-3 px-4 border-b">{job.title}</td>

                <td className="py-3 px-4 border-b max-sm:hidden">
                  {job.location}
                </td>

                <td className="py-3 px-4 border-b max-sm:hidden">
                  {moment(job.date).format("ll")}
                </td>

                <td className="py-3 px-4 border-b">
                  <span
                    className={`px-3 py-1 rounded ${
                      job.status === "Accepted"
                        ? "bg-green-100 text-green-600"
                        : job.status === "Rejected"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
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
      <footer>
        
      </footer>
    </>
  );
};

export default Applications;