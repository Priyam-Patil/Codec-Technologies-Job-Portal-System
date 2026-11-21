import { useContext } from "react";
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

              <div className="flex items-center gap-3">
                <img className="w-9 h-9 border border-gray-200 rounded-full object-cover" src={companyData.image} alt="Company logo" />
                <button type="button" onClick={logout} className="secondary-button text-sm">Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start">
        {/* Sidebar */}
        <div className="w-16 sm:w-64 shrink-0 min-h-[calc(100vh-73px)] bg-white border-r border-gray-100 shadow-sm">
          <ul className="flex flex-col pt-5">
            <NavLink to="/dashboard/analytics" aria-label="Analytics" className="flex gap-3 py-4 px-5 border-b text-blue-700 font-semibold"><span aria-hidden="true">▤</span><span className="max-sm:hidden">Analytics</span></NavLink>
            <NavLink
              to="/dashboard/add-job"
              aria-label="Add Job"
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
              aria-label="Manage Jobs"
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
              aria-label="View Applications"
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
        <div className="flex-1 min-w-0 px-3 sm:px-8 py-6 overflow-x-auto fade-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
