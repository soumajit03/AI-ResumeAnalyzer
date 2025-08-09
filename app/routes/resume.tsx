import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
    { title: 'Resumer.ai | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);

            if(!resume) return;

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if(!imageBlob) return;
            const imageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageUrl);

            setFeedback(data.feedback);
            console.log({resumeUrl, imageUrl, feedback: data.feedback });
        }

        loadResume();
    }, [id]);

    return (
        <main className="!pt-0 bg-gray-50">
            <nav className="resume-nav bg-white/95 backdrop-blur-md border-b border-gray-100">
                <Link to="/" className="back-button hover:bg-blue-50 transition-colors duration-300">
                    <img src="/icons/back.svg" alt="logo" className="w-3 h-3" />
                    <span className="text-gray-800 text-base font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 bg-white/95 backdrop-blur-sm rounded-3xl p-6 modern-shadow border border-white/50 h-[90%] max-wxl:h-fit w-fit hover:scale-105 transition-all duration-500">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section bg-white/80 backdrop-blur-sm">
                    <div className="bg-white/95 rounded-3xl p-8 modern-shadow border border-white/50">
                        <h2 className="text-5xl !text-black font-bold mb-8">Resume Review</h2>
                        {feedback ? (
                            <div className="flex flex-col gap-10 animate-in fade-in duration-1000">
                                <Summary feedback={feedback} />
                                <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                                <Details feedback={feedback} />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="bg-white/90 rounded-3xl p-8 modern-shadow">
                                    <img src="/images/resume-scan-2.gif" className="w-36 h-36" />
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}
export default Resume
