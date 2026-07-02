import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const {
    setShowRecruiterLogin,
    companyToken,
    companyData,
    logoutCompany,
  } = useContext(AppContext);

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="container px-4 2xl:px-20 mx-auto flex justify-between items-center py-4">
        <img
          onClick={() => navigate("/")}
          className="cursor-pointer transition-all duration-300 hover:scale-105"
          src={assets.logo}
          alt=""
        />

        {companyToken ? (
          <div className="flex items-center gap-4 max-sm:text-xs">
            <button
              onClick={() => navigate("/dashboard/manage-jobs")}
              className="text-gray-700 font-medium hover:text-blue-600 transition-all duration-300"
            >
              Dashboard
            </button>

            {companyData && (
              <p className="max-sm:hidden text-gray-600">
                Hi, <span className="font-semibold">{companyData.name}</span>
              </p>
            )}

            <button
              onClick={() => {
                logoutCompany();
                navigate("/");
              }}
              className="bg-red-50 text-red-600 px-5 py-2 rounded-full font-medium hover:bg-red-600 hover:text-white transition-all duration-300 active:scale-95"
            >
              Logout
            </button>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/applications"
              className="font-medium text-gray-700 hover:text-blue-600 transition-all duration-300"
            >
              Applied Jobs
            </Link>
            <p className="text-gray-300">|</p>
            <p className="max-sm:hidden text-gray-600">
              Hi,{" "}
              <span className="font-semibold">
                {user.firstName || user.emailAddresses[0].emailAddress}
              </span>
            </p>
            <UserButton />
          </div>
        ) : (
          <div className="flex gap-4 max-sm:text-xs items-center">
            <button
              onClick={() => setShowRecruiterLogin(true)}
              className="text-gray-600 font-medium hover:text-blue-600 transition-all duration-300"
            >
              Recruiter Login
            </button>

            <button
              onClick={() => openSignIn()}
              className="bg-blue-600 text-white px-6 sm:px-9 py-2 rounded-full font-medium btn-animate hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;