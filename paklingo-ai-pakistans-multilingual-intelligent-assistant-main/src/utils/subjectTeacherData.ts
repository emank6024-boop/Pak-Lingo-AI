// Comprehensive Subject Metadata, Relevance Validation, and Subject-Strict Fallbacks
// Enforces Pakistani Board Curriculum standards (FBISE, Punjab, Sindh, KPK, Balochistan)

export interface SubjectConfig {
  id: string;
  name: string;
  icon: string;
  secondaryVisuals?: string[];
  category: 'STEM' | 'Humanities' | 'Languages';
  sampleQuestions: string[];
  quickPrompts?: string[];
  placeholder: string;
  placeholderPrompt?: string;
  keywords: string[];
  forbiddenKeywords: string[];
}

export const GRADES = [
  'Primary School (Class 1-5)',
  'Middle School (Class 6-8)',
  'Matric (Class 9-10)',
  'Intermediate (Class 11-12 / FSc)',
  'O/A Levels',
  'Undergraduate / University',
] as const;

export const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  'Computer Science': {
    id: 'computer_science',
    name: 'Computer Science',
    icon: '💻',
    secondaryVisuals: ['💻', '🖥️', '⚙️', '🧩', '🔐', '📱'],
    category: 'STEM',
    placeholder: 'e.g. What is OOP (Classes and Objects)? Or Explain Binary Search Algorithm',
    sampleQuestions: [
      'What is OOP and what are Classes and Objects?',
      'Difference between Compiler and Interpreter',
      'How does RAM differ from ROM memory?',
      'Explain Binary Search with step-by-step logic',
      'What is an Operating System and its core functions?',
    ],
    keywords: [
      'computer', 'programming', 'code', 'algorithm', 'software', 'hardware',
      'oop', 'object', 'class', 'method', 'function', 'variable', 'data structure',
      'loop', 'array', 'compiler', 'interpreter', 'cpu', 'memory', 'ram', 'rom',
      'database', 'network', 'operating system', 'binary', 'byte', 'syntax', 'logic'
    ],
    forbiddenKeywords: [
      'quadratic equation', 'quadratic formula', 'pythagoras theorem', 'trigonometr',
      'sin cos tan', 'hypotenuse', 'matrix determinant', 'differentiation calculus',
      'integration calculus', 'photosynthesis', 'chloroplast', 'mitochondria',
      'meiosis', 'mitosis', 'hemoglobin', 'digestive system', 'titration', 'molarity', 'covalent bond'
    ],
  },
  'Mathematics': {
    id: 'mathematics',
    name: 'Mathematics',
    icon: '🔢',
    secondaryVisuals: ['🔢', '➗', '📐', '📊', '📈'],
    category: 'STEM',
    placeholder: 'e.g. What is a Square Root? Or Solve quadratic equation 2x² + 5x - 3 = 0',
    sampleQuestions: [
      'What is a Square Root and how do you calculate it?',
      'How to solve a Quadratic Equation using the quadratic formula?',
      'Explain Pythagoras Theorem with geometric proof',
      'What are Matrices and how do you find the Determinant?',
      'Explain Trigonometric Ratios (sin, cos, tan) with right triangles',
    ],
    keywords: [
      'math', 'mathematics', 'number', 'equation', 'formula', 'algebra', 'geometry',
      'square root', 'quadratic', 'solve', 'calculate', 'matrix', 'determinant',
      'triangle', 'angle', 'pythagoras', 'theorem', 'ratio', 'fraction', 'derivative',
      'integral', 'graph', 'coordinate', 'factorization', 'polynomial'
    ],
    forbiddenKeywords: [
      'object-oriented programming', 'public static void', 'cout <<', 'def __init__',
      'class and object', 'operating system kernel', 'photosynthesis', 'cell wall',
      'mitochondria', 'titration', 'c++ class'
    ],
  },
  'Physics': {
    id: 'physics',
    name: 'Physics',
    icon: '⚛️',
    secondaryVisuals: ['⚛️', '🔬', '⚡', '📐'],
    category: 'STEM',
    placeholder: 'e.g. Explain Newton’s Laws of Motion with real-life examples',
    sampleQuestions: [
      'Explain Newton’s 3 Laws of Motion with everyday examples',
      'What is Ohm’s Law and how are Voltage, Current, and Resistance related?',
      'Difference between Speed and Velocity with scalar/vector concepts',
      'Explain Work, Energy, and the Principle of Conservation of Energy',
      'How does Reflection and Refraction of Light work in lenses?',
    ],
    keywords: [
      'physics', 'force', 'motion', 'newton', 'acceleration', 'velocity', 'gravity',
      'energy', 'work', 'power', 'ohm', 'voltage', 'current', 'resistance', 'wave',
      'frequency', 'reflection', 'refraction', 'thermodynamics', 'pressure', 'density'
    ],
    forbiddenKeywords: [
      'photosynthesis', 'digestive tract', 'cell membrane', 'algae', 'fungi',
      'compiler optimization', 'python syntax', 'oop polymorphism', 'quadratic equation'
    ],
  },
  'Chemistry': {
    id: 'chemistry',
    name: 'Chemistry',
    icon: '🧪',
    secondaryVisuals: ['🧪', '⚗️', '🔬'],
    category: 'STEM',
    placeholder: 'e.g. What is Chemical Bonding (Ionic vs Covalent Bonds)?',
    sampleQuestions: [
      'Difference between Ionic and Covalent Bonds with examples',
      'What is a Mole and how to use Avogadro’s Number in calculations?',
      'Explain Periodic Table trends (Electronegativity, Ionization Energy)',
      'Difference between Acids and Bases with the pH scale',
      'What are Isotopes and how are they used in real life?',
    ],
    keywords: [
      'chemistry', 'chemical', 'atom', 'molecule', 'bond', 'ionic', 'covalent',
      'periodic table', 'element', 'compound', 'reaction', 'mole', 'avogadro',
      'acid', 'base', 'ph', 'electron', 'proton', 'neutron', 'valence', 'solution'
    ],
    forbiddenKeywords: [
      'binary search algorithm', 'operating system paging', 'oop class inheritance',
      'photosynthesis chloroplast organelle', 'quadratic formula derivation', 'newton laws of motion'
    ],
  },
  'Biology': {
    id: 'biology',
    name: 'Biology',
    icon: '🧬',
    secondaryVisuals: ['🧬', '🔬', '🧫', '🌱'],
    category: 'STEM',
    placeholder: 'e.g. Explain Mitosis vs Meiosis with key differences for board exams',
    sampleQuestions: [
      'Explain Mitosis vs Meiosis with a comparison table',
      'How does Photosynthesis work in plant chloroplasts?',
      'What is the structure of human DNA and the double helix?',
      'Explain the Human Digestive System and enzyme functions',
      'Difference between Plant and Animal Cells with key organelles',
    ],
    keywords: [
      'biology', 'cell', 'organelle', 'mitochondria', 'mitosis', 'meiosis', 'dna',
      'gene', 'chromosome', 'photosynthesis', 'chloroplast', 'tissue', 'organ',
      'digestion', 'enzyme', 'respiration', 'plant', 'animal', 'ecology', 'blood'
    ],
    forbiddenKeywords: [
      'c++ compiler', 'sql database query', 'python loop syntax', 'quadratic equation formula',
      'newtonian friction vector', 'binary search algorithm'
    ],
  },
  'English Grammar': {
    id: 'english_grammar',
    name: 'English Grammar',
    icon: '📖',
    secondaryVisuals: ['📖', '✍️', '💬', '📚'],
    category: 'Languages',
    placeholder: 'e.g. Difference between Active and Passive Voice with board exam rules',
    sampleQuestions: [
      'Rules for converting Active Voice to Passive Voice with examples',
      'Direct and Indirect Speech rules (Narration) for board exams',
      'Explain all 12 English Tenses with timeline examples',
      'What are Conditional Sentences (Type 1, 2, and 3)?',
      'How to write an impressive formal essay and letter in exams?',
    ],
    keywords: [
      'english', 'grammar', 'tense', 'verb', 'noun', 'pronoun', 'adjective', 'adverb',
      'active voice', 'passive voice', 'direct speech', 'indirect speech', 'narration',
      'preposition', 'sentence', 'clause', 'vocabulary', 'idiom', 'comprehension'
    ],
    forbiddenKeywords: [
      'mitochondria cell', 'photosynthesis', 'quadratic formula', 'stoichiometry mole',
      'ohm law resistance', 'binary search'
    ],
  },
  'Pakistan Studies': {
    id: 'pakistan_studies',
    name: 'Pakistan Studies',
    icon: '🏛️',
    secondaryVisuals: ['🏛️', '🇵🇰', '📜', '🗺️'],
    category: 'Humanities',
    placeholder: 'e.g. Significance of the Lahore Resolution 1940 in the Pakistan Movement',
    sampleQuestions: [
      'What is the historical significance of the Lahore Resolution (23 March 1940)?',
      'Explain the Two-Nation Theory (دو قومی نظریہ) and Sir Syed Ahmad Khan’s role',
      'Key features of the 1973 Constitution of Pakistan',
      'Geographical significance of Pakistan in South Asia',
      'Major agricultural crops and irrigation network of Pakistan',
    ],
    keywords: [
      'pakistan', 'quaid-e-azam', 'allama iqbal', 'lahore resolution', '1940', '1947',
      'sir syed', 'two-nation theory', 'constitution', '1973', 'geography', 'indus river',
      'provinces', 'punjab', 'sindh', 'kpk', 'balochistan', 'kashmir', 'history'
    ],
    forbiddenKeywords: [
      'photosynthesis', 'c++ pointers', 'quadratic formula', 'stoichiometry'
    ],
  },
  'Islamic Studies': {
    id: 'islamic_studies',
    name: 'Islamic Studies',
    icon: '🌙',
    secondaryVisuals: ['🌙', '🕌', '📖', '🤲'],
    category: 'Humanities',
    placeholder: 'e.g. Explain the Five Pillars of Islam (ارکانِ اسلام) with Quranic references',
    sampleQuestions: [
      'Explain the Five Pillars of Islam (ارکانِ اسلام) and their importance',
      'What were the conditions and significance of the Treaty of Hudaibiyah (صلح حدیبیہ)?',
      'Significance of Zakat in eradicating poverty in Islamic society',
      'Compilation and preservation of the Holy Quran during the Khulafa-e-Rashideen',
      'Rights of neighbors and parents in Islam (حقوق العباد)',
    ],
    keywords: [
      'islam', 'islamic', 'quran', 'hadith', 'sunnah', 'prophet', 'tauheed', 'namaz',
      'zakat', 'roza', 'hajj', 'hudaibiyah', 'khilafat', 'rashideen', 'huqooq', 'akhlaq'
    ],
    forbiddenKeywords: [
      'binary search algorithm', 'photosynthesis organelle', 'quadratic equation'
    ],
  },
  'Urdu Adab': {
    id: 'urdu_adab',
    name: 'Urdu Adab',
    icon: '🖋️',
    secondaryVisuals: ['🖋️', '📜', '📚', '✍️'],
    category: 'Languages',
    placeholder: 'e.g. Difference between Radif and Qafia (ردیف و قافیہ) with poetry examples',
    sampleQuestions: [
      'ردیف اور قافیہ میں کیا فرق ہے؟ مثالوں کے ساتھ وضاحت کریں',
      'تشبیہ اور استعارہ کی تعریف اور امتحانی مثالیں',
      'علامہ اقبال کی شاعری کا بنیادی پیغام (خودی کا تصور)',
      'خط لکھنے کا درست امتحانی طریقہ اور نمبروں کی تقسیم',
      'سبق کا خلاصہ لکھنے کے اہم اصول',
    ],
    keywords: [
      'urdu', 'adab', 'shairi', 'ghazal', 'nazm', 'radif', 'qafia', 'tashbih',
      'istehara', 'iqbal', 'ghalib', 'mir', 'khulasa', 'mazmoon', 'qawaid', 'muhavare'
    ],
    forbiddenKeywords: [
      'binary search algorithm', 'c++ class object', 'photosynthesis chloroplast'
    ],
  },
  'General Science': {
    id: 'general_science',
    name: 'General Science',
    icon: '🔬',
    secondaryVisuals: ['🔬', '🧪', '🌍', '⚡'],
    category: 'STEM',
    placeholder: 'e.g. Explain the Water Cycle or States of Matter (Solid, Liquid, Gas)',
    sampleQuestions: [
      'Explain the three states of matter (Solid, Liquid, Gas) and phase changes',
      'What is the Water Cycle and how does Evaporation and Condensation work?',
      'Difference between Renewable and Non-renewable Energy sources',
      'How does the Human Circulatory System transport oxygen?',
      'Basic components of the Solar System and planetary orbits',
    ],
    keywords: [
      'science', 'matter', 'solid', 'liquid', 'gas', 'water cycle', 'energy',
      'solar system', 'planet', 'earth', 'atmosphere', 'ecosystem', 'heat', 'light'
    ],
    forbiddenKeywords: [
      'python oop class inheritance', 'c++ memory pointers'
    ],
  },
};

