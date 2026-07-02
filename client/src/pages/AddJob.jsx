import React, { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { JobCategories, JobLocations } from "../assets/assets";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const AddJob = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Beginner level");
  const [salary, setSalary] = useState(0);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const { backendUrl, companyToken, fetchJobs } = useContext(AppContext);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
      });
    }
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const description = quillRef.current.root.innerHTML;

      const { data } = await axios.post(
        backendUrl + "/api/company/post-job",
        {
          title,
          description,
          location,
          salary,
          category,
          level,
        },
        {
          headers: {
            token: companyToken,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);

        setTitle("");
        setSalary(0);
        quillRef.current.root.innerHTML = "";

        fetchJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col w-full max-w-4xl items-start gap-5 text-gray-700"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Add New Job</h2>
        <p className="text-gray-500 text-sm mt-1">
          Create a new job post for candidates.
        </p>
      </div>

      <div className="w-full max-w-lg">
        <p className="mb-2 font-medium text-gray-700">Job Title</p>
        <input
          className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none input-focus"
          type="text"
          placeholder="Type Here"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          required
        />
      </div>

      <div className="w-full max-w-2xl">
        <p className="mb-2 my-2 font-medium text-gray-700">Job Description</p>
        <div
          className="border border-gray-200 rounded-xl w-full overflow-hidden"
          ref={editorRef}
        ></div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full">
        <div className="w-full sm:w-44">
          <p className="mb-2 font-medium text-gray-700">Job Category</p>

          <input
            list="category-list"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none input-focus"
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            required
          />

          <datalist id="category-list">
            {JobCategories.map((category, index) => (
              <option key={index} value={category} />
            ))}
          </datalist>
        </div>

        <div className="w-full sm:w-44">
          <p className="mb-2 font-medium text-gray-700">Job Location</p>

          <input
            list="location-list"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none input-focus"
            onChange={(e) => setLocation(e.target.value)}
            value={location}
            required
          />

          <datalist id="location-list">
            {JobLocations.map((location, index) => (
              <option key={index} value={location} />
            ))}
          </datalist>
        </div>

        <div className="w-full sm:w-44">
          <p className="mb-2 font-medium text-gray-700">Job Level</p>
          <select
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none input-focus bg-white"
            onChange={(e) => setLevel(e.target.value)}
            value={level}
          >
            <option value="Beginner level">Beginner level</option>
            <option value="Intermediate level">Intermediate level</option>
            <option value="Senior level">Senior level</option>
          </select>
        </div>
      </div>

      <div>
        <p className="mb-2 font-medium text-gray-700">Job Salary</p>
        <input
          min={0}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl sm:w-[140px] outline-none input-focus"
          onChange={(e) => setSalary(e.target.value)}
          value={salary}
          type="number"
          placeholder="2500"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-8 py-3 rounded-xl mt-2 w-32 font-medium btn-animate hover:bg-blue-700"
      >
        ADD
      </button>
    </form>
  );
};

export default AddJob;