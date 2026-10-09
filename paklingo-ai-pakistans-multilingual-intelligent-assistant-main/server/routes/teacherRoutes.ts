import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';
import { getGlobalLanguageDirective } from '../languageDirectives.js';

export const teacherRouter = Router();

// Helper for Educational Language Prompting
export function getEducationLanguageInstruction(lang?: string): string {
  const baseDirective = getGlobalLanguageDirective(lang || 'ur');
  return `${baseDirective}
ADDITIONAL EDUCATIONAL INSTRUCTION:
Provide pedagogical, structured explanations with key academic/technical terminology included in parentheses where helpful for Pakistani board/curriculum students (FBISE, Punjab, Sindh, KPK, Balochistan). Ensure the entire explanation is given in the requested language.`;
}

// Subject Visual Meta and Domain Boundaries for Teacher
export function getSubjectVisual(subject: string): { icon: string; name: string; domainHint: string; isCS: boolean } {
  const s = (subject || '').toLowerCase();
  if (s.includes('computer') || s.includes('cs') || s.includes('programming') || s.includes('software') || s.includes('it')) {
    return {
      icon: '💻',
      name: 'Computer Science',
      domainHint: 'computing, programming, algorithms, OOP, data structures, computer hardware, operating systems, networking',
      isCS: true,
    };
  }
  if (s.includes('math')) {
    return {
      icon: '🔢',
      name: 'Mathematics',
      domainHint: 'mathematics, algebra, geometry, trigonometry, arithmetic, calculus, equations, matrices, statistics',
      isCS: false,
    };
  }
  if (s.includes('physic')) {
    return {
      icon: '⚛️',
      name: 'Physics',
      domainHint: 'physics, mechanics, motion, forces, energy, thermodynamics, optics, electricity, electromagnetism',
      isCS: false,
    };
  }
  if (s.includes('chem')) {
    return {
      icon: '🧪',
      name: 'Chemistry',
      domainHint: 'chemistry, periodic table, chemical bonds, reactions, organic, inorganic, states of matter, stoichiometry',
      isCS: false,
    };
  }
  if (s.includes('bio')) {
    return {
      icon: '🧬',
      name: 'Biology',
      domainHint: 'biology, cells, genetics, ecology, botany, zoology, physiology, human organ systems, enzymes',
      isCS: false,
    };
  }
  if (s.includes('english')) {
    return {
      icon: '📖',
      name: 'English Grammar',
      domainHint: 'English grammar, vocabulary, tenses, active/passive voice, direct/indirect speech, essay writing, comprehension',
      isCS: false,
    };
  }
  if (s.includes('urdu')) {
    return {
      icon: '🖋️',
      name: 'Urdu Adab',
      domainHint: 'Urdu grammar, qawaid, adab, nazm, ghazal, khulasa, mazmoon, tashbih, istehara',
      isCS: false,
    };
  }
  if (s.includes('pak') || s.includes('pakistan')) {
    return {
      icon: '🏛️',
      name: 'Pakistan Studies',
      domainHint: 'history of Pakistan, 1940 resolution, 1973 constitution, geography, natural resources, agriculture',
      isCS: false,
    };
  }
  if (s.includes('islami') || s.includes('islamic')) {
    return {
      icon: '🌙',
      name: 'Islamic Studies',
      domainHint: 'Pillars of Islam, Quran, Sunnah, Hadith, Islamic history, ethics, rights in Islam',
      isCS: false,
    };
  }
  return {
    icon: '🔬',
    name: subject || 'General Science',
    domainHint: 'foundational scientific concepts, syllabus definitions, everyday science',
    isCS: false,
  };
}

