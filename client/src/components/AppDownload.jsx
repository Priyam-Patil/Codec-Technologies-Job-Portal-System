import React from "react";
import { assets } from "../assets/assets";

const AppDownload = () => {
  return (
    <div className="container px-4 2xl:px-20 mx-auto my-16">
      <div className="relative max-w-6xl mx-auto bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-10 sm:p-20 rounded-lg overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-4xl font-bold mb-8 max-w-md">
            Download Mobile App For Better Experience
          </h1>

          <div className="flex gap-4">
            <a href="#" className="inline-block">
              <img className="h-12" src={assets.play_store} alt="" />
            </a>

            <a href="#" className="inline-block">
              <img className="h-12" src={assets.app_store} alt="" />
            </a>
          </div>
        </div>

        <img
          className="absolute w-72 right-16 bottom-0 max-lg:hidden"
          src={assets.app_main_img}
          alt=""
        />
      </div>
    </div>
  );
};

export default AppDownload;
