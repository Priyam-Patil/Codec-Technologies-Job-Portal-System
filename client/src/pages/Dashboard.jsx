import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="shadow-sm bg-white py-4 border-b">
        <div className="px-5 flex justify-between items-center">
          <img
            onClick={() => navigate("/")}
            className="max-sm:w-32 cursor-pointer"
            src={assets.logo}
            alt=""
          />

          <div className="flex items-center gap-3">
            <p className="max-sm:hidden text-gray-700 text-sm">
              Welcome, GreatStack
            </p>

            <div className="relative group">
              <img
                className="w-8 h-8 border rounded-full cursor-pointer"
                src={assets.company_icon}
                alt=""
              />

              <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
                <ul className="list-none m-0 p-2 bg-white rounded-md border text-sm shadow-md">
                  <li className="py-1 px-2 cursor-pointer pr-10 hover:bg-gray-100 rounded">
                    Logout
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start">
        {/* Sidebar */}
        <div className="w-20 sm:w-64 min-h-[calc(100vh-73px)] bg-white border-r">
          <ul className="flex flex-col pt-5">
            <NavLink
              to="/dashboard/add-job"
              className={({ isActive }) =>
                `flex items-center gap-3 py-4 px-5 border-b text-sm cursor-pointer ${
                  isActive
                    ? "bg-blue-50 border-r-4 border-r-blue-500 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <img className="w-5 h-5" src={assets.add_icon} alt="" />
              <p className="max-sm:hidden">Add Job</p>
            </NavLink>

            <NavLink
              to="/dashboard/manage-jobs"
              className={({ isActive }) =>
                `flex items-center gap-3 py-4 px-5 border-b text-sm cursor-pointer ${
                  isActive
                    ? "bg-blue-50 border-r-4 border-r-blue-500 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <img className="w-5 h-5" src={assets.home_icon} alt="" />
              <p className="max-sm:hidden">Manage Jobs</p>
            </NavLink>

            <NavLink
              to="/dashboard/view-applications"
              className={({ isActive }) =>
                `flex items-center gap-3 py-4 px-5 border-b text-sm cursor-pointer ${
                  isActive
                    ? "bg-blue-50 border-r-4 border-r-blue-500 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <img className="w-5 h-5" src={assets.person_tick_icon} alt="" />
              <p className="max-sm:hidden">View Applications</p>
            </NavLink>
          </ul>
        </div>

        {/* Main content */}
        <div className="flex-1 px-4 sm:px-8 py-6 overflow-x-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;