// Subject Relevance Validation
export function isResponseRelevantToSubject(text: string, subject: string, question: string): { isRelevant: boolean; reason?: string } {
  if (!text || text.trim().length === 0) return { isRelevant: false, reason: 'Empty response' };

  const s = (subject || '').toLowerCase();
  const lower = text.toLowerCase();
  const qLower = (question || '').toLowerCase();

  // Allow interdisciplinary questions only if student specifically asked for comparison
  if (qLower.includes('compare') || qLower.includes('relation') || qLower.includes('difference between')) {
    return { isRelevant: true };
  }

  // 1. Computer Science: Must NOT be pure Mathematics or pure Biology or pure Chemistry
  if (s.includes('computer') || s.includes('cs')) {
    const csKeywords = ['computer', 'program', 'code', 'software', 'hardware', 'oop', 'object', 'class', 'method', 'variable', 'algorithm', 'loop', 'data', 'function', 'cpu', 'memory', 'binary', 'byte', 'syntax', 'logic'];
    const csHits = csKeywords.filter((k) => lower.includes(k)).length;

    const mathKeywords = [
      'quadratic equation', 'quadratic formula', 'pythagoras theorem',
      'hypotenuse', 'trigonometr', 'sin(', 'cos(', 'tan(', 'right triangle',
      'determinant of matrix', 'integration by parts', 'derivative of',
      'differentiation with respect to', 'polynomial expression'
    ];
    const mathHits = mathKeywords.filter((k) => lower.includes(k)).length;
    if (mathHits >= 1 && csHits < 2) {
      return { isRelevant: false, reason: 'Response contained Mathematics topics instead of Computer Science.' };
    }

    const bioKeywords = ['photosynthesis', 'chloroplast', 'mitochondria', 'meiosis', 'mitosis', 'red blood cells', 'digestive system'];
    const bioHits = bioKeywords.filter((k) => lower.includes(k)).length;
    if (bioHits >= 1 && csHits < 2) {
      return { isRelevant: false, reason: 'Response wandered into Biology instead of Computer Science.' };
    }

    const chemKeywords = ['covalent bond', 'ionic bond', 'periodic table', 'molarity', 'titration', 'avogadro number'];
    const chemHits = chemKeywords.filter((k) => lower.includes(k)).length;
    if (chemHits >= 1 && csHits < 2) {
      return { isRelevant: false, reason: 'Response wandered into Chemistry instead of Computer Science.' };
    }
  }

  // 2. Mathematics: Must NOT be programming code or cell organelles
  if (s.includes('math')) {
    const mathKeywords = ['math', 'equation', 'formula', 'algebra', 'geometry', 'square root', 'quadratic', 'solve', 'calculate', 'matrix', 'determinant', 'triangle', 'angle', 'pythagoras', 'theorem', 'ratio', 'fraction', 'derivative', 'integral'];
    const mathHits = mathKeywords.filter((k) => lower.includes(k)).length;

    const csKeywords = ['class student:', 'public static void main', 'def __init__', '#include <iostream>', 'console.log', 'object-oriented programming', 'oop inheritance'];
    const csHits = csKeywords.filter((k) => lower.includes(k)).length;
    if (csHits >= 1 && mathHits < 2) {
      return { isRelevant: false, reason: 'Response contained Computer Science code instead of Mathematics.' };
    }

    const bioKeywords = ['photosynthesis', 'mitochondria', 'digestive tract', 'chloroplast', 'meiosis'];
    const bioHits = bioKeywords.filter((k) => lower.includes(k)).length;
    if (bioHits >= 1 && mathHits < 2) {
      return { isRelevant: false, reason: 'Response discussed Biology instead of Mathematics.' };
    }
  }

  // 3. Physics: Must NOT be digestive system or photosynthesis or CS code
  if (s.includes('physic')) {
    const bioKeywords = ['photosynthesis', 'cell wall', 'mitochondria', 'digestive system'];
    if (bioKeywords.filter((k) => lower.includes(k)).length >= 2 && !lower.includes('force') && !lower.includes('energy') && !lower.includes('wave')) {
      return { isRelevant: false, reason: 'Response discussed Biology instead of Physics.' };
    }
    const csKeywords = ['class student:', 'public static void', 'def __init__', 'sql database'];
    if (csKeywords.some((k) => lower.includes(k))) {
      return { isRelevant: false, reason: 'Response contained Computer Science code instead of Physics.' };
    }
  }

  // 4. Biology: Must NOT be pure programming or pure calculus
  if (s.includes('bio')) {
    const csKeywords = ['binary search algorithm', 'oop inheritance polymorphism', 'sql database', 'class student:', 'def __init__'];
    if (csKeywords.some((k) => lower.includes(k)) && !lower.includes('cell') && !lower.includes('life')) {
      return { isRelevant: false, reason: 'Response discussed Computer Science instead of Biology.' };
    }
    const mathKeywords = ['quadratic formula', 'integration by parts', 'pythagoras theorem'];
    if (mathKeywords.some((k) => lower.includes(k)) && !lower.includes('cell')) {
      return { isRelevant: false, reason: 'Response discussed Mathematics instead of Biology.' };
    }
  }

  return { isRelevant: true };
}

