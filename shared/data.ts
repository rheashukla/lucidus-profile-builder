// Ported from pb-data.js. Static lists used by the client and the server prompts.

import type { Inputs } from './types';

export interface Group { name: string; items: string[] }

export const SUBJECTS: Group[] = [
  {
    "name": "STEM",
    "items": [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "Artificial Intelligence",
      "Engineering & Technology",
      "Space Science"
    ]
  },
  {
    "name": "Earth & Environment",
    "items": [
      "Environmental Science",
      "Earth & Climate Science",
      "Geography & Urban Studies",
      "Agriculture & Food Systems"
    ]
  },
  {
    "name": "Health",
    "items": [
      "Medicine & Health Sciences",
      "Psychology & Neuroscience",
      "Sports Science"
    ]
  },
  {
    "name": "Society",
    "items": [
      "Economics",
      "Business & Entrepreneurship",
      "Finance",
      "Political Science & Policy",
      "Law",
      "Sociology",
      "History"
    ]
  },
  {
    "name": "Creative & Communication",
    "items": [
      "Art & Design",
      "Architecture",
      "Media, Film & Music",
      "English & Literature"
    ]
  }
];

export const POWERS: Group[] = [
  {
    "name": "Build",
    "items": [
      "Coding",
      "Building & Tinkering",
      "3D Modelling & CAD",
      "Game Design"
    ]
  },
  {
    "name": "Analyze",
    "items": [
      "Data Analysis",
      "Math Problem-Solving",
      "Scientific Experimentation",
      "Research & Investigation",
      "Financial Modelling"
    ]
  },
  {
    "name": "Create",
    "items": [
      "Drawing & Visual Design",
      "Photography",
      "Video & Filmmaking",
      "Music & Audio Production",
      "UX & Design Thinking"
    ]
  },
  {
    "name": "Communicate",
    "items": [
      "Writing",
      "Storytelling",
      "Public Speaking",
      "Debate & Persuasion",
      "Social Media & Marketing",
      "Languages & Translation"
    ]
  },
  {
    "name": "Lead & Connect",
    "items": [
      "Leadership & Organizing",
      "Interviewing & Listening",
      "Teaching & Explaining",
      "Community Work & Empathy"
    ]
  }
];

