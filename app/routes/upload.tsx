import React, { type FormEvent } from 'react'
import { useNavigate } from 'react-router';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar'
import { prepareInstructions } from '~/constants';
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';

const upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing , setIsProcessing] = React.useState(false);
    const [statusText, setStatusText] = React.useState('');
    const [file, setFile] = React.useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {setFile(file);}
    
    const handleAnalyzeResume = async ({companyName, jobTitle, jobDescription, file} : { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        setIsProcessing(true);
        setStatusText('Analyzing your resume...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) {
            setStatusText('Failed to upload resume. Please try again.');
        }

        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file);

        if(!imageFile?.file){
            return setStatusText('Failed to convert resume PDF to image. Please try again.');
        }

        setStatusText('Uploading image...');
        const uploadedImage = await fs.upload([imageFile.file]);

        if(!uploadedImage) {
            setStatusText('Failed to upload image. Please try again.');
        }

        setStatusText('Preparing Data...');

        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile?.path,
            imagePath: uploadedImage?.path,
            companyName,
            jobTitle,
            jobDescription,
            feedback:'',
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analyzing resume...');
        const feedback = await ai.feedback( uploadedFile?.path as string | '', prepareInstructions({jobTitle, jobDescription})
        )

        if(!feedback){
            setStatusText('Failed to analyze resume. Please try again.');
        }

        const feedbackText = typeof feedback?.message.content === 'string' ? feedback?.message.content : feedback?.message.content[0].text;
        data.feedback = JSON.parse(feedbackText);
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Resume analyzed successfully! Redirecting to results...');
        console.log(data);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);
        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;
        handleAnalyzeResume({ companyName, jobTitle, jobDescription, file });
    }
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>

    <section className="main-section">
        <div className='page-heading py-16'>
            <h1>Smart feedback for your dream job</h1>
            {isProcessing ? (
                <>
                    <h2>{statusText}</h2>
                    <img src='/images/resume-scan.gif' className='w-full' />
                </>
            ) : (
                <>
                    <h2>Upload your resume here</h2>
                    <form id='upload-form' onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                        <div className='form-div'>
                            <label htmlFor='company-name'>Company Name</label>
                            <input type='text' name='company-name' id='company-name' placeholder='Company Name' />
                        </div>
                        <div className='form-div'>
                            <label htmlFor='job-title'>Job Title</label>
                            <input type='text' name='job-title' id='job-title' placeholder='Job Title' />
                        </div>
                        <div className='form-div'>
                            <label htmlFor='job-description'>Job Title</label>
                            <textarea rows={5} name='job-description' id='job-description' placeholder='Job Description' />
                        </div>
                        <div className='form-div'>
                            <label htmlFor='uploader'>Upload Resume</label>
                            <FileUploader onFileSelect={handleFileSelect}/>
                        </div>
                        <button className='primary-button' type='submit'>Analyze Resume</button>
                    </form>
                </>
            )}
        </div>
    </section>
    </main>
  )
}

export default upload
