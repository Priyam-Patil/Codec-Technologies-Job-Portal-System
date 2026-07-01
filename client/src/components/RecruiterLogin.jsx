import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";

const RecruiterLogin = () => {
  const { setShowRecruiterLogin } = useContext(AppContext);

  const [state, setState] = useState("Login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(false);
  const [isTextDataSubmitted, setIsTextDataSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmitHandler = (e) => {
    e.preventDefault();

    if (state === "Sign Up" && !isTextDataSubmitted) {
      setIsTextDataSubmitted(true);
      return;
    }

    if (state === "Sign Up" && isTextDataSubmitted && !image) {
      alert("Please upload company logo");
      return;
    }

    console.log({
      name,
      email,
      password,
      image,
    });
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center">
      <form
        onSubmit={onSubmitHandler}
        className="relative bg-white p-8 rounded-xl w-96"
      >
        <button
          type="button"
          onClick={() => setShowRecruiterLogin(false)}
          className="absolute top-4 right-4"
        >
          <img className="w-4 h-4" src={assets.cross_icon} alt="close" />
        </button>

        <h1 className="text-center text-2xl text-neutral-700 font-medium mb-2">
          Recruiter {state}
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          {state === "Login"
            ? "Welcome back! Please sign in to continue"
            : isTextDataSubmitted
            ? "Upload company logo to continue"
            : "Create your recruiter account to continue"}
        </p>

        {state === "Sign Up" && isTextDataSubmitted ? (
          <div className="flex items-center gap-4 my-10">
            <label htmlFor="image" className="cursor-pointer">
              <img
                className="w-16 h-16 object-cover rounded-full"
                src={image ? URL.createObjectURL(image) : assets.upload_area}
                alt=""
              />

              <input
                type="file"
                id="image"
                hidden
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>

            <p>
              Upload Company <br /> Logo
            </p>
          </div>
        ) : (
          <>
            {state === "Sign Up" && (
              <input
                required
                className="border border-gray-300 rounded-full w-full px-4 py-2 mb-4 outline-none"
                type="text"
                placeholder="Company Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              required
              className="border border-gray-300 rounded-full w-full px-4 py-2 mb-4 outline-none"
              type="email"
              placeholder="Email Id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative mb-4">
              <input
                required
                className="border border-gray-300 rounded-full w-full px-4 py-2 pr-16 outline-none"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm"
                >
                  {showPassword ? "Hide" : "View"}
                </button>
              )}
            </div>

            {state === "Login" && (
              <p className="text-blue-600 text-sm mb-4 cursor-pointer">
                Forgot password?
              </p>
            )}
          </>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded-full"
        >
          {state === "Login"
            ? "Login"
            : isTextDataSubmitted
            ? "Create Account"
            : "Next"}
        </button>

        {state === "Login" ? (
          <p className="text-sm text-gray-500 text-center mt-4">
            Don&apos;t have an account?{" "}
            <span
              onClick={() => {
                setState("Sign Up");
                setIsTextDataSubmitted(false);
                setPassword("");
                setShowPassword(false);
              }}
              className="text-blue-600 cursor-pointer"
            >
              Sign up
            </span>
          </p>
        ) : (
          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{" "}
            <span
              onClick={() => {
                setState("Login");
                setIsTextDataSubmitted(false);
                setPassword("");
                setShowPassword(false);
              }}
              className="text-blue-600 cursor-pointer"
            >
              Login
            </span>
          </p>
        )}
      </form>
    </div>
  );
};

export default RecruiterLogin;