export const CAREERS: Group[] = [
  {
    "name": "Tech & AI",
    "items": [
      "AI Engineer",
      "AI Research Scientist",
      "AI Integration Strategist (AI Strategist)",
      "Blockchain Solutions Architect",
      "Cybersecurity Analyst",
      "Data Scientist",
      "FinTech Engineer",
      "Quantum Computing Research Scientist",
      "Software Developer"
    ]
  },
  {
    "name": "Engineering & Aviation",
    "items": [
      "Aerospace Engineer",
      "Autonomous Vehicle Specialist",
      "Biomedical Engineer",
      "Chemical Engineer",
      "Civil Engineer",
      "Commercial Airline Pilot",
      "Mechanical Engineer",
      "Renewable Energy Engineer",
      "Robotics Engineer",
      "Waste Engineer"
    ]
  },
  {
    "name": "Medicine & Health",
    "items": [
      "Anesthesiologist",
      "Cardiologist",
      "Clinical Psychologist",
      "Neurologist",
      "Nutritionist",
      "Orthodontist",
      "Orthopaedic Surgeon",
      "Pediatrician",
      "Psychiatrist",
      "Veterinarian"
    ]
  },
  {
    "name": "Climate, Environment & Cities",
    "items": [
      "Climate Finance Specialist",
      "Climate Policy Analyst",
      "Climate Scientist",
      "Environmental Consultant",
      "Hydrologist",
      "Marine Biologist",
      "Precision Agriculture Specialist",
      "Sustainable Materials Scientist",
      "Urban City Planner",
      "Urban Farmer"
    ]
  },
  {
    "name": "Science & Research",
    "items": [
      "Astrobiologist",
      "Astrophysicist",
      "Bioinformatics Specialist",
      "Forensic Scientist",
      "Gene Therapy Specialist",
      "Nanotechnologist",
      "Neuroscientist",
      "Synthetic Biology Designer",
      "Toxicologist"
    ]
  },
  {
    "name": "Law, Policy & Society",
    "items": [
      "Behavioral Economist",
      "Corporate Lawyer",
      "Diplomat",
      "Environmental Lawyer",
      "Human Rights Lawyer",
      "Intellectual Property Lawyer",
      "Political Strategist",
      "Public Policy Analyst",
      "Sociologist",
      "Tax Lawyer",
      "Trial Lawyer"
    ]
  },
  {
    "name": "Finance & Business",
    "items": [
      "Chief Financial Officer",
      "Entrepreneur / Startup Founder",
      "Investment Banker",
      "Management Consultant",
      "Microfinance Specialist",
      "Private Banker",
      "Private Equity Analyst",
      "Quant Trader",
      "Real Estate Developer",
      "Security Management Specialist",
      "Space Resource Economist (Space Economist)",
      "Venture Capitalist",
      "Wealth Manager"
    ]
  },
  {
    "name": "Design, Media & Communication",
    "items": [
      "Architect",
      "Digital Marketing Specialist",
      "Fashion Designer",
      "Film Editor",
      "Game Designer",
      "Industrial Designer",
      "Interior Designer",
      "Public Relations Specialist",
      "Sound Designer (Sound Engineer)",
      "UX Designer"
    ]
  },
  {
    "name": "Sports",
    "items": [
      "Sports Agent",
      "Sports Data Analyst",
      "Sports Event Manager",
      "Sports Psychologist"
    ]
  }
];

export const DEGREES: Group[] = [
  {
    "name": "Computing",
    "items": [
      "Computer Science",
      "Artificial Intelligence & Data Science",
      "Electronics & Electrical Engineering"
    ]
  },
  {
    "name": "Engineering",
    "items": [
      "Mechanical Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Aerospace Engineering",
      "Biomedical Engineering",
      "Robotics & Mechatronics",
      "Environmental Engineering",
      "Materials Science"
    ]
  },
  {
    "name": "Natural Sciences",
    "items": [
      "Physics",
      "Mathematics & Statistics",
      "Chemistry",
      "Biology & Life Sciences",
      "Biotechnology",
      "Earth & Environmental Science",
      "Agriculture & Food Science"
    ]
  },
  {
    "name": "Health",
    "items": [
      "Medicine (MBBS / Pre-Med)",
      "Dentistry (BDS)",
      "Veterinary Science",
      "Nutrition & Dietetics",
      "Psychology",
      "Neuroscience"
    ]
  },
  {
    "name": "Business & Economics",
    "items": [
      "Economics",
      "Business & Management",
      "Finance & Accounting"
    ]
  },
  {
    "name": "Law & Society",
    "items": [
      "Law (LLB / BA LLB)",
      "Political Science & International Relations",
      "Public Policy",
      "Sociology & Anthropology"
    ]
  },
  {
    "name": "Built Environment & Design",
    "items": [
      "Architecture",
      "Urban Planning",
      "Design (Fashion, Product, Interior, UX)"
    ]
  },
  {
    "name": "Media & Arts",
    "items": [
      "Media, Film & Communication",
      "Music & Sound"
    ]
  },
  {
    "name": "Other",
    "items": [
      "Sports Science & Management",
      "Aviation (Commercial Pilot Training)"
    ]
  }
];