// 1. AI Teacher: Ask Teacher (any educational question)
teacherRouter.post('/api/teacher/ask', async (req: Request, res: Response) => {
  const { question, subject = 'General Science', grade = 'Matric (Class 9-10)', difficulty = 'Beginner', language = 'en' } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const visualInfo = getSubjectVisual(subject);

  const systemInstruction = `You are the PakLingo AI Teacher, an elite academic educator for Pakistani students following FBISE and Provincial Board syllabi (Punjab, Sindh, KPK, Balochistan).

CRITICAL CONSTRAINTS:
1. STRICT SUBJECT BOUNDARY (ABSOLUTE CEILING & WALLS):
   - You are teaching: "${subject}".
   - You MUST generate content STRICTLY AND EXCLUSIVELY for "${subject}".
   - Under NO circumstances may you introduce concepts, examples, or questions from other subjects (e.g. if the subject is Computer Science, do NOT explain mathematics, chemistry, biology, or physics).
   - If the student asks a question like "What is OOP?", teach Object-Oriented Programming purely within Computer Science.

2. ACADEMIC LEVEL TARGETING:
   - Target Grade: "${grade}".
   - For Matric (Class 9-10): Use simple language, syllabus-level concepts, easy examples, and board exam-oriented explanations.
   - For Intermediate (Class 11-12 / FSc): Provide detailed concepts, board-level depth, and technical terminology.
   - For University / O/A Levels: Provide technical rigor without excessive jargon.

3. STRUCTURED VISUAL LESSON LAYOUT:
   Format the lesson to be visual, highly organized, and easy to scan using these structured section markers where appropriate:
   - 📚 Concept: Direct, crystal-clear definition and foundational explanation
   - 💡 Easy Idea: Explain the concept in very simple, plain everyday words
   - 🧠 How It Works: Step-by-step breakdown or mechanics
   - ${visualInfo.icon} Real-Life Example: Relatable example (use Pakistani context where suitable)
   - 🎯 Key Points: 2 to 4 bullet points summarizing essential takeaways
   - 📝 Exam Tip: Useful exam-focused advice for board exams (FBISE / BISE)
   - ⚠️ Common Mistake: A frequent misunderstanding students make and how to avoid it
   ${visualInfo.isCS ? '- Code Formatting: For programming questions, ALWAYS provide clean, indented code inside a fenced code block with language specified (e.g. ```python or ```cpp), and clearly explain what each part of the code does underneath.' : ''}

4. CLEAN FORMATTING:
   - Use standard Markdown headings (###) and bullet lists (* or -).
   - NEVER output raw escaped characters or chaotic punctuation.
${getEducationLanguageInstruction(language)}`;

  const prompt = `SUBJECT: ${subject}
ACADEMIC LEVEL: ${grade}
STUDENT QUESTION: "${question}"

Teach this concept strictly within ${subject} at the ${grade} level following the structured visual lesson layout.`;

  try {
    const response = await callWithCandidateModels(
      'Teacher Ask Question',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    let answer = response.text || '';

    // Validate subject relevance before sending to client
    const validation = isResponseRelevantToSubject(answer, subject, question);
    if (!validation.isRelevant) {
      console.warn(`AI Teacher response failed subject validation: ${validation.reason}. Regenerating with strict correction...`);
      const retryPrompt = `CORRECTION REQUIRED:
The previous answer was rejected because it wandered outside of SUBJECT: "${subject}".
You MUST generate an explanation STRICTLY for SUBJECT: "${subject}" at ACADEMIC LEVEL: "${grade}".
STUDENT QUESTION: "${question}"
Do NOT mention or introduce any other subject.`;

      const retryResponse = await callWithCandidateModels(
        'Teacher Ask Question Retry',
        (modelName) =>
          ai.models.generateContent({
            model: modelName,
            contents: retryPrompt,
            config: { systemInstruction },
          }),
        22000
      );
      if (retryResponse.text) {
        answer = retryResponse.text;
      }
    }

    if (answer) {
      return res.json({ answer });
    }
    return res.status(503).json({ error: 'Unable to answer question right now.' });
  } catch (err: any) {
    console.error('Teacher Ask Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to answer question right now.' });
  }
});

