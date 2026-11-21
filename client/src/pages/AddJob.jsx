import { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { JobCategories, JobLocations } from "../assets/assets";
import axios from "../lib/api";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const AddJob = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Beginner level");
  const [salary, setSalary] = useState(0);
  const [jobType, setJobType] = useState('Full-time');
  const [workMode, setWorkMode] = useState('Onsite');
  const [saving, setSaving] = useState(false);

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
    if (saving) return;
    setSaving(true);

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
          jobType, workMode,
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
    } finally {
      setSaving(false);
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
        <label htmlFor="job-title" className="block mb-2 font-medium text-gray-700">Job Title</label>
        <input
          id="job-title"
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
          aria-label="Job description editor"
          className="border border-gray-200 rounded-xl w-full overflow-hidden"
          ref={editorRef}
        ></div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full">
        <div className="w-full sm:w-44">
          <label htmlFor="job-category" className="block mb-2 font-medium text-gray-700">Job Category</label>

          <input
            id="job-category"
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
          <label htmlFor="job-location" className="block mb-2 font-medium text-gray-700">Job Location</label>

          <input
            id="job-location"
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
          <label htmlFor="job-level" className="block mb-2 font-medium text-gray-700">Job Level</label>
          <select
            id="job-level"
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
        <label htmlFor="job-salary" className="block mb-2 font-medium text-gray-700">Job Salary</label>
        <input
          id="job-salary"
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
        disabled={saving}
        className="bg-blue-600 text-white px-8 py-3 rounded-xl mt-2 w-32 font-medium btn-animate hover:bg-blue-700"
      >
        {saving ? 'Posting…' : 'ADD'}
      </button>
      <label className="field-label">Job type<select aria-label="Job type" className="field" value={jobType} onChange={event => setJobType(event.target.value)}>{['Full-time', 'Part-time', 'Contract', 'Internship'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="field-label">Work mode<select aria-label="Work mode" className="field" value={workMode} onChange={event => setWorkMode(event.target.value)}>{['Remote', 'Hybrid', 'Onsite'].map(value => <option key={value}>{value}</option>)}</select></label>
    </form>
  );
};

export default AddJob;