export const COLLEGES: Group[] = [
  {
    "name": "India: engineering & science",
    "items": [
      "IIT Bombay",
      "IIT Delhi",
      "IIT Madras",
      "IIT Kanpur",
      "IISc Bangalore",
      "IISER Pune",
      "BITS Pilani",
      "IIIT Hyderabad",
      "NIT Trichy"
    ]
  },
  {
    "name": "India: medicine",
    "items": [
      "AIIMS New Delhi",
      "CMC Vellore"
    ]
  },
  {
    "name": "India: liberal arts, commerce & social sciences",
    "items": [
      "Ashoka University",
      "Krea University",
      "FLAME University",
      "St. Stephen's College",
      "Shri Ram College of Commerce",
      "Lady Shri Ram College",
      "Christ University"
    ]
  },
  {
    "name": "India: law",
    "items": [
      "NLSIU Bangalore",
      "NALSAR Hyderabad",
      "O.P. Jindal Global University"
    ]
  },
  {
    "name": "India: design & architecture",
    "items": [
      "NID Ahmedabad",
      "NIFT Delhi",
      "CEPT University",
      "Srishti Manipal Institute"
    ]
  },
  {
    "name": "USA",
    "items": [
      "MIT",
      "Stanford",
      "Harvard",
      "Caltech",
      "Princeton",
      "Yale",
      "University of Pennsylvania",
      "Columbia",
      "Cornell",
      "Carnegie Mellon",
      "UC Berkeley",
      "Georgia Tech",
      "UIUC",
      "Johns Hopkins",
      "NYU",
      "University of Michigan"
    ]
  },
  {
    "name": "UK",
    "items": [
      "Oxford",
      "Cambridge",
      "Imperial College London",
      "UCL",
      "LSE",
      "King's College London",
      "University of Edinburgh"
    ]
  },
  {
    "name": "Canada",
    "items": [
      "University of Toronto",
      "UBC",
      "University of Waterloo",
      "McGill"
    ]
  },
  {
    "name": "Europe & Asia-Pacific",
    "items": [
      "ETH Zurich",
      "TU Delft",
      "NUS",
      "NTU Singapore",
      "University of Hong Kong",
      "University of Melbourne"
    ]
  }
];

export const SDGS: string[] = [
  "No Poverty",
  "Zero Hunger",
  "Good Health and Well-being",
  "Quality Education",
  "Gender Equality",
  "Clean Water and Sanitation",
  "Affordable and Clean Energy",
  "Decent Work and Economic Growth",
  "Industry, Innovation and Infrastructure",
  "Reduced Inequalities",
  "Sustainable Cities and Communities",
  "Responsible Consumption and Production",
  "Climate Action",
  "Life Below Water",
  "Life on Land",
  "Peace, Justice and Strong Institutions",
  "Partnerships for the Goals"
];

export interface ModeInfo { id: 'Beginner' | 'Intermediate' | 'Advanced'; hint: string; desc: string; rows: [string, string][] }

export const MODES: ModeInfo[] = [
  {
    "id": "Beginner",
    "hint": "Typically grade 8–9",
    "desc": "First project like this. You want clear steps.",
    "rows": [
      [
        "Problem",
        "Given to you"
      ],
      [
        "Guidance",
        "Step-by-step tasks"
      ],
      [
        "Research",
        "3 secondary sources"
      ],
      [
        "Iterations",
        "1"
      ],
      [
        "Real world",
        "Share with 1 person"
      ]
    ]
  },
  {
    "id": "Intermediate",
    "hint": "Typically grade 10–11",
    "desc": "You've done a project before. You want some freedom.",
    "rows": [
      [
        "Problem",
        "Choose from 3 framings"
      ],
      [
        "Guidance",
        "Milestones only"
      ],
      [
        "Research",
        "4–5 sources + 1 primary"
      ],
      [
        "Iterations",
        "2"
      ],
      [
        "Real world",
        "Feedback from 3 people in target group"
      ]
    ]
  },
  {
    "id": "Advanced",
    "hint": "Typically grade 12+",
    "desc": "You can define your own problem and work with real users or data.",
    "rows": [
      [
        "Problem",
        "You define it"
      ],
      [
        "Guidance",
        "Outcomes only"
      ],
      [
        "Research",
        "Primary data (10+ people or a real dataset)"
      ],
      [
        "Iterations",
        "3, with test evidence"
      ],
      [
        "Real world",
        "Test with target users and measure"
      ]
    ]
  }
];

