import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface AssessmentRules {
  timeLimit: number;
  allowCopyPaste: boolean;
  allowAITools: boolean;
  preventTabSwitching: boolean;
  preventMinimization: boolean;
  trackIP: boolean;
}

interface JobPostingFormData {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  skills: string[];
  numberOfQuestions: number;
  difficulty: {
    beginner: boolean;
    intermediate: boolean;
    advanced: boolean;
  };
  assessmentType: string[];
  assessmentRules: AssessmentRules;
}

// List of common programming languages and skills
const skillsList = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 
  'Node.js', 'Python', 'Java', 'C#', 'PHP',
  'Ruby', 'Go', 'Swift', 'Kotlin', 'C++',
  'HTML/CSS', 'SQL', 'MongoDB', 'Firebase', 'AWS',
  'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Git'
];

const JobPosting: FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<JobPostingFormData>({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: [''],
    skills: [],
    numberOfQuestions: 5,
    difficulty: {
      beginner: true,
      intermediate: true,
      advanced: false,
    },
    assessmentType: ['written', 'multiple-choice'],
    assessmentRules: {
      timeLimit: 60,
      allowCopyPaste: false,
      allowAITools: false,
      preventTabSwitching: true,
      preventMinimization: true,
      trackIP: true,
    },
  });

  // Wait for auth to finish loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">You must be logged in as a recruiter to post a job.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const updatedRequirements = [...formData.requirements];
    updatedRequirements[index] = value;
    setFormData(prev => ({
      ...prev,
      requirements: updatedRequirements,
    }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ''],
    }));
  };

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      const updatedRequirements = [...formData.requirements];
      updatedRequirements.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        requirements: updatedRequirements,
      }));
    }
  };

  const handleSkillChange = (skill: string) => {
    // Toggle the skill selection
    setFormData(prev => {
      const updatedSkills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      
      return {
        ...prev,
        skills: updatedSkills
      };
    });
  };

  const handleCheckboxChange = (category: 'difficulty' | 'assessmentRules', name: string) => {
    if (category === 'difficulty') {
      setFormData(prev => ({
        ...prev,
        difficulty: {
          ...prev.difficulty,
          [name]: !prev.difficulty[name as keyof typeof prev.difficulty],
        },
      }));
    } else if (category === 'assessmentRules') {
      setFormData(prev => ({
        ...prev,
        assessmentRules: {
          ...prev.assessmentRules,
          [name]: !prev.assessmentRules[name as keyof typeof prev.assessmentRules],
        },
      }));
    }
  };

  const handleAssessmentTypeChange = (type: string) => {
    const currentTypes = [...formData.assessmentType];
    if (currentTypes.includes(type)) {
      setFormData(prev => ({
        ...prev,
        assessmentType: currentTypes.filter(t => t !== type),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assessmentType: [...currentTypes, type],
      }));
    }
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData(prev => ({
        ...prev,
        assessmentRules: {
          ...prev.assessmentRules,
          timeLimit: value,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (!currentUser) {
        throw new Error('You must be logged in to post a job');
      }
      
      // This check is optional since we've added a public route
      // if (userRole !== 'recruiter') {
      //   throw new Error('Only recruiters can post jobs');
      // }
      
      const timestamp = new Date();
      
      const jobData = {
        ...formData,
        createdAt: timestamp,
        updatedAt: timestamp,
        recruiterUid: currentUser?.uid || 'anonymous',
        status: 'active',
      };
      
      console.log("Submitting job data:", jobData);
      
      const docRef = await addDoc(collection(db, 'jobs'), jobData);
      
      setSuccessMessage(`Job posting successfully created with ID: ${docRef.id}`);
      
      // Use a more reliable approach for redirection
      setTimeout(() => {
        try {
          navigate('/recruiter/dashboard');
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback to home if dashboard fails
          navigate('/');
        }
      }, 2000);
    } catch (err) {
      console.error('Error creating job posting:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the job posting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Job Posting</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
            <p>{successMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="form-label">Job Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label htmlFor="company" className="form-label">Company Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label htmlFor="location" className="form-label">Location <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label htmlFor="type" className="form-label">Job Type <span className="text-red-500">*</span></label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="form-label">Job Description <span className="text-red-500">*</span></label>
            <p className="text-sm text-gray-500 mb-1">Paste your full job description or job ad. The AI will use this to generate relevant assessments.</p>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="input-field h-40"
              required
            ></textarea>
          </div>
          
          <div>
            <label className="form-label">Key Requirements</label>
            <p className="text-sm text-gray-500 mb-2">Add specific requirements for the role</p>
            
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                  className="input-field"
                  placeholder={`Requirement ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                  aria-label="Remove requirement"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addRequirement}
              className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Requirement
            </button>
          </div>
          
          {/* Skills Section */}
          <div>
            <label className="form-label">Skills & Programming Languages</label>
            <p className="text-sm text-gray-500 mb-2">Select skills and programming languages required for this position</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {skillsList.map((skill) => (
                <div key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`skill-${skill}`}
                    checked={formData.skills.includes(skill)}
                    onChange={() => handleSkillChange(skill)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor={`skill-${skill}`} className="ml-2 block text-sm text-gray-700">
                    {skill}
                  </label>
                </div>
              ))}
            </div>
            
            {formData.skills.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Selected Skills:</div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleSkillChange(skill)}
                        className="ml-1.5 h-4 w-4 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Assessment Configuration</h2>
            
            <div className="mb-6">
              <label className="form-label mb-2">Assessment Difficulty</label>
              <p className="text-sm text-gray-500 mb-3">Select difficulty levels to include in the assessment</p>
              
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.difficulty.beginner}
                    onChange={() => handleCheckboxChange('difficulty', 'beginner')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Beginner</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.difficulty.intermediate}
                    onChange={() => handleCheckboxChange('difficulty', 'intermediate')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Intermediate</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.difficulty.advanced}
                    onChange={() => handleCheckboxChange('difficulty', 'advanced')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Advanced</span>
                </label>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="form-label mb-2">Assessment Types</label>
              <p className="text-sm text-gray-500 mb-3">Select types of questions to include</p>
              
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentType.includes('written')}
                    onChange={() => handleAssessmentTypeChange('written')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Written Questions</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentType.includes('coding')}
                    onChange={() => handleAssessmentTypeChange('coding')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Coding Exercises</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentType.includes('project')}
                    onChange={() => handleAssessmentTypeChange('project')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Project Tasks</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentType.includes('multiple-choice')}
                    onChange={() => handleAssessmentTypeChange('multiple-choice')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Multiple Choice</span>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="form-label mb-2">Time Limit (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={formData.assessmentRules.timeLimit}
                  onChange={handleTimeLimitChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label mb-2">Number of Assessment Questions</label>
                <select
                  name="numberOfQuestions"
                  value={formData.numberOfQuestions}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="form-label mb-2">Anti-Cheating Rules</label>
              <p className="text-sm text-gray-500 mb-3">Select which rules to enforce during the assessment</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentRules.allowCopyPaste}
                    onChange={() => handleCheckboxChange('assessmentRules', 'allowCopyPaste')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Allow Copy-Paste</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentRules.allowAITools}
                    onChange={() => handleCheckboxChange('assessmentRules', 'allowAITools')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Allow AI Tools</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentRules.preventTabSwitching}
                    onChange={() => handleCheckboxChange('assessmentRules', 'preventTabSwitching')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Prevent Tab Switching</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentRules.preventMinimization}
                    onChange={() => handleCheckboxChange('assessmentRules', 'preventMinimization')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Prevent Window Minimization</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assessmentRules.trackIP}
                    onChange={() => handleCheckboxChange('assessmentRules', 'trackIP')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Track IP Address</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary px-6 py-3 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Job...
                </span>
              ) : (
                'Create Job & Generate Assessment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPosting; 