// Retrieve subject metadata with safe fallback
export function getSubjectMeta(subjectName: string): SubjectConfig & { quickPrompts: string[] } {
  const match = Object.values(SUBJECT_CONFIGS).find(
    (c) => c.name.toLowerCase() === (subjectName || '').toLowerCase()
  );
  const found = match || Object.values(SUBJECT_CONFIGS).find((c) =>
    (subjectName || '').toLowerCase().includes(c.id.replace('_', ''))
  ) || SUBJECT_CONFIGS['General Science'];

  return {
    ...found,
    quickPrompts: found.quickPrompts && found.quickPrompts.length > 0 ? found.quickPrompts : found.sampleQuestions,
    placeholderPrompt: found.placeholderPrompt || found.placeholder,
  };
}

export const getSubjectConfig = getSubjectMeta;

// Subject Relevance Validation
export function validateSubjectRelevance(
  text: string,
  subject: string,
  question: string = ''
): { isRelevant: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { isRelevant: false, reason: 'Empty response received.' };
  }

  const config = getSubjectMeta(subject);
  const lower = text.toLowerCase();
  const qLower = (question || '').toLowerCase();
  const sName = config.name.toLowerCase();

  // If question explicitly asks to compare fields (e.g. "relation between math and computer science"), allow cross-terms
  if (qLower.includes('compare') || qLower.includes('relation') || qLower.includes('connection') || qLower.includes('difference between')) {
    return { isRelevant: true };
  }

  // Count domain-relevant keywords
  let relevantHits = 0;
  for (const k of config.keywords) {
    if (lower.includes(k.toLowerCase())) {
      relevantHits++;
    }
  }

  // 1. Specific Check: Computer Science must NOT contain pure Mathematics or Biology
  if (sName.includes('computer') || sName.includes('cs')) {
    const mathSpecifics = [
      'quadratic equation', 'quadratic formula', 'pythagoras theorem',
      'hypotenuse', 'trigonometr', 'sin(', 'cos(', 'tan(', 'right triangle',
      'determinant of matrix', 'integration by parts', 'derivative of function',
      'differentiation with respect to'
    ];
    const mathHits = mathSpecifics.filter((m) => lower.includes(m)).length;
    if (mathHits >= 1 && relevantHits < 2) {
      return {
        isRelevant: false,
        reason: 'Response contained Mathematics topics instead of Computer Science.',
      };
    }

    const bioSpecifics = ['photosynthesis', 'chloroplast', 'mitochondria', 'meiosis', 'mitosis', 'digestive system'];
    const bioHits = bioSpecifics.filter((b) => lower.includes(b)).length;
    if (bioHits >= 1 && relevantHits < 2) {
      return {
        isRelevant: false,
        reason: 'Response contained Biology topics instead of Computer Science.',
      };
    }
  }

  // 2. Specific Check: Mathematics must NOT contain Programming Code or Biology
  if (sName.includes('math')) {
    const csSpecifics = [
      'class student:', 'public static void main', 'def __init__',
      'object-oriented programming', 'oop inheritance', 'operating system kernel',
      '#include <iostream>', 'console.log'
    ];
    const csHits = csSpecifics.filter((c) => lower.includes(c)).length;
    if (csHits >= 1 && relevantHits < 2) {
      return {
        isRelevant: false,
        reason: 'Response contained Computer Science programming instead of Mathematics.',
      };
    }

    const bioSpecifics = ['photosynthesis', 'mitochondria', 'cell wall', 'digestive tract'];
    const bioHits = bioSpecifics.filter((b) => lower.includes(b)).length;
    if (bioHits >= 1 && relevantHits < 2) {
      return {
        isRelevant: false,
        reason: 'Response contained Biology topics instead of Mathematics.',
      };
    }
  }

  // 3. Specific Check: Physics must NOT be pure Biology or pure Chemistry
  if (sName.includes('physic')) {
    const bioHits = ['photosynthesis', 'chloroplast', 'mitochondria', 'digestive system'].filter((b) => lower.includes(b)).length;
    if (bioHits >= 2 && relevantHits < 2) {
      return {
        isRelevant: false,
        reason: 'Response discussed Biology instead of Physics.',
      };
    }
  }

  // 4. Specific Check: Biology must NOT be pure CS code or pure Calculus
  if (sName.includes('bio')) {
    const csHits = ['class student:', 'def __init__', 'public static void', 'binary search algorithm'].filter((c) => lower.includes(c)).length;
    if (csHits >= 1 && relevantHits < 2) {
      return {
        isRelevant: false,
        reason: 'Response discussed Computer Science instead of Biology.',
      };
    }
  }

  // General check forbidden keywords
  let forbiddenHits = 0;
  for (const f of config.forbiddenKeywords) {
    if (lower.includes(f.toLowerCase())) {
      forbiddenHits++;
    }
  }

  // Flag if response contains strong forbidden signals without enough domain keywords
  if ((forbiddenHits >= 2 && relevantHits < 2) || (forbiddenHits >= 1 && relevantHits === 0)) {
    return {
      isRelevant: false,
      reason: `Response discussed unrelated concepts instead of ${config.name}.`,
    };
  }

  return { isRelevant: true };
}