// 2. AI Teacher: Topic explanation endpoint
teacherRouter.post('/api/teacher/explain', async (req: Request, res: Response) => {
  const { subject, grade, topic, difficulty = 'Intermediate', language = 'en' } = req.body;
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo AI Teacher for Pakistani students.
Explain the requested concept in an encouraging, engaging, and pedagogically sound manner tailored to the FBISE and provincial Pakistani curriculum standards (Matric, FSc, Primary, Middle, O/A Levels).
Structure your explanation with:
1. Fundamental Concept & Core Intuition (بنیادی تصور)
2. Real-Life Contextual Example (relatable Pakistani analogies: sports/cricket, daily life, local industries, agriculture)
3. Key Step-by-Step Problem-Solving Framework / Rules / Formulas
4. Common Board Exam Pitfalls to Avoid
5. Quick Review Checklist

${getEducationLanguageInstruction(language)}`;

  const prompt = `Subject: ${subject || 'General'}\nGrade Level: ${grade || 'Matric'}\nDifficulty: ${difficulty}\nTopic: ${topic}`;

  try {
    const response = await callWithCandidateModels(
      'Teacher Explanation',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const explanation = response.text || '';
    if (explanation) {
      return res.json({ explanation });
    }
    return res.status(503).json({ error: 'Unable to generate explanation right now.' });
  } catch (err: any) {
    console.error('Teacher Explain Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to generate explanation right now.' });
  }
});

// 3. AI Teacher: Summarize text / Chapter Notes
teacherRouter.post('/api/teacher/summarize', async (req: Request, res: Response) => {
  const { text, subject, grade, language = 'en', targetLanguage } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text to summarize is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const effectiveLang = targetLanguage || language;
  const systemInstruction = `You are the PakLingo Study Notes Summarizer.
Your goal is to summarize the provided educational text into clear, simple, high-yield bullet points.
Highlight core definitions, key facts, essential formulas, and exam takeaways.
If the student asks for Urdu or English translation, provide the summary in the requested target language cleanly.
${getEducationLanguageInstruction(effectiveLang)}`;

  const prompt = `Subject: ${subject || 'General'}\nGrade Level: ${grade || 'Matric'}\n\nOriginal Text to Summarize:\n"""\n${text}\n"""\n\nSummarize into simple points.`;

  try {
    const response = await callWithCandidateModels(
      'Teacher Summarize',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const summary = response.text || '';
    if (summary) {
      return res.json({ summary });
    }
    return res.status(503).json({ error: 'Unable to summarize text right now.' });
  } catch (err: any) {
    console.error('Teacher Summarize Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to summarize text right now.' });
  }
});

// 4. AI Teacher: Generate Quiz
teacherRouter.post('/api/teacher/quiz', async (req: Request, res: Response) => {
  const { subject = 'General Science', grade = 'Matric (Class 9-10)', topic, numQuestions = 4, difficulty = 'Intermediate', language = 'en' } = req.body;
  const effectiveTopic = (topic && typeof topic === 'string' && topic.trim()) ? topic.trim() : subject;

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const count = Math.min(Math.max(parseInt(numQuestions, 10) || 4, 2), 10);
  const visualInfo = getSubjectVisual(subject);

  const systemInstruction = `You are an expert examiner for Pakistani boards (FBISE, Punjab, Sindh, KPK, Balochistan) specializing in ${subject}.

CRITICAL SUBJECT RULE:
All questions MUST be strictly, 100% within the chosen SUBJECT: "${subject}" at ACADEMIC LEVEL: "${grade}".
Under NO circumstance generate questions from unrelated subjects (e.g. if subject is Computer Science, do NOT create questions about biology, chemistry, physics, or history).

Generate an interactive multiple choice practice quiz of exactly ${count} questions on "${effectiveTopic}".
Each question MUST have exactly 4 distinct options and a correctIndex (0, 1, 2, or 3).
Include a clear, concise explanation explaining why the correct answer is right without raw markdown symbols.
Output strictly valid JSON with this exact schema:
{
  "quizzes": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation..."
    }
  ]
}
${getEducationLanguageInstruction(language)}`;

  const prompt = `SUBJECT: ${subject}
