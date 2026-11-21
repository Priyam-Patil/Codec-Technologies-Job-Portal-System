import { assets } from "../assets/assets";
import { Link } from 'react-router-dom';

const AppDownload = () => {
  return (
    <div className="container px-4 2xl:px-20 mx-auto my-16">
      <div className="relative max-w-6xl mx-auto bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-10 sm:p-20 rounded-lg overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-4xl font-bold mb-8 max-w-md">
            Your next opportunity, wherever you are.
          </h1>

          <div className="flex gap-4">
            <Link to="/career" className="primary-button">Open career hub</Link>
            <a href="#job-list" className="secondary-button">Explore jobs</a>
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