// Verified, Syllabus-Aligned Fallback Quiz Questions strictly per subject
export function getSubjectFallbackQuiz(
  subject: string,
  topic?: string
): Array<{ question: string; options: string[]; correctIndex: number; explanation: string }> {
  const meta = getSubjectMeta(subject);

  if (meta.name === 'Computer Science') {
    return [
      {
        question: 'In Object-Oriented Programming (OOP), what is the relationship between a Class and an Object?',
        options: [
          'A Class is an instance of an Object',
          'A Class is a blueprint, and an Object is a real-world instance created from it',
          'Classes and Objects are identical with no technical difference',
          'An Object creates data types for compilers while Classes execute in RAM',
        ],
        correctIndex: 1,
        explanation: 'In Computer Science, a Class acts as a blueprint or template defining properties and behaviors, while an Object is an instantiated instance of that blueprint.',
      },
      {
        question: 'Which of the following describes the key difference between a Compiler and an Interpreter?',
        options: [
          'A Compiler translates source code line-by-line, whereas an Interpreter translates all code at once',
          'A Compiler translates the entire program into machine code before execution, while an Interpreter executes line-by-line',
          'Compilers are only used for hardware circuits while Interpreters write software',
          'An Interpreter produces a standalone .exe binary file on disk',
        ],
        correctIndex: 1,
        explanation: 'A Compiler analyzes and translates the entire program into machine code at once before runtime, whereas an Interpreter executes statements line-by-line.',
      },
      {
        question: 'What is the time complexity of searching a sorted array using Binary Search?',
        options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
        correctIndex: 2,
        explanation: 'Binary Search repeatedly divides the search interval in half, giving a logarithmic time complexity of O(log n).',
      },
      {
        question: 'Why is RAM referred to as "Volatile Memory" in computer architecture?',
        options: [
          'It permanently stores firmware instructions forever',
          'It loses all stored data when computer power is switched off',
          'It cannot read or write data quickly',
          'It is physically located on an external hard drive',
        ],
        correctIndex: 1,
        explanation: 'RAM is volatile memory because it requires continuous electrical power to maintain its stored state; powering down erases its contents.',
      },
    ];
  }

  if (meta.name === 'Mathematics') {
    return [
      {
        question: 'What is the principal square root of 144?',
        options: ['12', '-12', '14.4', '72'],
        correctIndex: 0,
        explanation: 'Since 12 × 12 = 144, the principal positive square root is 12.',
      },
      {
        question: 'In the quadratic formula x = (-b ± √(b² - 4ac)) / (2a), what is the term (b² - 4ac) called?',
        options: ['Determinant', 'Discriminant', 'Radicand Coefficient', 'Hypotenuse'],
        correctIndex: 1,
        explanation: 'The term (b² - 4ac) is the Discriminant. If it is positive, the roots are real and unequal; if zero, equal; if negative, complex/imaginary.',
      },
      {
        question: 'According to the Pythagoras Theorem for a right-angled triangle with hypotenuse c and legs a and b:',
        options: ['a² + b² = c²', 'a + b = c', 'c² = a² - b²', 'a² × b² = c²'],
        correctIndex: 0,
        explanation: 'Pythagoras theorem states that in any right triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a² + b² = c².',
      },
      {
        question: 'If a 2×2 Matrix has elements [[2, 4], [1, 3]], what is its determinant?',
        options: ['2', '6', '10', '14'],
        correctIndex: 0,
        explanation: 'For matrix [[a, b], [c, d]], det = (ad - bc). Here det = (2×3 - 4×1) = (6 - 4) = 2.',
      },
    ];
  }

  if (meta.name === 'Physics') {
    return [
      {
        question: 'What is the fundamental SI unit of Force in Physics?',
        options: ['Joule (J)', 'Newton (N)', 'Watt (W)', 'Pascal (Pa)'],
        correctIndex: 1,
        explanation: 'Newton (N) is the SI unit of force, defined as 1 kg·m/s² according to Newton’s second law F = ma.',
      },
      {
        question: 'According to Newton’s First Law of Motion, an object at rest will remain at rest unless acted upon by:',
        options: ['Internal heat', 'A net unbalanced external force', 'Atmospheric friction', 'Gravitational potential'],
        correctIndex: 1,
        explanation: 'Newton’s First Law (Law of Inertia) states that a body continues in its state of rest or uniform motion unless compelled by a net external force.',
      },
      {
        question: 'In Ohm’s Law, how are Voltage (V), Current (I), and Resistance (R) mathematically related?',
        options: ['V = I × R', 'V = I / R', 'I = V × R', 'R = V × I'],
        correctIndex: 0,
        explanation: 'Ohm’s law states that current through a conductor is directly proportional to voltage across it: V = I × R.',
      },
      {
        question: 'What is the approximate acceleration due to gravity (g) near the surface of the Earth?',
        options: ['9.8 m/s²', '3.0 × 10⁸ m/s²', '1.6 m/s²', '98 m/s²'],
        correctIndex: 0,
        explanation: 'Standard acceleration due to Earth’s gravity is approximately 9.8 m/s² (frequently rounded to 10 m/s² for numerical estimates).',
      },
    ];
  }

  if (meta.name === 'Chemistry') {
    return [
      {
        question: 'What type of chemical bond is formed when electrons are completely transferred from a metal to a non-metal?',
        options: ['Covalent bond', 'Ionic (electrovalent) bond', 'Hydrogen bond', 'Metallic bond'],
        correctIndex: 1,
        explanation: 'An ionic bond is formed by the complete electrostatic transfer of one or more electrons from a metal (forming a cation) to a non-metal (forming an anion).',
      },
      {
        question: 'What is the value of Avogadro’s number representing 1 mole of any chemical substance?',
        options: ['6.022 × 10²³', '3.00 × 10⁸', '1.602 × 10⁻¹⁹', '9.109 × 10⁻³¹'],
        correctIndex: 0,
        explanation: 'One mole of any substance contains exactly 6.022 × 10²³ elementary entities (atoms, molecules, or ions).',
      },
      {
        question: 'On the pH scale at 25°C, which range represents an Acidic solution?',
        options: ['pH = 7', 'pH < 7', 'pH > 7', 'pH between 8 and 14'],
        correctIndex: 1,
        explanation: 'A pH value less than 7 indicates an acidic solution (high H⁺ ion concentration), while pH 7 is neutral and pH > 7 is basic/alkaline.',
      },
      {
        question: 'How does electronegativity generally trend across a period from left to right in the Periodic Table?',
        options: [
          'It decreases steadily',
          'It increases steadily due to higher effective nuclear charge',
          'It remains completely constant',
          'It drops to zero for all halogens',
        ],
        correctIndex: 1,
        explanation: 'Across a period from left to right, effective nuclear charge increases and atomic radius decreases, causing electronegativity to increase.',
      },
    ];
  }

  if (meta.name === 'Biology') {
    return [
      {
        question: 'Which cellular organelle is known as the "Powerhouse of the Cell"?',
        options: ['Ribosome', 'Mitochondria', 'Golgi Apparatus', 'Endoplasmic Reticulum'],
        correctIndex: 1,
        explanation: 'Mitochondria generate adenosine triphosphate (ATP), the primary energy currency of the cell, through cellular respiration.',
      },
      {
        question: 'In eukaryotic cells, during which cell division process do daughter cells have half the chromosome number (haploid)?',
        options: ['Mitosis', 'Meiosis', 'Binary Fission', 'Budding'],
        correctIndex: 1,
        explanation: 'Meiosis is a reduction division resulting in four genetically diverse haploid daughter cells (gametes).',
      },
      {
        question: 'Which green pigment in plant chloroplasts absorbs sunlight energy during photosynthesis?',
        options: ['Chlorophyll', 'Hemoglobin', 'Carotene', 'Anthocyanin'],
        correctIndex: 0,
        explanation: 'Chlorophyll is the primary green pigment in chloroplast thylakoids that absorbs light photons for photosynthesis.',
      },
      {
        question: 'What are the four nitrogenous bases found in a DNA molecule?',
        options: [
          'Adenine, Thymine, Cytosine, Guanine (A, T, C, G)',
          'Adenine, Uracil, Cytosine, Guanine (A, U, C, G)',
          'Ribose, Deoxyribose, Phosphate, Lipid',
          'Glucose, Fructose, Sucrose, Galactose',
        ],
        correctIndex: 0,
        explanation: 'DNA contains Adenine (A), Thymine (T), Cytosine (C), and Guanine (G), with A pairing with T, and C pairing with G.',
      },
    ];
  }

  if (meta.name === 'English Grammar') {
    return [
      {
        question: 'What is the correct Passive Voice for: "The teacher delivered the lesson"?',
        options: [
          'The lesson was delivered by the teacher',
          'The lesson had been delivered by the teacher',
          'The lesson is delivered by the teacher',
          'The teacher was delivering the lesson',
        ],
        correctIndex: 0,
        explanation: 'In past simple active ("delivered"), passive voice uses "was/were + past participle (V3)": "The lesson was delivered by the teacher".',
      },
      {
        question: 'Identify the Part of Speech of the word "quickly" in: "He solved the equation quickly."',
        options: ['Adjective', 'Adverb of Manner', 'Preposition', 'Conjunction'],
        correctIndex: 1,
        explanation: '"Quickly" modifies the verb "solved", describing how the action was performed, making it an Adverb of Manner.',
      },
      {
        question: 'In Direct & Indirect Speech, how does "now" change when the reporting verb is in the past tense?',
        options: ['Tomorrow', 'Then', 'Here', 'Before'],
        correctIndex: 1,
        explanation: 'In indirect speech with a past reporting verb, the time expression "now" converts to "then".',
      },
      {
        question: 'Which sentence demonstrates the First Conditional correctly?',
        options: [
          'If it rains tomorrow, we will stay at home.',
          'If it rained, we would stayed at home.',
          'If it had rained, we would have stay at home.',
          'If it will rain, we will stay at home.',
        ],
        correctIndex: 0,
        explanation: 'First Conditional structure is: If + present simple, will + base verb ("If it rains tomorrow, we will stay at home").',
      },
    ];
  }

  // Default / General Science fallback
  return [
    {
      question: `What is the foundational concept when studying ${meta.name}?`,
      options: [
        'Systematic observation and evidence-based principles',
        'Memorizing answers without conceptual understanding',
        'Skipping diagrams and board exam formulas',
        'Only reading without practice exercises',
      ],
      correctIndex: 0,
      explanation: `Studying ${meta.name} requires understanding foundational laws, accurate terminology, and methodical problem-solving.`,
    },
    {
      question: `In board examinations (FBISE / BISE), how can a student maximize marks in ${meta.name}?`,
      options: [
        'Write clear headings, labeled diagrams, and step-by-step working',
        'Avoid writing formulas or units',
        'Write long unstructured paragraphs with no bullet points',
        'Only attempt half the question',
      ],
      correctIndex: 0,
      explanation: 'Pakistani board examiners reward structured responses with neat headings, correct units/formulas, and clean labeled diagrams.',
    },
  ];
}

