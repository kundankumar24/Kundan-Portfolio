/**
 * Experience Data Configuration
 * Contains work experience, education, and volunteer experience
 */

export const experienceData = {
  workExperience: [
    {
      id: 'exp-1',
      company: 'Suvidha Foundation',
      position: 'Web Development Intern',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-10-01'),
      description: 'Designed and developed the frontend of DronAI website using React and Tailwind CSS, creating a modern and responsive user interface.',
      achievements: [
        'Designed the complete frontend of DronAI website using React and Tailwind CSS',
        'Created comprehensive Figma design mockups for the DronAI website, ensuring pixel-perfect implementation',
        'Implemented responsive design patterns ensuring seamless experience across all devices',
        'Collaborated with the team to deliver a production-ready website within the internship timeline'
      ],
      technologies: ['React', 'Tailwind CSS', 'Figma', 'JavaScript', 'HTML5', 'CSS3', 'Responsive Design'],
      type: 'work',
      location: 'Remote',
      current: false
    },
    {
      id: 'exp-2',
      company: 'Infosys Springboard',
      position: 'AI Intern, Emerging Technologies (AI & Cloud)',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-31'),
      description: 'Designed a Predictive Transaction Intelligence system for banking analytics using machine learning models.',
      achievements: [
        'Designed a Predictive Transaction Intelligence system for banking analytics using machine learning models',
        'Built predictive models using TensorFlow and Scikit-learn to detect transaction patterns and anomalies',
        'Developed backend APIs using Python Flask and integrated PostgreSQL database for analytics processing'
      ],
      technologies: ['Python', 'TensorFlow', 'Scikit-learn', 'Flask', 'PostgreSQL', 'Machine Learning'],
      type: 'work',
      location: 'Remote',
      current: false
    },
    {
      id: 'exp-3',
      company: 'EY Global Delivery Services - Next Gen Employability Program Edunef Foundation',
      position: 'Full Stack Web Development Intern',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-30'),
      description: 'Built a responsive ticket booking web application using React.js and modern frontend technologies.',
      achievements: [
        'Built a responsive ticket booking web application using React.js and modern frontend technologies',
        'Implemented dynamic UI components and frontend logic for seamless user experience',
        'Collaborated in an Agile team environment to deliver project milestones and production-ready features'
      ],
      technologies: ['React.js', 'JavaScript', 'HTML', 'CSS', 'Agile'],
      type: 'work',
      location: 'Remote',
      current: false
    },
    {
      id: 'exp-4',
      company: 'Edunef Foundation - IBM Collaboration',
      position: 'Software Engineer Intern (AI & Cloud)',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-31'),
      description: 'Developed AI-powered tools using Python and TensorFlow to automate workflows, improving system efficiency by 40%.',
      achievements: [
        'Developed AI-powered tools using Python and TensorFlow to automate workflows, improving system efficiency by 40%',
        'Implemented machine learning models for predictive analytics, reducing manual effort by 30%',
        'Integrated cloud-based AI solutions with IBM resources to accelerate deployment and improve scalability'
      ],
      technologies: ['Python', 'TensorFlow', 'Machine Learning', 'Cloud Computing', 'IBM Cloud'],
      type: 'work',
      location: 'Remote',
      current: false
    }
  ],

  education: [
    {
      id: 'edu-1',
      institution: 'UCET, VBU',
      degree: 'B. Tech',
      field: 'Computer Science and Engineering',
      startDate: new Date('2022-11-01'),
      endDate: new Date('2026-06-30'),
      grade: 'CGPA: 8.0',
      location: 'Hazaribagh, Jharkhand',
      description: 'Pursuing Bachelor of Technology in Computer Science and Engineering with focus on AI, Machine Learning, and Full-Stack Development.',
      achievements: [
        'Maintained 8.0 CGPA throughout the program',
        'Organized departmental activities increasing student participation by 30%',
        'Completed multiple internships in AI and Full-Stack Development'
      ],
      type: 'education',
      current: true
    },
    {
      id: 'edu-2',
      institution: 'GHAKAMAL SARASWATI VIDYA MANDIR',
      degree: 'Intermediate',
      field: 'Science',
      startDate: new Date('2019-04-01'),
      endDate: new Date('2021-03-31'),
      grade: 'PERCENTAGE: 92.2%',
      location: 'Dhanbad',
      description: 'Completed intermediate education with distinction in Science stream.',
      achievements: [
        'Achieved 92.2% in board examinations',
        'Excelled in Mathematics and Physics'
      ],
      type: 'education',
      current: false
    },
    {
      id: 'edu-3',
      institution: 'DOON PUBLIC SCHOOL',
      degree: 'Matriculation',
      field: 'General',
      startDate: new Date('2017-04-01'),
      endDate: new Date('2019-03-31'),
      grade: 'PERCENTAGE: 90.1%',
      location: 'Koyla Nagar, Dhanbad',
      description: 'Completed matriculation with excellent academic performance.',
      achievements: [
        'Achieved 90.1% in board examinations',
        'Demonstrated strong foundation in core subjects'
      ],
      type: 'education',
      current: false
    }
  ],

  volunteer: [
    {
      id: 'vol-1',
      organization: 'Department Activities',
      role: 'Organizer',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-12-31'),
      description: 'Organized and coordinated departmental activities to enhance student engagement and participation.',
      achievements: [
        'Increased student participation by 30%',
        'Coordinated multiple technical and cultural events',
        'Fostered collaborative learning environment'
      ],
      type: 'volunteer',
      current: false
    }
  ]
}

/**
 * Get all experiences sorted by date (most recent first)
 * @returns {Array} All experiences
 */
export function getAllExperiences() {
  const all = [
    ...experienceData.workExperience,
    ...experienceData.education,
    ...experienceData.volunteer
  ]
  
  return all.sort((a, b) => {
    const dateA = a.endDate || a.startDate
    const dateB = b.endDate || b.startDate
    return dateB - dateA
  })
}

/**
 * Get experiences by type
 * @param {string} type - Type of experience ('work', 'education', 'volunteer')
 * @returns {Array} Filtered experiences
 */
export function getExperiencesByType(type) {
  switch (type) {
    case 'work':
      return experienceData.workExperience
    case 'education':
      return experienceData.education
    case 'volunteer':
      return experienceData.volunteer
    default:
      return []
  }
}

/**
 * Get current experiences
 * @returns {Array} Current experiences
 */
export function getCurrentExperiences() {
  return getAllExperiences().filter(exp => exp.current)
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return 'Present'
  
  const options = { year: 'numeric', month: 'short' }
  return date.toLocaleDateString('en-US', options)
}

/**
 * Calculate duration between dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (null for current)
 * @returns {string} Duration string
 */
export function calculateDuration(startDate, endDate) {
  const end = endDate || new Date()
  const months = Math.floor((end - startDate) / (1000 * 60 * 60 * 24 * 30))
  
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  
  if (years === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
  }
  
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`
  }
  
  return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
}
