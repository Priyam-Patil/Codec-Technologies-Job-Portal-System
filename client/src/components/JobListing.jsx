import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import JobCard from './JobCard';

export default function JobListing() {
  const { searchFilter, setSearchFilter, jobs, jobsLoading, jobsError, fetchJobs, userApplications } = useContext(AppContext);
  const [showFilter, setShowFilter] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category: [], location: [], level: '', jobType: '', workMode: '', minSalary: '', maxSalary: '', hideApplied: false });
  const applied = new Set(userApplications.map(item => item.jobId?._id || item.jobId));
  const update = (field, value) => { setFilters(previous => ({ ...previous, [field]: value })); setPage(1); };
  const filtered = jobs.slice().reverse().filter(job =>
    job.title.toLowerCase().includes(searchFilter.title.trim().toLowerCase()) &&
    job.location.toLowerCase().includes(searchFilter.location.trim().toLowerCase()) &&
    ['category', 'location'].every(field => !filters[field].length || filters[field].includes(job[field])) &&
    ['level', 'jobType', 'workMode'].every(field => !filters[field] || job[field] === filters[field]) &&
    (filters.minSalary === '' || job.salary >= Number(filters.minSalary)) &&
    (filters.maxSalary === '' || job.salary <= Number(filters.maxSalary)) &&
    (!filters.hideApplied || !applied.has(job._id)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, totalPages);
  return <div className="container mx-auto px-4 2xl:px-20 flex flex-col lg:flex-row gap-8 py-10">
    <aside className="panel w-full lg:w-72 lg:shrink-0 h-fit"><div className="flex justify-between items-center"><h2 className="font-bold text-xl">Find your fit</h2><button className="lg:hidden secondary-button" aria-expanded={showFilter} onClick={() => setShowFilter(value => !value)}>Filters</button></div>
      <div className={showFilter ? 'space-y-5 mt-6' : 'hidden lg:block space-y-5 mt-6'}>
        <label className="field-label">Job title<input className="field" value={searchFilter.title} onChange={event => { setSearchFilter(previous => ({ ...previous, title: event.target.value })); setPage(1); }} placeholder="Search roles" /></label>
        <label className="field-label">Location search<input className="field" value={searchFilter.location} onChange={event => { setSearchFilter(previous => ({ ...previous, location: event.target.value })); setPage(1); }} placeholder="City or region" /></label>
        {[['category', 'Categories'], ['location', 'Locations']].map(([field, label]) => <fieldset key={field}><legend className="field-label mb-3">{label}</legend><div className="space-y-2 max-h-48 overflow-y-auto">{[...new Set(jobs.map(job => job[field]).filter(Boolean))].sort().map(value => <label key={value} className="flex gap-3 items-center text-sm"><input type="checkbox" checked={filters[field].includes(value)} onChange={() => update(field, filters[field].includes(value) ? filters[field].filter(item => item !== value) : [...filters[field], value])} />{value}</label>)}</div></fieldset>)}
        {[['level', 'Experience level'], ['jobType', 'Job type'], ['workMode', 'Work mode']].map(([field, label]) => <label key={field} className="field-label">{label}<select aria-label={label} className="field" value={filters[field]} onChange={event => update(field, event.target.value)}><option value="">All</option>{[...new Set(jobs.map(job => job[field]).filter(Boolean))].sort().map(value => <option key={value}>{value}</option>)}</select></label>)}
        <div className="grid grid-cols-2 gap-3">{[['minSalary', 'Min salary'], ['maxSalary', 'Max salary']].map(([field, label]) => <label key={field} className="field-label">{label}<input type="number" min="0" className="field" value={filters[field]} onChange={event => update(field, event.target.value)} /></label>)}</div>
        <p className="text-sm text-slate-500">Salary uses the CTC units entered by recruiters. Older records may have no job type or work mode.</p>
        <label className="flex gap-3 items-center text-sm"><input type="checkbox" checked={filters.hideApplied} onChange={event => update('hideApplied', event.target.checked)} />Hide jobs I applied to</label>
        <button className="secondary-button w-full" onClick={() => { setFilters({ category: [], location: [], level: '', jobType: '', workMode: '', minSalary: '', maxSalary: '', hideApplied: false }); setSearchFilter({ title: '', location: '' }); setPage(1); }}>Clear filters</button>
      </div>
    </aside>
    <section className="min-w-0 flex-1" id="job-list"><p className="eyebrow text-blue-700">DISCOVER OPPORTUNITIES</p><h2 className="text-3xl font-bold mt-2">Make your next move.</h2><p className="text-slate-600 mt-3 mb-7">{jobsLoading ? 'Loading opportunities…' : `${filtered.length} jobs matching your search`}</p>
      {jobsError ? <div className="panel" role="alert"><p>{jobsError}</p><button onClick={fetchJobs} className="primary-button mt-4">Retry</button></div>
        : jobsLoading ? <div className="job-grid" role="status">{[1,2,3].map(item => <div key={item} className="panel h-64 animate-pulse bg-slate-100" />)}<span className="sr-only">Loading jobs</span></div>
          : filtered.length ? <><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{filtered.slice((currentPage - 1) * 6, currentPage * 6).map(job => <JobCard key={job._id} job={job} />)}</div><nav aria-label="Job pages" className="flex justify-center items-center gap-4 mt-8"><button className="secondary-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>{currentPage} / {totalPages}</span><button className="secondary-button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></nav></>
            : <div className="panel py-16 text-center"><h3 className="font-semibold text-xl">No matching opportunities yet</h3><p className="text-slate-600 mt-3">Try a different title or broaden your filters.</p></div>}
    </section>
  </div>;
}