ACADEMIC LEVEL: ${grade}
TOPIC: "${effectiveTopic}"
NUMBER OF QUESTIONS: ${count}

Generate multiple choice questions strictly for ${subject}.`;

  try {
    const response = await callWithCandidateModels(
      'Teacher Generate Quiz',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        }),
      25000
    );

    const rawText = response.text || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (parsed && Array.isArray(parsed.quizzes) && parsed.quizzes.length > 0) {
      return res.json({ quizzes: parsed.quizzes, questions: parsed.quizzes });
    }

    return res.status(503).json({ error: 'Unable to parse generated quiz. Please retry.' });
  } catch (err: any) {
    console.error('Teacher Quiz Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to generate quiz right now.' });
  }
});

// 5. AI Teacher: Flashcards Generator
teacherRouter.post('/api/teacher/flashcards', async (req: Request, res: Response) => {
  const { topic, sourceText, subject = 'General Science', grade = 'Matric (Class 9-10)', numCards = 5, count: rawCount, language = 'en' } = req.body;
  const effectiveTopic = (topic && typeof topic === 'string' && topic.trim()) ? topic.trim() : subject;

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const requestedCount = rawCount || numCards;
  const count = Math.min(Math.max(parseInt(requestedCount, 10) || 5, 3), 10);

  const systemInstruction = `You are the PakLingo Flashcard Maker for Pakistani students specializing in ${subject}.

CRITICAL SUBJECT RULE:
All flashcards MUST be strictly, 100% within the chosen SUBJECT: "${subject}" at ACADEMIC LEVEL: "${grade}".
Never generate flashcards from unrelated subjects.

Generate ${count} high-yield revision flashcards on "${effectiveTopic}".
Each flashcard has:
- front: Key term, formula, or question strictly in ${subject}
- back: Concise, clear definition, formula, or answer
- notes: Optional memory mnemonic, board exam tip, or practical example
- category: "${subject}"
Output strictly valid JSON with this exact schema:
{
  "flashcards": [
    {
      "front": "Front question/term",
      "back": "Back answer/definition",
      "notes": "Short note or tip",
      "category": "${subject}"
    }
  ]
}
${getEducationLanguageInstruction(language)}`;

  const prompt = `SUBJECT: ${subject}