export const TIMELINE: Record<1 | 2 | 3 | 4, { cps: number[]; final: number }> = {
  "1": {
    "cps": [
      2,
      5
    ],
    "final": 7
  },
  "2": {
    "cps": [
      4,
      10
    ],
    "final": 14
  },
  "3": {
    "cps": [
      5,
      12,
      17
    ],
    "final": 21
  },
  "4": {
    "cps": [
      7,
      16,
      23
    ],
    "final": 28
  }
};

export const CRITERIA = [
  "Problem & purpose",
  "Process & iteration",
  "Quality of work",
  "Communication"
] as const;

export const LEVELS = [
  "Beginning",
  "Developing",
  "Proficient",
  "Exemplary"
] as const;

export const BASE_RUBRIC: [string, string, string, string][] = [
  [
    "Topic stated; problem vague or SDG only named",
    "Clear problem; who benefits is unclear",
    "Specific problem tied to the SDG; names who benefits and why",
    "Problem sharpened through own research; benefit shown with evidence"
  ],
  [
    "Final product only; no drafts shown",
    "Earlier versions shown; changes not explained",
    "Several versions; changes explained using feedback or testing",
    "Changes driven by deliberate testing; failed attempts documented and used"
  ],
  [
    "Incomplete, or subject concepts inaccurate",
    "Complete but surface-level or uneven craft",
    "Complete, accurate, solid craft in the chosen skill",
    "High craft and depth; goes beyond the brief"
  ],
  [
    "Hard to follow; key information missing",
    "Understandable; organization uneven",
    "Clear, organized, suited to the audience",
    "Compelling, concise story; could stand alone in an application"
  ]
];

export const SAMPLE: Omit<Inputs, 'country'> = {
  subjects: ['Biology', 'Environmental Science'],
  powers: ['Photography', 'Writing', 'Research & Investigation'],
  strongest: 'Photography',
  career: 'Marine Biologist',
  college: 'University of Toronto',
  degree: 'Biology & Life Sciences',
  weeks: 2,
  sdgs: [14],
  mode: 'Beginner',
};

export interface ProjectTypeInfo { name: string; what: string; evidence: string }

export const PROJECT_TYPES: ProjectTypeInfo[] = [
  { name: 'Research Paper', what: 'An original investigation written up formally', evidence: 'Paper, journal or conference submission' },
  { name: 'Venture', what: 'A for-profit business or startup', evidence: 'Running business, customers, revenue' },
  { name: 'Nonprofit', what: 'A mission-driven organization or initiative', evidence: 'Registered org, programs, people served' },
  { name: 'App / Software', what: 'A functional digital product', evidence: 'Live app, website, tool, code repo' },
  { name: 'Hardware / Prototype', what: 'A physical device or engineered build', evidence: 'Working prototype, robot, device' },
  { name: 'Campaign', what: 'An effort to change opinion, behavior, or policy', evidence: 'Petition, awareness drive, policy proposal' },
  { name: 'Event', what: 'A one-time or recurring gathering the student organizes', evidence: 'Conference, hackathon, fundraiser, workshop' },
  { name: 'Art Portfolio', what: 'A body of visual or design work', evidence: 'Gallery, exhibition, design collection' },
  { name: 'Data Project', what: 'Analysis or visualization of a dataset', evidence: 'Dashboard, report, open dataset' },
];

/** Checkpoint count for a given number of weeks (1 wk → 2, 2 → 2, 3 → 3, 4 → 3). */
export const checkpointCount = (weeks: 1 | 2 | 3 | 4) => TIMELINE[weeks].cps.length;
