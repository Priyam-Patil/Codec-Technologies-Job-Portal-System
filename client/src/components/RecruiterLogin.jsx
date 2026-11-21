import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import axios from "../lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const RecruiterLogin = () => {
  const navigate = useNavigate();

  const [state, setState] = useState("Login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(false);
  const [isTextDataSubmitted, setIsTextDataSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef(null);
  const [imagePreview, setImagePreview] = useState('');

  const {
    setShowRecruiterLogin,
    backendUrl,
    setCompanyToken,
    setCompanyData,
  } = useContext(AppContext);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (state === "Sign Up" && !isTextDataSubmitted) {
      setIsTextDataSubmitted(true);
      return;
    }

    if (state === "Sign Up" && isTextDataSubmitted && !image) {
      toast.error("Please upload company logo");
      return;
    }
    if (state === 'Sign Up' && image && (!['image/png', 'image/jpeg', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024)) return toast.error('Choose a PNG, JPEG or WebP logo no larger than 5 MB');

    setSubmitting(true);
    try {
      if (state === "Login") {
        const { data } = await axios.post(backendUrl + "/api/company/login", {
          email,
          password,
        });

        if (data.success) {
          setCompanyData(data.company);
          setCompanyToken(data.token);
          localStorage.setItem("companyToken", data.token);
          setShowRecruiterLogin(false);
          navigate("/dashboard/manage-jobs");
        } else {
          toast.error(data.message);
        }
      } else {
        const formData = new FormData();

        formData.append("name", name);
        formData.append("password", password);
        formData.append("email", email);
        formData.append("image", image);

        const { data } = await axios.post(
          backendUrl + "/api/company/register",
          formData
        );

        if (data.success) {
          setCompanyData(data.company);
          setCompanyToken(data.token);
          localStorage.setItem("companyToken", data.token);
          setShowRecruiterLogin(false);
          navigate("/dashboard/manage-jobs");
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector('input:not([type=file])')?.focus();
    const onKey = event => {
      if (event.key === 'Escape') setShowRecruiterLogin(false);
      if (event.key !== 'Tab') return;
      const controls = [...(dialogRef.current?.querySelectorAll('button, input, a[href]') || [])].filter(node => !node.disabled && node.offsetParent !== null);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [setShowRecruiterLogin]);
  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(image);
    // Synchronize browser-owned preview URL and revoke it when replaced/unmounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center">
      <form
        ref={dialogRef}
        role="dialog" aria-modal="true" aria-label="Recruiter authentication"
        onSubmit={onSubmitHandler}
        className="relative bg-white p-8 rounded-xl w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto"
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
                src={image ? imagePreview : assets.upload_area}
                alt=""
              />

              <input
                type="file"
                id="image"
                hidden
                accept="image/png,image/jpeg,image/webp"
                aria-label="Company logo"
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
                aria-label="Company name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              required
              className="border border-gray-300 rounded-full w-full px-4 py-2 mb-4 outline-none"
              type="email"
              aria-label="Recruiter email"
              placeholder="Email Id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative mb-4">
              <input
                required
                className="border border-gray-300 rounded-full w-full px-4 py-2 pr-16 outline-none"
                type={showPassword ? "text" : "password"}
                aria-label="Recruiter password"
                minLength={state === 'Login' ? undefined : 10}
                maxLength={72}
                autoComplete={state === 'Login' ? 'current-password' : 'new-password'}
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
              <p className="text-slate-500 text-sm mb-4">
                Recruiter password recovery is not available yet.
              </p>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
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
            <button type="button"
              onClick={() => {
                setState("Sign Up");
                setIsTextDataSubmitted(false);
                setPassword("");
                setShowPassword(false);
              }}
              className="text-blue-600 cursor-pointer"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{" "}
            <button type="button"
              onClick={() => {
                setState("Login");
                setIsTextDataSubmitted(false);
                setPassword("");
                setShowPassword(false);
              }}
              className="text-blue-600 cursor-pointer"
            >
              Login
            </button>
          </p>
        )}
      </form>
    </div>
  );
};

export default RecruiterLogin;
