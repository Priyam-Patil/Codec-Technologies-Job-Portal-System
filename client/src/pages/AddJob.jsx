import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { JobCategories, JobLocations } from "../assets/assets";

const AddJob = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Bengaluru");
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Beginner level");
  const [salary, setSalary] = useState(0);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
      });
    }
  }, []);

  const onSubmitHandler = (e) => {
    e.preventDefault();

    const description = quillRef.current.root.innerHTML;

    console.log({
      title,
      description,
      category,
      location,
      level,
      salary,
    });
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="p-4 flex flex-col w-full max-w-3xl items-start gap-3 text-gray-700"
    >
      <div className="w-full max-w-lg">
        <p className="mb-2">Job Title</p>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded"
          type="text"
          placeholder="Type Here"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          required
        />
      </div>

      <div className="w-full max-w-lg">
        <p className="mb-2 my-2">Job Description</p>
        <div
          className="border border-gray-300 rounded w-full"
          ref={editorRef}
        ></div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full">
        <div className="w-full sm:w-40">
          <p className="mb-2">Job Category</p>
          <select
            className="w-full px-3 py-2 border-2 border-gray-300 rounded text-sm"
            onChange={(e) => setCategory(e.target.value)}
            value={category}
          >
            {JobCategories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <p className="mb-2">Job Location</p>
          <select
            className="w-full px-3 py-2 border-2 border-gray-300 rounded text-sm"
            onChange={(e) => setLocation(e.target.value)}
            value={location}
          >
            {JobLocations.map((location, index) => (
              <option key={index} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <p className="mb-2">Job Level</p>
          <select
            className="w-full px-3 py-2 border-2 border-gray-300 rounded text-sm"
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
        <p className="mb-2">Job Salary</p>
        <input
          min={0}
          className="w-full px-3 py-2 border border-gray-300 rounded sm:w-[120px]"
          onChange={(e) => setSalary(e.target.value)}
          value={salary}
          type="number"
          placeholder="2500"
        />
      </div>

      <button
        type="submit"
        className="bg-black text-white px-8 py-2 rounded mt-4 w-28"
      >
        ADD
      </button>
    </form>
  );
};

export default AddJob;