// Verified, Syllabus-Aligned Fallback Flashcards strictly per subject
export function getSubjectFallbackFlashcards(
  subject: string,
  topic?: string
): Array<{ front: string; back: string; category?: string; notes?: string }> {
  const meta = getSubjectMeta(subject);

  if (meta.name === 'Computer Science') {
    return [
      {
        front: 'What is a Class in Object-Oriented Programming (OOP)?',
        back: 'A Class is a user-defined blueprint or prototype from which objects are created. It groups attributes (data) and methods (functions).',
        category: 'Computer Science',
        notes: 'Example: Car class with attributes (color, speed) and methods (drive(), brake()).',
      },
      {
        front: 'What is an Object in OOP?',
        back: 'An Object is a concrete, real-world instance of a class that occupies memory and possesses state and behavior.',
        category: 'Computer Science',
        notes: 'Key board term: "Instantiation" is creating an object from a class.',
      },
      {
        front: 'Difference between RAM and ROM',
        back: 'RAM is volatile read/write working memory for active programs. ROM is non-volatile read-only memory holding permanent boot instructions (BIOS/firmware).',
        category: 'Computer Science',
        notes: 'Exam tip: RAM loses contents on power outage; ROM persists forever.',
      },
      {
        front: 'What is an Algorithm in Computer Science?',
        back: 'A step-by-step, finite sequence of well-defined instructions to solve a specific computational problem or produce an output.',
        category: 'Computer Science',
        notes: 'Characteristics: Input, Output, Definiteness, Finiteness, Effectiveness.',
      },
      {
        front: 'Compiler vs. Interpreter',
        back: 'A Compiler translates the entire source code into machine code at once before execution. An Interpreter executes source code line-by-line.',
        category: 'Computer Science',
        notes: 'C++ uses a compiler (fast execution); Python uses an interpreter (rapid debugging).',
      },
    ];
  }

  if (meta.name === 'Mathematics') {
    return [
      {
        front: 'What is a Square Root (√x)?',
        back: 'A number y such that y² = x. For example, √49 = 7 because 7 × 7 = 49.',
        category: 'Mathematics',
        notes: 'Principal square root is always the non-negative root.',
      },
      {
        front: 'The Quadratic Formula for ax² + bx + c = 0',
        back: 'x = [-b ± √(b² - 4ac)] / (2a)',
        category: 'Mathematics',
        notes: 'Board tip: (b² - 4ac) is the Discriminant determining the nature of roots.',
      },
      {
        front: 'Pythagoras Theorem Formula',
        back: 'c² = a² + b² (in any right-angled triangle, where c is the hypotenuse opposite to 90°).',
        category: 'Mathematics',
        notes: 'Common triples: (3, 4, 5) and (5, 12, 13).',
      },
      {
        front: 'Determinant of a 2×2 Matrix [a, b; c, d]',
        back: 'det(A) = |A| = (a × d) - (b × c)',
        category: 'Mathematics',
        notes: 'If det(A) = 0, the matrix is Singular and has NO inverse.',
      },
      {
        front: 'Trigonometric Ratios in a Right Triangle',
        back: 'sin(θ) = Opp/Hyp | cos(θ) = Adj/Hyp | tan(θ) = Opp/Adj',
        category: 'Mathematics',
        notes: 'Mnemonic: SOH CAH TOA (Some People Have, Curly Brown Hair, Through Proper Brushing).',
      },
    ];
  }

  if (meta.name === 'Physics') {
    return [
      {
        front: 'Newton’s Second Law of Motion',
        back: 'F = m × a (Force equals mass multiplied by acceleration). SI unit is Newton (N = kg·m/s²).',
        category: 'Physics',
        notes: 'Acceleration is directly proportional to net force and inversely proportional to mass.',
      },
      {
        front: 'Ohm’s Law Formula & Definition',
        back: 'V = I × R (Voltage = Current × Resistance). Current through a conductor is proportional to voltage across it at constant temperature.',
        category: 'Physics',
        notes: 'Slope of a V-I graph represents Resistance (R).',
      },
      {
        front: 'Law of Conservation of Energy',
        back: 'Energy can neither be created nor destroyed; it can only be transformed from one form to another. Total energy of an isolated system remains constant.',
        category: 'Physics',
        notes: 'Total Mechanical Energy E = Potential Energy (mgh) + Kinetic Energy (½mv²).',
      },
      {
        front: 'Difference: Speed vs. Velocity',
        back: 'Speed is a scalar quantity measuring rate of distance covered (m/s). Velocity is a vector quantity measuring rate of displacement with direction.',
        category: 'Physics',
        notes: 'Velocity can be negative or zero even when speed is positive.',
      },
      {
        front: 'Snell’s Law of Refraction',
        back: 'n₁ sin(θ₁) = n₂ sin(θ₂) (Refractive index ratio equals sine of incidence angle over sine of refraction angle).',
        category: 'Physics',
        notes: 'When light moves from rarer to denser medium, it bends towards the normal.',
      },
    ];
  }

  if (meta.name === 'Chemistry') {
    return [
      {
        front: 'Ionic Bond vs. Covalent Bond',
        back: 'Ionic bond: Complete electrostatic transfer of electrons between metal and non-metal. Covalent bond: Mutual sharing of electron pairs between non-metals.',
        category: 'Chemistry',
        notes: 'NaCl is ionic (Na⁺ and Cl⁻); H₂O and CH₄ are covalent.',
      },
      {
        front: 'What is a Mole in Chemistry?',
        back: 'Amount of substance containing 6.022 × 10²³ particles (Avogadro’s Number). Number of moles n = Mass in grams / Molar Mass.',
        category: 'Chemistry',
        notes: '1 mole of Carbon-12 weighs exactly 12 grams.',
      },
      {
        front: 'The pH Scale Definition',
        back: 'pH = -log₁₀[H⁺]. Range 0–14: pH < 7 is acidic, pH = 7 is neutral, pH > 7 is basic/alkaline.',
        category: 'Chemistry',
        notes: 'Each 1 unit change in pH represents a 10-fold change in H⁺ concentration.',
      },
      {
        front: 'What are Isotopes?',
        back: 'Atoms of the same element having the same atomic number (protons) but different mass numbers (neutrons).',
        category: 'Chemistry',
        notes: 'Hydrogen has 3 isotopes: Protium (¹H), Deuterium (²H), Tritium (³H).',
      },
      {
        front: 'Periodic Table: Electronegativity Trend',
        back: 'Increases across a period (left to right) due to increasing nuclear charge. Decreases down a group due to added electron shielding shells.',
        category: 'Chemistry',
        notes: 'Fluorine (F) is the most electronegative element (value 4.0).',
      },
    ];
  }

  if (meta.name === 'Biology') {
    return [
      {
        front: 'Mitochondria Function',
        back: 'Produces cellular energy (ATP) through aerobic cellular respiration. Known as the powerhouse of the cell.',
        category: 'Biology',
        notes: 'Contains its own circular DNA and double-membrane cristae folds.',
      },
      {
        front: 'Mitosis vs. Meiosis',
        back: 'Mitosis: 1 division → 2 identical diploid (2n) somatic cells for growth/repair. Meiosis: 2 divisions → 4 diverse haploid (n) gamete cells for reproduction.',
        category: 'Biology',
        notes: 'Board table comparison: Crossing over occurs only in Meiosis I.',
      },
      {
        front: 'Photosynthesis Chemical Equation',
        back: '6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂ (Carbon dioxide and water produce glucose and oxygen).',
        category: 'Biology',
        notes: 'Light reactions take place in thylakoids; dark reactions (Calvin cycle) in stroma.',
      },
      {
        front: 'DNA Base Pairing Rules (Chargaff’s Rule)',
        back: 'Adenine (A) pairs with Thymine (T) via 2 hydrogen bonds. Cytosine (C) pairs with Guanine (G) via 3 hydrogen bonds.',
        category: 'Biology',
        notes: 'In RNA, Uracil (U) replaces Thymine (T).',
      },
      {
        front: 'Plant vs. Animal Cells: Key Differences',
        back: 'Plant cells possess a rigid cellulose cell wall, large central vacuole, and chloroplasts. Animal cells lack cell walls and chloroplasts.',
        category: 'Biology',
        notes: 'Animal cells have centrioles; plant cells generally do not.',
      },
    ];
  }

  // Generic fallback
  return [
    {
      front: `Core Principle of ${meta.name}`,
      back: `Understanding fundamental definitions, standard board units, and practical real-world applications in Pakistani curriculum standards.`,
      category: meta.name,
      notes: 'Review regularly before board examinations for maximum retention.',
    },
  ];
}

