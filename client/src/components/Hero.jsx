import React, { useContext, useRef } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Hero = () => {
  const { setSearchFilter, setIsSearched } = useContext(AppContext);

  const titleRef = useRef(null);
  const locationRef = useRef(null);

  const onSearch = () => {
    setSearchFilter({
      title: titleRef.current.value,
      location: locationRef.current.value,
    });

    setIsSearched(true);
  };

  return (
    <div className="container 2xl:px-20 mx-auto my-10 fade-up">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white py-20 text-center mx-2 rounded-3xl shadow-2xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <p className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm">
            Trusted career platform for freshers and professionals
          </p>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            Over 10,000+ jobs to apply
          </h2>

          <p className="mb-10 max-w-2xl mx-auto text-sm md:text-base font-light px-5 text-blue-50">
            Your Next Big Career Move Starts Right Here - Explore the Best Job
            Opportunities and Take the First Step Toward Your Future!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between bg-white/95 backdrop-blur-xl rounded-2xl text-gray-600 max-w-3xl px-3 py-3 mx-4 sm:mx-auto shadow-2xl gap-3">
            <div className="flex items-center gap-3 w-full px-3">
              <img className="h-5 w-5" src={assets.search_icon} alt="" />
              <input
                ref={titleRef}
                type="text"
                placeholder="Search for jobs"
                className="max-sm:text-xs p-2 rounded outline-none w-full text-gray-700 bg-transparent"
              />
            </div>

            <div className="hidden sm:block h-8 w-px bg-gray-200"></div>

            <div className="flex items-center gap-3 w-full px-3">
              <img className="h-5 w-5" src={assets.location_icon} alt="" />
              <input
                ref={locationRef}
                type="text"
                placeholder="Location"
                className="max-sm:text-xs p-2 rounded outline-none w-full text-gray-700 bg-transparent"
              />
            </div>

            <button
              onClick={onSearch}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium w-full sm:w-auto btn-animate hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-lg mx-2 mt-6 p-6 rounded-2xl flex justify-center card-hover">
        <div className="flex justify-center items-center lg:gap-8 gap-6 flex-wrap">
          <p className="font-semibold text-gray-700">Trusted by</p>
          <img className="h-6 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110" src={assets.microsoft_logo} alt="" />
          <img className="h-6 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110" src={assets.walmart_logo} alt="" />
          <img className="h-6 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110" src={assets.accenture_logo} alt="" />
          <img className="h-6 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110" src={assets.samsung_logo} alt="" />
          <img className="h-6 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110" src={assets.amazon_logo} alt="" />
          <img className="h-6 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110" src={assets.adobe_logo} alt="" />
        </div>
      </div>
    </div>
  );
};

export default Hero;