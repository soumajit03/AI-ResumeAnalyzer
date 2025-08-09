import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file');

        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file);
        if(!imageFile.file) return setStatusText('Error: Failed to convert PDF to image');

        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText('Error: Failed to upload image');

        setStatusText('Preparing data...');
        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing...');

        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({ jobTitle, jobDescription })
        )
        if (!feedback) return setStatusText('Error: Failed to analyze resume');

        const feedbackText = typeof feedback.message.content === 'string'
            ? feedback.message.content
            : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText);
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis complete, redirecting...');
        console.log(data);
        navigate(`/resume/${uuid}`);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-20">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-6">
                            <h2 className="text-2xl font-semibold text-blue-600">{statusText}</h2>
                            <div className="bg-white/90 rounded-3xl p-8 modern-shadow">
                                <img src="/images/resume-scan.gif" className="w-24 h-24" />
                            </div>
                        </div>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <div className="w-full max-w-3xl">
                            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 modern-shadow border border-white/50">
                                <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
                                    <div className="form-div">
                                        <label htmlFor="company-name">Company Name</label>
                                        <input type="text" name="company-name" placeholder="Enter company name" id="company-name" />
                                    </div>
                                    <div className="form-div">
                                        <label htmlFor="job-title">Job Title</label>
                                        <input type="text" name="job-title" placeholder="Enter job title" id="job-title" />
                                    </div>
                                    <div className="form-div">
                                        <label htmlFor="job-description">Job Description</label>
                                        <textarea rows={6} name="job-description" placeholder="Paste the job description here" id="job-description" />
                                    </div>

                                    <div className="form-div">
                                        <label htmlFor="uploader">Upload Resume</label>
                                        <FileUploader onFileSelect={handleFileSelect} />
                                    </div>

                                    <button className="primary-button mt-4" type="submit">
                                        Analyze Resume
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
