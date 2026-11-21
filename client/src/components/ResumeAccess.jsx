import { useContext, useState } from 'react';
import axios from '../lib/api';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

export default function ResumeAccess({ applicationId }) {
  const { candidateRequest, backendUrl, companyToken } = useContext(AppContext);
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const prepare = async () => {
    setLoading(true);
    try {
      const data = applicationId ? (await axios.get(backendUrl + '/api/company/applications/' + applicationId + '/resume', { headers: { token: companyToken } })).data : await candidateRequest('/resume');
      if (!data.success) throw new Error(data.message);
      setLink({ url: data.url, expires: Date.now() + 110000 });
    } catch (error) { toast.error(error.response?.data?.message || error.message); }
    finally { setLoading(false); }
  };
  return <div className="flex flex-wrap items-center gap-2"><button type="button" className="secondary-button text-sm" disabled={loading} onClick={prepare}>{loading ? 'Preparing…' : 'Get resume link'}</button>{link && <a className="text-blue-700 underline text-sm" href={link.url} target="_blank" rel="noreferrer" onClick={event => { if (Date.now() >= link.expires) { event.preventDefault(); setLink(null); toast.info('Prepare a fresh resume link'); } }}>Open resume</a>}</div>;
}
