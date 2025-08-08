import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Resume Analyzer" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      const resumes = (await kv.list("resume:*", true)) as KVItem[];

      const parsedResumes = resumes?.map((resume) => (
        JSON.parse(resume.value) as Resume
      ));
      console.log("parsedResumes", parsedResumes);
      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    }

    loadResumes();
  },
[]);

  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  },[auth.isAuthenticated]);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track your applications and Resume Ratings</h1>
        {!loadingResumes && resumes.length === 0 ? (
          <h2>No resumes found. Upload your first application to get the feedback</h2>
        ): (
          <h2>Review your submissions and check AI-prowered feedback</h2>
        )};
      </div>
      {loadingResumes && (
        <div className="flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl">Loading your resumes...</h2>
          <p className="text-gray-500">This may take a few seconds</p>
          <img src = '/images/resume-scan-2.gif' className='w-[200px]' alt='loading resumes' />
        </div>
      )}
    {!loadingResumes && resumes.length>0 && 
      (<div className="resumes-section">
      {resumes.map((resume)=>(
        <ResumeCard key={resume.id} resume={resume} />
      ))}
      </div>
    )}
    {!loadingResumes && resumes.length === 0 && (
      <div className="flex items-center justify-center flex-col gap-4 mt-10">
        <Link to='/upload' className="primary-button w-fit text-xl font-semibold">
        Upload your first resume
        </Link>
      </div>
  )}
    </section>
  </main>;
}
