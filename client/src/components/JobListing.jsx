import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import JobCard from "./JobCard";

const JobListing = () => {
  const { isSearched, searchFilter, setSearchFilter, jobs } =
    useContext(AppContext);

  const [showFilter, setShowFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState(jobs);

  const dynamicCategories = [
    ...new Set(jobs.map((job) => job.category).filter(Boolean)),
  ].sort();

  const dynamicLocations = [
    ...new Set(jobs.map((job) => job.location).filter(Boolean)),
  ].sort();

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleLocationChange = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  useEffect(() => {
    const matchesCategory = (job) =>
      selectedCategories.length === 0 ||
      selectedCategories.includes(job.category);

    const matchesLocation = (job) =>
      selectedLocations.length === 0 ||
      selectedLocations.includes(job.location);

    const matchesTitle = (job) =>
      searchFilter.title === "" ||
      job.title.toLowerCase().includes(searchFilter.title.toLowerCase());

    const matchesSearchLocation = (job) =>
      searchFilter.location === "" ||
      job.location.toLowerCase().includes(searchFilter.location.toLowerCase());

    const newFilteredJobs = jobs
      .slice()
      .reverse()
      .filter(
        (job) =>
          matchesCategory(job) &&
          matchesLocation(job) &&
          matchesTitle(job) &&
          matchesSearchLocation(job)
      );

    setFilteredJobs(newFilteredJobs);
    setCurrentPage(1);
  }, [jobs, selectedCategories, selectedLocations, searchFilter]);

  return (
    <div className="container 2xl:px-20 mx-auto flex flex-col lg:flex-row max-lg:space-y-8 py-10 fade-up">
      <div className="w-full lg:w-1/4 bg-white px-5 py-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
        {isSearched &&
          (searchFilter.title !== "" || searchFilter.location !== "") && (
            <>
              <h3 className="font-semibold text-lg mb-4 text-gray-800">
                Current Search
              </h3>

              <div className="mb-5 text-gray-600 flex flex-wrap gap-2">
                {searchFilter.title && (
                  <span className="inline-flex items-center gap-2.5 bg-blue-50 text-blue-600 border border-blue-100 px-4 py-2 rounded-full text-sm">
                    {searchFilter.title}
                    <img
                      onClick={() =>
                        setSearchFilter((prev) => ({ ...prev, title: "" }))
                      }
                      className="cursor-pointer w-3 h-3"
                      src={assets.cross_icon}
                      alt=""
                    />
                  </span>
                )}

                {searchFilter.location && (
                  <span className="inline-flex items-center gap-2.5 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-full text-sm">
                    {searchFilter.location}
                    <img
                      onClick={() =>
                        setSearchFilter((prev) => ({
                          ...prev,
                          location: "",
                        }))
                      }
                      className="cursor-pointer w-3 h-3"
                      src={assets.cross_icon}
                      alt=""
                    />
                  </span>
                )}
              </div>
            </>
          )}

        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="px-6 py-2 rounded-xl border border-gray-300 lg:hidden hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
        >
          {showFilter ? "Close" : "Filters"}
        </button>

        <div className={showFilter ? "" : "max-lg:hidden"}>
          <h4 className="font-semibold text-lg py-4 text-gray-800">
            Search by Categories
          </h4>

          <ul className="space-y-4 text-gray-600">
            {dynamicCategories.map((category, index) => (
              <li
                className="flex gap-3 items-center hover:text-blue-600 transition-all duration-300"
                key={index}
              >
                <input
                  className="scale-125 accent-blue-600"
                  type="checkbox"
                  onChange={() => handleCategoryChange(category)}
                  checked={selectedCategories.includes(category)}
                />
                <p>{category}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={showFilter ? "" : "max-lg:hidden"}>
          <h4 className="font-semibold text-lg py-4 pt-14 text-gray-800">
            Search by Location
          </h4>

          <ul className="space-y-4 text-gray-600">
            {dynamicLocations.map((location, index) => (
              <li
                className="flex gap-3 items-center hover:text-blue-600 transition-all duration-300"
                key={index}
              >
                <input
                  className="scale-125 accent-blue-600"
                  type="checkbox"
                  onChange={() => handleLocationChange(location)}
                  checked={selectedLocations.includes(location)}
                />
                <p>{location}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="w-full lg:w-3/4 text-gray-800 max-lg:px-4 lg:pl-8">
        <h3 className="font-bold text-3xl py-2 text-gray-900" id="job-list">
          Latest jobs
        </h3>
        <p className="mb-8 text-gray-500">
          Get your desired job from top companies
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs
            .slice((currentPage - 1) * 6, currentPage * 6)
            .map((job, index) => (
              <JobCard key={index} job={job} />
            ))}
        </div>

        {filteredJobs.length > 0 && (
          <div className="flex items-center justify-center space-x-3 mt-12">
            <a href="#job-list">
              <img
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                className="w-9 h-9 p-2 rounded-full border border-gray-200 cursor-pointer hover:bg-blue-50 transition-all duration-300"
                src={assets.left_arrow_icon}
                alt=""
              />
            </a>

            {Array.from({ length: Math.ceil(filteredJobs.length / 6) }).map(
              (_, index) => (
                <a href="#job-list" key={index}>
                  <button
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-10 h-10 flex items-center justify-center border rounded-full transition-all duration-300 ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "border-gray-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {index + 1}
                  </button>
                </a>
              )
            )}

            <a href="#job-list">
              <img
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(filteredJobs.length / 6))
                  )
                }
                className="w-9 h-9 p-2 rounded-full border border-gray-200 cursor-pointer hover:bg-blue-50 transition-all duration-300"
                src={assets.right_arrow_icon}
                alt=""
              />
            </a>
          </div>
        )}
      </section>
    </div>
  );
};

export default JobListing;