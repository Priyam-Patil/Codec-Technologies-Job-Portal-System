import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import JobCard from "../components/JobCard";
import kconvert from "k-convert";
import moment from "moment";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const ApplyJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [jobData, setJobData] = useState(null);
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false);

  const {
    jobs,
    backendUrl,
    userData,
    userApplications,
    fetchUserApplications,
  } = useContext(AppContext);

  const appliedJobIds = new Set(
    userApplications
      .map((item) => String(item.jobId?._id || item.jobId))
      .filter(Boolean)
  );

  const fetchJob = async () => {
    try {
      const { data } = await axios.get(backendUrl + `/api/jobs/${id}`);

      if (data.success) {
        setJobData(data.job);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const applyHandler = async () => {
    try {
      if (!userData) {
        return toast.error("Login to apply for jobs");
      }

      if (!userData.resume) {
        navigate("/applications");
        return toast.error("Upload resume to apply");
      }

      if (isAlreadyApplied) {
        return toast.error("Already Applied");
      }

      const token = await getToken();

      const { data } = await axios.post(
        backendUrl + "/api/users/apply",
        {
          jobId: jobData._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        setIsAlreadyApplied(true);
        fetchUserApplications();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const checkAlreadyApplied = () => {
    const hasApplied = userApplications.some(
      (item) => String(item.jobId?._id || item.jobId) === String(jobData?._id)
    );

    setIsAlreadyApplied(hasApplied);
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (userApplications.length > 0 && jobData) {
      checkAlreadyApplied();
    }
  }, [userApplications, jobData]);

  return jobData ? (
    <>
      <Navbar />

      <div className="min-h-screen flex flex-col py-10 container px-4 2xl:px-20 mx-auto fade-up">
        <div className="bg-white text-black rounded-3xl w-full">
          <div className="flex justify-center md:justify-between flex-wrap gap-8 px-8 md:px-14 py-16 mb-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-white border border-blue-100 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row items-center">
              <div className="h-28 w-28 bg-white rounded-3xl p-5 mr-4 max-md:mb-4 border border-gray-100 shadow-md flex items-center justify-center">
                <img
                  className="max-h-20 max-w-20 object-contain"
                  src={jobData.companyId.image}
                  alt=""
                />
              </div>

              <div className="text-center md:text-left text-neutral-700">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {jobData.title}
                </h1>

                <div className="flex flex-row flex-wrap max-md:justify-center gap-y-3 gap-4 items-center text-gray-600 mt-4">
                  <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <img src={assets.suitcase_icon} alt="" />
                    {jobData.companyId.name}
                  </span>

                  <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <img src={assets.location_icon} alt="" />
                    {jobData.location}
                  </span>

                  <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <img src={assets.person_icon} alt="" />
                    {jobData.level}
                  </span>

                  <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <img src={assets.money_icon} alt="" />
                    CTC: {kconvert.convertTo(jobData.salary)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center">
              <button
                onClick={applyHandler}
                className={`p-3 px-10 text-white rounded-xl font-medium btn-animate ${
                  isAlreadyApplied
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isAlreadyApplied ? "Already Applied" : "Apply Now"}
              </button>

              <p className="mt-2 text-gray-500">
                Posted {moment(jobData.date).fromNow()}
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
            <div className="w-full lg:w-2/3 bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="font-bold text-2xl mb-5 text-gray-900">
                Job description
              </h2>

              <div
                className="rich-text"
                dangerouslySetInnerHTML={{ __html: jobData.description }}
              ></div>

              <button
                onClick={applyHandler}
                className={`p-3 px-10 text-white rounded-xl mt-10 font-medium btn-animate ${
                  isAlreadyApplied
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isAlreadyApplied ? "Already Applied" : "Apply Now"}
              </button>
            </div>

            <div className="w-full lg:w-1/3">
              <h2 className="font-bold text-xl mb-5 text-gray-900">
                More jobs from {jobData.companyId.name}
              </h2>

              <div className="space-y-5">
                {jobs
                  .filter(
                    (job) =>
                      String(job._id) !== String(jobData._id) &&
                      job.companyId?._id === jobData.companyId._id &&
                      !appliedJobIds.has(String(job._id))
                  )
                  .slice(0, 4)
                  .map((job, index) => (
                    <JobCard key={index} job={job} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer></footer>
    </>
  ) : (
    <Loading />
  );
};

export default ApplyJob;