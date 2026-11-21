// Deterministic vocabulary matching. Scores represent skill coverage, never hiring probability.
const vocabulary = {
  JavaScript: ['javascript', 'js'], TypeScript: ['typescript', 'ts'], React: ['react', 'reactjs', 'react.js'],
  'Node.js': ['node.js', 'nodejs', 'node js'], Express: ['express', 'express.js', 'expressjs'],
  MongoDB: ['mongodb', 'mongo'], Python: ['python'], Java: ['java'], 'C++': ['c++'], 'C#': ['c#', 'c sharp'],
  SQL: ['sql'], PostgreSQL: ['postgresql', 'postgres'], MySQL: ['mysql'], Redis: ['redis'],
  HTML: ['html', 'html5'], CSS: ['css', 'css3'], Tailwind: ['tailwind', 'tailwindcss'],
  'Next.js': ['next.js', 'nextjs'], Vue: ['vue', 'vue.js'], Angular: ['angular'], Django: ['django'],
  Flask: ['flask'], Spring: ['spring', 'spring boot'], Git: ['git'], Docker: ['docker'],
  Kubernetes: ['kubernetes', 'k8s'], AWS: ['aws', 'amazon web services'], Azure: ['azure'],
  GCP: ['gcp', 'google cloud'], Linux: ['linux'], REST: ['rest', 'restful'], GraphQL: ['graphql'],
  TensorFlow: ['tensorflow'], PyTorch: ['pytorch'], 'Machine learning': ['machine learning'],
  Pandas: ['pandas'], NumPy: ['numpy'], Figma: ['figma'], Testing: ['jest', 'vitest', 'pytest', 'testing'],
};
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function extractSkills(value = '') {
  const input = value.replace(/<[^>]*>/g, ' ').toLowerCase();
  return Object.entries(vocabulary).filter(([, aliases]) => aliases.some(alias =>
    new RegExp(`(^|[^a-z0-9.])${escape(alias)}(?=$|[^a-z0-9+#])`, 'i').test(input),
  )).map(([skill]) => skill);
}
export function analyzeResume(value = '') {
  const skills = extractSkills(value);
  const experience = [...value.matchAll(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\b/gi)].map(match => Number(match[1])).filter(years => years <= 60);
  return { skills, experienceYears: experience.length ? Math.max(...experience) : null,
    suggestions: [
      ...(!skills.length ? ['Add explicit technical skills and relevant projects.'] : []),
      ...(!/\b\d+\s*%|\b(?:increased|reduced|improved|delivered)\b/i.test(value) ? ['Describe project outcomes with measurable results where accurate.'] : []),
      ...(!/\b(?:education|degree|bachelor|master|university)\b/i.test(value) ? ['Include your education or relevant training.'] : []),
      'Review extracted skills; vocabulary matching can miss synonyms and cannot verify experience.',
    ],
  };
}
export function matchJob(skills, job) {
  const required = extractSkills(`${job.title} ${job.description}`);
  const known = new Set(skills);
  const matchingSkills = required.filter(skill => known.has(skill));
  return { score: required.length ? Math.round(100 * matchingSkills.length / required.length) : null,
    matchingSkills, missingSkills: required.filter(skill => !known.has(skill)), requiredSkills: required,
    method: 'Recognized job skills matched / all recognized job skills × 100. Heuristic coverage, not a probability.',
  };
}
