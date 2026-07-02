import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const { user } = useUser();
  const { getToken } = useAuth();

  const [searchFilter, setSearchFilter] = useState({
    title: "",
    location: "",
  });

  const [isSearched, setIsSearched] = useState(false);
  const [jobs, setJobs] = useState([]);

  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);

  const [companyToken, setCompanyToken] = useState(
    localStorage.getItem("companyToken")
  );
  const [companyData, setCompanyData] = useState(null);

  const [userData, setUserData] = useState(null);
  const [userApplications, setUserApplications] = useState([]);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/jobs");

      if (data.success) {
        setJobs(data.jobs);
        console.log(data.jobs);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/company/company", {
        headers: {
          token: companyToken,
        },
      });

      if (data.success) {
        setCompanyData(data.company);
        console.log(data);
      } else {
        toast.error(data.message);
        localStorage.removeItem("companyToken");
        setCompanyToken(null);
        setCompanyData(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      localStorage.removeItem("companyToken");
      setCompanyToken(null);
      setCompanyData(null);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(backendUrl + "/api/users/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(
        backendUrl + "/api/users/applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setUserApplications([...data.applications].reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const logoutCompany = () => {
    localStorage.removeItem("companyToken");
    setCompanyToken(null);
    setCompanyData(null);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (companyToken) {
      fetchCompanyData();
    }
  }, [companyToken]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserApplications();
    }
  }, [user]);

  const value = {
    searchFilter,
    setSearchFilter,
    isSearched,
    setIsSearched,

    jobs,
    setJobs,

    showRecruiterLogin,
    setShowRecruiterLogin,

    companyToken,
    setCompanyToken,
    companyData,
    setCompanyData,

    userData,
    setUserData,
    userApplications,
    setUserApplications,

    backendUrl,

    fetchJobs,
    fetchCompanyData,
    fetchUserData,
    fetchUserApplications,
    logoutCompany,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};