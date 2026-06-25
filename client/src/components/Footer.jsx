import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div className="container px-4 2xl:px-20 mx-auto flex items-center justify-between gap-4 py-6 border-t border-gray-300 mt-10">
      <div className="flex items-center gap-4">
        <img className="h-8" src={assets.logo} alt="" />

        <p className="text-gray-500 text-sm border-l border-gray-400 pl-4 max-sm:hidden">
          All rights reserved. Copyright @job-portal
        </p>
      </div>

      <div className="flex items-center gap-4">
        <img
          className="h-6 w-6 cursor-pointer"
          src={assets.facebook_icon}
          alt=""
        />
        <img
          className="h-6 w-6 cursor-pointer"
          src={assets.twitter_icon}
          alt=""
        />
        <img
          className="h-6 w-6 cursor-pointer"
          src={assets.instagram_icon}
          alt=""
        />
      </div>
    </div>
  );
};

export default Footer;