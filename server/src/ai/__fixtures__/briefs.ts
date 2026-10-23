// Realistic create_brief tool inputs, one per mode, used by the tests.
import type { Inputs } from '@shared/types';

export const inputs: Record<'Beginner' | 'Intermediate' | 'Advanced', Inputs> = {
  Beginner: { subjects: ['Biology', 'Environmental Science'], powers: ['Photography', 'Writing'], strongest: 'Photography', career: 'Marine Biologist', college: 'University of Toronto', degree: 'Biology & Life Sciences', country: 'Canada', weeks: 2, sdgs: [14], mode: 'Beginner' },
  Intermediate: { subjects: ['Economics'], powers: ['Data Analysis', 'Writing', 'Public Speaking'], strongest: 'Data Analysis', career: null, college: '', degree: '', country: 'India', weeks: 3, sdgs: [6, 11], mode: 'Intermediate' },
  Advanced: { subjects: ['Computer Science', 'Medicine & Health Sciences'], powers: ['Coding', 'UX & Design Thinking'], strongest: 'Coding', career: 'Still exploring', college: '', degree: 'Computer Science', country: 'Kenya', weeks: 4, sdgs: [3], mode: 'Advanced' },
};

const rubric = [
  { criterion: 'problem', levels: ['a', 'b', 'c', 'd'] },
  { criterion: 'process', levels: ['a', 'b', 'c', 'd'] },
  { criterion: 'quality', levels: ['a', 'b', 'c', 'd'] },
  { criterion: 'comms', levels: ['a', 'b', 'c', 'd'] },
];

const cp = (k: number) => ({ title: `Checkpoint Title ${k}`, goal: `Goal ${k}`, bring: ['One thing', 'Another thing'] });

export const raw = {
  Beginner: {
    projectType: 'Art Portfolio',
    headline: 'The Plastic Tide Reaching Your Nearest Beach',
    standfirst: 'Microplastics now turn up in almost every sample of seawater taken.',
    lede: 'Every year about 11 million tonnes of plastic enter the ocean, according to UNEP. On a single Toronto beach clean-up, volunteers can fill dozens of bags in an afternoon. Your camera can show what a statistic cannot: the exact place, the exact objects, and who left them there.',
    ledeSource: { title: 'Beat Plastic Pollution', publisher: 'UNEP', url: 'https://www.unep.org/interactives/beat-plastic-pollution/' },
    theProblem: 'Plastic litter on Lake Ontario shorelines harms birds and fish. You can document one beach near you.',
    problemOptions: ['should be dropped outside Intermediate'],
    beneficiary: 'Families who use one local beach and the volunteers who clean it.',
    yourMission: ['A photo essay of 8 images showing litter on one beach', 'A one-page explainer with a fact from each source'],
    steps: Array.from({ length: 6 }, (_, k) => ({ title: `Step ${k + 1}`, detail: 'Do a concrete thing.' })),
    whyItFitsYou: 'Marine biologists document what they see in the field. This links to your interest in Biology & Life Sciences.',
    startingSources: [
      { title: 'Plastic Pollution', publisher: 'Our World in Data', url: 'https://ourworldindata.org/plastic-pollution' },
      { title: 'Ocean plastic', publisher: 'UNEP', url: 'https://www.unep.org/' },
      { title: 'Made up', publisher: 'Nowhere', url: 'javascript:alert(1)' },
    ],
    rubric,
    checkpoints: [cp(1), cp(2), cp(3)],
  },
  Intermediate: {
    projectType: 'Data Project',
    headline: 'Counting Every Drop In A Leaky School',
    standfirst: 'Water stress is rising in Indian cities.',
    lede: 'Short lede.', ledeSource: { title: 'Water', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/drinking-water' },
    theProblem: 'Leaks waste water.',
    problemOptions: ['A place', 'A habit', 'A group', 'A fourth'],
    beneficiary: 'Students at your school.',
    yourMission: '- A dashboard of daily water use\n- A short report for the principal',
    steps: Array.from({ length: 4 }, (_, k) => ({ title: `Milestone ${k + 1}`, detail: 'Detail.' })),
    whyItFitsYou: 'It connects Economics and data analysis to a real problem.',
    startingSources: [{ title: 'Water', publisher: 'World Bank', url: 'https://www.worldbank.org/en/topic/water' }],
    rubric,
    checkpoints: [cp(1), cp(2), cp(3)],
  },
  Advanced: {
    projectType: 'App / Software',
    headline: 'A Clinic Queue You Can See From Home',
    standfirst: 'Long waits keep people away from care.',
    lede: 'Lede.', ledeSource: null,
    theProblem: 'Problem.', problemOptions: [],
    beneficiary: 'Patients at one local clinic.',
    yourMission: ['A working web app that shows queue length', 'Test results from 10 users'],
    steps: Array.from({ length: 3 }, (_, k) => ({ title: `Outcome ${k + 1}`, detail: 'Detail.' })),
    whyItFitsYou: 'It uses your coding and design skills.',
    startingSources: [{ title: 'Health', publisher: 'WHO', url: 'http://www.who.int/' }],
    rubric,
    checkpoints: [cp(1), cp(2), cp(3), cp(4)],
  },
};