// Verified Structured Fallback Lesson Answer strictly per subject
export function getSubjectFallbackAnswer(
  subject: string,
  gradeOrQuestion: string = 'Matric (Class 9-10)',
  questionText?: string
): string {
  const grade = questionText !== undefined ? gradeOrQuestion : 'Matric (Class 9-10)';
  const question = questionText !== undefined ? questionText : gradeOrQuestion;
  const meta = getSubjectMeta(subject);

  if (meta.name === 'Computer Science') {
    return `### 📚 Concept: Understanding ${question || 'Object-Oriented Programming (OOP)'}

In **Computer Science (${grade})**, ${question.toLowerCase().includes('oop') ? '**Object-Oriented Programming (OOP)** is a programming paradigm that organizes software design around data (objects) rather than functions and logic.' : `this topic is a fundamental pillar of computing and software design.`}

### 💡 Easy Idea
Think of a blueprint for a building versus the physical building itself:
• The blueprint is the **Class** (defines dimensions, rooms, doors).
• The physical building on the street is the **Object** (real, occupies physical space).

### 🧠 How It Works
1. **Definition & Declaration**: Programmers define attributes (variables) and methods (functions) inside a class.
2. **Instantiation**: The \`new\` keyword or constructor allocates memory in RAM to create a distinct object.
3. **Execution**: Objects interact by calling each other’s methods and passing arguments.

### 💻 Real-Life Example
Imagine a Pakistani ride-sharing or delivery mobile application:
• **Class \`Vehicle\`**: Properties include \`licensePlate\`, \`driverName\`, \`fuelLevel\`.
• **Object \`rickshaw1\`**: Has specific values \`licensePlate = "LE-1234"\`, \`fuelLevel = 85%\`.
• **Methods**: \`startTrip()\`, \`calculateFare()\`.

\`\`\`python
# Simple Python Implementation of Class and Object
class Student:
    def __init__(self, name, roll_no, grade):
        self.name = name          # Property (Attribute)
        self.roll_no = roll_no    # Property
        self.grade = grade

    def display_details(self):     # Method (Behavior)
        print(f"Student: {self.name} | Roll No: {self.roll_no} | Class: {self.grade}")

# Creating (Instantiating) Objects
student_1 = Student("Ahmed Khan", 101, "Matric 10th")
student_1.display_details()
\`\`\`

### 🎯 Key Points
• **Classes** are blueprints; **Objects** are instances in memory.
• Promotes **reusability**, **maintainability**, and **modular software architecture**.
• Core OOP principles include **Encapsulation**, **Inheritance**, **Polymorphism**, and **Abstraction**.

### 📝 Exam Tip
In FBISE and BISE board exams, always draw a neat UML diagram or write a 5-line clean code snippet with comments to secure full marks on long questions.

### ⚠️ Common Mistake
Students often confuse the **Class** with the **Object**. Remember: A Class takes no storage space for data; only instantiating an Object allocates actual RAM memory.`;
  }

  if (meta.name === 'Mathematics') {
    return `### 📚 Concept: ${question || 'Mathematical Principles'}

In **Mathematics (${grade})**, understanding the foundational definition and step-by-step algebraic procedure is essential for accurate problem solving.

### 💡 Easy Idea
Mathematics builds on reciprocal relationships. For instance, addition is undone by subtraction, multiplication by division, and squaring a number (x²) is undone by taking its **Square Root (√x)**.

### 🧠 How It Works
1. **Identify the Given Values**: State the variables and known parameters clearly.
2. **Apply the Standard Formula**: Write the relevant algebraic equation or theorem.
3. **Step-by-Step Substitution**: Carefully substitute values, observing negative signs.
4. **Final Verification**: Double-check the answer by plugging it back into the original expression.

### 🔢 Real-Life Example
Calculating dimensions of a square plot of land in Pakistan:
If a residential square plot in Lahore has a total area of 400 square meters, the length of each side is:
Side = √400 = 20 meters.

### 🎯 Key Points
• Always write the governing formula before performing calculations.
• Keep units clearly marked in each step.
• Verify whether positive and negative roots both apply to the context.

### 📝 Exam Tip
FBISE board marking schemes allocate distinct marks for the formula (1 mark), substitutions (1 mark), and the final answer with units (1 mark). Never jump straight to the final number.

### ⚠️ Common Mistake
Forgetting that quadratic equations yield **two** solutions (±) in pure algebra, whereas physical measurements (distance, time) only take the positive value.`;
  }

  // General STEM fallback
  return `### 📚 Concept: ${question || meta.name}

In **${meta.name} (${grade})**, mastering core concepts step-by-step is the key to academic excellence in Pakistani board examinations.

### 💡 Easy Idea
Every major scientific and academic principle starts from an intuitive real-world observation. Breaking complex terms into simple everyday examples helps build long-term memory.

### 🧠 How It Works
1. **Core Definition**: Grasp the precise scientific or grammatical definition.
2. **Governing Law / Rule**: Understand the cause-and-effect relationship or formula.
3. **Application**: Apply the concept to solve board numericals or short analytical questions.

### ${meta.icon} Real-Life Example
Connecting textbook theory with relatable phenomena observed across Pakistan—such as energy conservation in hydel dams (Tarbela/Mangla), local agriculture, or everyday machinery.

### 🎯 Key Points
• Master exact board syllabus definitions and standard SI units.
• Practice labeled diagrams neatly with a pencil and ruler.
• Focus on conceptual past paper questions (FBISE / BISE).

### 📝 Exam Tip
Structure your answer using clean headings: Definition, Formula, Diagram, and Practical Example. This visual layout immediately earns full credit from board examiners.`;
}
