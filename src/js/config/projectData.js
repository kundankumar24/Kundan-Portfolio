/**
 * Project Data Configuration
 * Contains detailed information about portfolio projects
 */

export const projectsData = [
  {
    id: 'predictive-transaction-intelligence',
    title: 'Predictive Transaction Intelligence BFSI',
    description: 'AI-driven financial analytics system for banking transaction pattern analysis and fraud detection',
    longDescription: 'Built an AI-driven financial analytics system using Python, TensorFlow, and Scikit-learn to analyze banking transaction patterns. Developed machine learning models for predictive analytics, improving fraud detection capability and transaction analysis accuracy. Implemented backend APIs using Flask/FastAPI and integrated PostgreSQL database, enabling secure and scalable transaction data processing.',
    technologies: [
      { name: 'Python', category: 'Language', icon: 'python' },
      { name: 'TensorFlow', category: 'Framework', icon: 'tensorflow' },
      { name: 'Scikit-learn', category: 'Library', icon: 'sklearn' },
      { name: 'Flask', category: 'Framework', icon: 'flask' },
      { name: 'FastAPI', category: 'Framework', icon: 'fastapi' },
      { name: 'PostgreSQL', category: 'Database', icon: 'postgres' }
    ],
    images: [],
    liveUrl: 'https://predictive-transaction-intelligence-iota.vercel.app/',
    githubUrl: 'https://github.com/kundankumar24/predictive-transaction-intelligence',
    caseStudy: {
      problem: 'Banking institutions need efficient fraud detection and transaction pattern analysis',
      solution: 'Developed ML models for predictive analytics improving fraud detection and transaction analysis accuracy',
      process: [
        'Built machine learning models using TensorFlow and Scikit-learn',
        'Developed backend APIs using Flask/FastAPI',
        'Integrated PostgreSQL database for secure data processing',
        'Implemented predictive analytics for transaction patterns'
      ],
      results: 'Improved fraud detection capability and transaction analysis accuracy through AI-powered analytics'
    },
    featured: true,
    category: 'AI/ML',
    dateCompleted: new Date('2025-12-01'),
    metrics: {
      other: 'AI-powered fraud detection'
    }
  },
  {
    id: 'dronai-website',
    title: 'DronAI Website - AI & Robotics Platform',
    description: 'Designed and developed an AI and Robotics program website enabling students to explore courses and enroll in training programs',
    longDescription: 'Created UI/UX prototypes in Figma and implemented responsive frontend using React, improving website usability and navigation. Built scalable frontend components allowing students to access workshops and program details efficiently.',
    technologies: [
      { name: 'React', category: 'Framework', icon: 'react' },
      { name: 'Figma', category: 'Tool', icon: 'figma' },
      { name: 'JavaScript', category: 'Language', icon: 'javascript' },
      { name: 'CSS', category: 'Language', icon: 'css' }
    ],
    images: [],
    liveUrl: 'https://dron-ai-lyart.vercel.app/',
    githubUrl: 'https://github.com/kundankumar24/Dron-AI',
    caseStudy: {
      problem: 'Students need an accessible platform to explore AI and Robotics courses',
      solution: 'Designed and developed a responsive website with intuitive UI/UX for course exploration and enrollment',
      process: [
        'Created UI/UX prototypes in Figma',
        'Implemented responsive frontend using React',
        'Built scalable frontend components',
        'Improved website usability and navigation'
      ],
      results: 'Enhanced student access to workshops and program details with improved usability'
    },
    featured: true,
    category: 'Web Application',
    dateCompleted: new Date('2024-06-01'),
    metrics: {
      other: 'Improved website usability'
    }
  },
  {
    id: 'ecommerce-store',
    title: 'E-Commerce Store (Myntra Clone)',
    description: 'Full-stack e-commerce platform with product catalog, shopping cart, and checkout features',
    longDescription: 'Developed a full-stack e-commerce platform supporting product catalog, shopping cart, and checkout features. Built dynamic product listing and cart management system using React, improving page interaction speed by 30%. Implemented responsive design using HTML, CSS, and JavaScript frameworks, ensuring compatibility across multiple devices and browsers.',
    technologies: [
      { name: 'React', category: 'Framework', icon: 'react' },
      { name: 'JavaScript', category: 'Language', icon: 'javascript' },
      { name: 'HTML', category: 'Language', icon: 'html' },
      { name: 'CSS', category: 'Language', icon: 'css' }
    ],
    images: [],
    liveUrl: 'https://myntra-clone-psi-seven.vercel.app/',
    githubUrl: 'https://github.com/kundankumar24/myntra-clone',
    caseStudy: {
      problem: 'Need for a responsive e-commerce platform with efficient product browsing and cart management',
      solution: 'Built a full-stack platform with dynamic product listing and optimized cart management',
      process: [
        'Developed product catalog and shopping cart features',
        'Built dynamic product listing system using React',
        'Implemented responsive design for cross-device compatibility',
        'Optimized page interaction speed'
      ],
      results: '30% improvement in page interaction speed with responsive cross-device compatibility'
    },
    featured: true,
    category: 'Web Application',
    dateCompleted: new Date('2024-04-01'),
    metrics: {
      performanceImprovement: '30% faster page interactions'
    }
  },
  {
    id: 'flight-reservation-system',
    title: 'Flight Reservation System',
    description: 'Responsive flight booking platform enabling users to search and reserve tickets online',
    longDescription: 'Built a responsive flight booking platform using React and REST APIs enabling users to search and reserve tickets online. Implemented dynamic booking workflows and UI components, improving booking efficiency by 35% in simulated user testing.',
    technologies: [
      { name: 'React', category: 'Framework', icon: 'react' },
      { name: 'REST APIs', category: 'Technology', icon: 'api' },
      { name: 'JavaScript', category: 'Language', icon: 'javascript' }
    ],
    images: [],
    liveUrl: null,
    githubUrl: null,
    caseStudy: {
      problem: 'Users need an efficient platform to search and book flight tickets online',
      solution: 'Built a responsive booking platform with dynamic workflows and optimized UI components',
      process: [
        'Developed flight search and booking features using React',
        'Integrated REST APIs for real-time data',
        'Implemented dynamic booking workflows',
        'Optimized UI components for better user experience'
      ],
      results: '35% improvement in booking efficiency in simulated user testing'
    },
    featured: false,
    category: 'Web Application',
    dateCompleted: new Date('2024-03-01'),
    metrics: {
      performanceImprovement: '35% booking efficiency improvement'
    }
  }
]

/**
 * Get all projects
 * @returns {Array} All projects
 */
export function getAllProjects() {
  return projectsData
}

/**
 * Get project by ID
 * @param {string} id - Project ID
 * @returns {Object|null} Project or null if not found
 */
export function getProjectById(id) {
  return projectsData.find(project => project.id === id) || null
}

/**
 * Get featured projects
 * @returns {Array} Featured projects
 */
export function getFeaturedProjects() {
  return projectsData.filter(project => project.featured)
}

/**
 * Get unique categories
 * @returns {Array} Array of unique categories
 */
export function getCategories() {
  const categories = projectsData.map(project => project.category)
  return [...new Set(categories)]
}

/**
 * Filter projects by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered projects
 */
export function getProjectsByCategory(category) {
  return projectsData.filter(project => project.category === category)
}
