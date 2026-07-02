import React, { useContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Dashboard = () => {
  const navigate = useNavigate();

  const { companyData, logoutCompany } = useContext(AppContext);

  const logout = () => {
    logoutCompany();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="shadow-sm bg-white/90 backdrop-blur-xl py-4 border-b border-gray-100 sticky top-0 z-30">
        <div className="px-5 flex justify-between items-center">
          <img
            onClick={() => navigate("/")}
            className="max-sm:w-32 cursor-pointer transition-all duration-300 hover:scale-105"
            src={assets.logo}
            alt=""
          />

          {companyData && (
            <div className="flex items-center gap-3">
              <p className="max-sm:hidden text-gray-700 text-sm">
                Welcome,{" "}
                <span className="font-semibold text-gray-900">
                  {companyData.name}
                </span>
              </p>

              <div className="relative group">
                <img
                  className="w-9 h-9 border border-gray-200 rounded-full cursor-pointer object-cover shadow-sm transition-all duration-300 hover:scale-105"
                  src={companyData.image}
                  alt=""
                />

                <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
                  <ul className="list-none m-0 p-2 bg-white rounded-xl border border-gray-100 text-sm shadow-xl">
                    <li
                      onClick={logout}
                      className="py-2 px-3 cursor-pointer pr-10 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-300"
                    >
                      Logout
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start">
        {/* Sidebar */}
        <div className="w-20 sm:w-64 min-h-[calc(100vh-73px)] bg-white border-r border-gray-100 shadow-sm">
          <ul className="flex flex-col pt-5">
            <NavLink
              to="/dashboard/add-job"
              className={({ isActive }) =>
                `flex items-center gap-3 py-4 px-5 border-b border-gray-100 text-sm cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-blue-50 border-r-4 border-r-blue-500 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`
              }
            >
              <img className="w-5 h-5" src={assets.add_icon} alt="" />
              <p className="max-sm:hidden">Add Job</p>
            </NavLink>

            <NavLink
              to="/dashboard/manage-jobs"
              className={({ isActive }) =>
                `flex items-center gap-3 py-4 px-5 border-b border-gray-100 text-sm cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-blue-50 border-r-4 border-r-blue-500 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`
              }
            >
              <img className="w-5 h-5" src={assets.home_icon} alt="" />
              <p className="max-sm:hidden">Manage Jobs</p>
            </NavLink>

            <NavLink
              to="/dashboard/view-applications"
              className={({ isActive }) =>
                `flex items-center gap-3 py-4 px-5 border-b border-gray-100 text-sm cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-blue-50 border-r-4 border-r-blue-500 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`
              }
            >
              <img className="w-5 h-5" src={assets.person_tick_icon} alt="" />
              <p className="max-sm:hidden">View Applications</p>
            </NavLink>
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 sm:px-8 py-6 overflow-x-auto fade-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;