ACADEMIC LEVEL: ${grade}
TOPIC: "${effectiveTopic}"
${sourceText ? `Provided Text:\n"""\n${sourceText}\n"""\n` : ''}Number of Flashcards: ${count}

Generate flashcards strictly for ${subject}.`;

  try {
    const response = await callWithCandidateModels(
      'Teacher Generate Flashcards',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        }),
      25000
    );

    const rawText = response.text || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (parsed && Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0) {
      return res.json({ flashcards: parsed.flashcards });
    }

    return res.status(503).json({ error: 'Unable to parse flashcards. Please retry.' });
  } catch (err: any) {
    console.error('Teacher Flashcards Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to generate flashcards right now.' });
  }
});

// 6. AI Teacher: Homework step-by-step solver endpoint
teacherRouter.post('/api/teacher/solve', async (req: Request, res: Response) => {
  const { subject, grade, problem, language = 'en' } = req.body;
  if (!problem || typeof problem !== 'string') {
    return res.status(400).json({ error: 'Problem statement is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo AI Homework Tutor for Pakistani students.
CRITICAL PEDAGOGICAL MANDATE:
Do NOT simply give an unexplained final answer! Your purpose is to help the student LEARN and understand how to solve the problem step-by-step.
Structure your solution:
1. **Given Data & Objective**: What values or conditions are given, and what must be found?
2. **Formula / Rule Used**: State the governing principle or equation clearly.
3. **Step-by-Step Calculation**: Show full arithmetic and algebraic steps clearly so the student can follow each operation without skips.
4. **Final Answer**: Clearly highlight the final answer with appropriate SI units (e.g. m/s², Joules, etc.).
5. **Key Concept / Verification Tip**: How the student can quickly check their answer or avoid common errors.

${getEducationLanguageInstruction(language)}`;

  const prompt = `Subject: ${subject || 'General'}\nGrade Level: ${grade || 'Matric'}\nProblem to solve:\n"${problem}"`;

  try {
    const response = await callWithCandidateModels(
      'Teacher Solve',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      25000
    );
    const solution = response.text || '';
    if (solution) {
      return res.json({ solution });
    }
    return res.status(503).json({ error: 'Unable to solve homework problem right now.' });
  } catch (err: any) {
    console.error('Teacher Solve Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to solve homework problem right now.' });
  }
});

// 7. AI Teacher: Study Plan Generator
teacherRouter.post('/api/teacher/study-plan', async (req: Request, res: Response) => {
  const { subject, grade, availableTime, target, language = 'en' } = req.body;
  if (!subject && !target) {
    return res.status(400).json({ error: 'Subject or Target is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Academic Study Mentor.
Generate a realistic, balanced, and highly motivating study plan for Pakistani students preparing for board exams, semester tests, or daily homework.
Structure the study plan with:
1. **Target & Strategy Blueprint**: Summary of goal, syllabus scope, and milestone timeline.
2. **Daily / Weekly Study Schedule**: Realistic time slots, recommended Pomodoro intervals (e.g. 45 min study + 10 min break), and specific topics.
3. **Active Recall & Self-Testing Days**: Days dedicated to solving past board papers or flashcards.
4. **Stress Management & High-Score Exam Tips**: Practical guidance to maximize retention and stay confident.

${getEducationLanguageInstruction(language)}`;

  const prompt = `Subject: ${subject || 'All Core Subjects'}\nGrade Level: ${grade || 'Matric'}\nAvailable Study Time: "${availableTime || '2 hours daily'}"\nTarget / Exam Goal: "${target || 'Score 90%+ in Board Exams'}"`;

  try {
    const response = await callWithCandidateModels(
      'Teacher Study Plan',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      25000
    );
    const plan = response.text || '';
    if (plan) {
      return res.json({ plan });
    }
    return res.status(503).json({ error: 'Unable to generate study plan right now.' });
  } catch (err: any) {
    console.error('Teacher Study Plan Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to generate study plan right now.' });
  }
});
