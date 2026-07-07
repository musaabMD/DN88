import type { Exam, StudySet } from "./types";

export const exams: Exam[] = [
  { id: "usmle", title: "USMLE Step 1" },
  { id: "nclex", title: "NCLEX-RN" },
  { id: "mcat", title: "MCAT" },
  { id: "pance", title: "PANCE" },
  { id: "comlex", title: "COMLEX Level 1" },
];

export const studySets: StudySet[] = [
  {
    id: "cardio-mcq",
    examId: "usmle",
    title: "Cardiology MCQs",
    type: "mcq",
    user: { username: "dr_sarah", avatarColor: "#60A5FA" },
    progress: 72,
    score: 88,
    rating: 42,
    pinned: true,
    learnItems: [
      { id: "l1", title: "Heart Sounds", content: "S1 closes mitral & tricuspid valves at systole start." },
      { id: "l2", title: "Murphy Sign", content: "Inspiratory arrest during RUQ palpation suggests cholecystitis." },
    ],
    mcqItems: [
      {
        id: "m1",
        question: "Which murmur improves with squatting?",
        options: ["HOCM", "Mitral regurg", "Aortic stenosis", "VSD"],
        answer: 0,
      },
      {
        id: "m2",
        question: "First heart sound (S1) is caused by closure of?",
        options: ["Aortic & pulmonic", "Mitral & tricuspid", "All four valves", "Pericardium"],
        answer: 1,
      },
      {
        id: "m3",
        question: "JVP 'a' wave is absent in?",
        options: ["Atrial fibrillation", "Tricuspid stenosis", "Pulmonary HTN", "Normal sinus"],
        answer: 0,
      },
    ],
    reviewItems: [
      { id: "r1", prompt: "HOCM murmur gets louder with?", answer: "Valsalva & standing" },
      { id: "r2", prompt: "Kussmaul sign indicates?", answer: "Constrictive pericarditis" },
    ],
  },
  {
    id: "cardio-learn",
    examId: "usmle",
    title: "Cardio Basics",
    type: "learning",
    user: { username: "med_mike", avatarColor: "#34D399" },
    progress: 45,
    score: 76,
    rating: 28,
    pinned: false,
    learnItems: [
      { id: "l1", title: "Starling Law", content: "Increased preload → increased stroke volume up to a limit." },
      { id: "l2", title: "Frank-Starling", content: "Myocardial fiber stretch determines contractile force." },
      { id: "l3", title: "Afterload", content: "Resistance the ventricle must overcome to eject blood." },
    ],
    mcqItems: [
      {
        id: "m1",
        question: "Preload is best represented by?",
        options: ["SV", "EDV", "MAP", "SVR"],
        answer: 1,
      },
    ],
    reviewItems: [
      { id: "r1", prompt: "Define preload", answer: "End-diastolic ventricular volume" },
    ],
  },
  {
    id: "renal-mcq",
    examId: "usmle",
    title: "Renal MCQs",
    type: "mcq",
    user: { username: "neph_anna", avatarColor: "#F472B6" },
    progress: 90,
    score: 94,
    rating: 67,
    pinned: false,
    learnItems: [
      { id: "l1", title: "GFR Basics", content: "GFR ≈ 120 mL/min in healthy adults." },
    ],
    mcqItems: [
      {
        id: "m1",
        question: "Most common cause of chronic kidney disease?",
        options: ["Diabetes", "HTN", "Glomerulonephritis", "PKD"],
        answer: 0,
      },
      {
        id: "m2",
        question: "ACE inhibitors are contraindicated in?",
        options: ["Bilateral RAS", "Unilateral RAS", "HTN", "HF"],
        answer: 0,
      },
    ],
    reviewItems: [
      { id: "r1", prompt: "Normal GFR?", answer: "~120 mL/min" },
    ],
  },
  {
    id: "pharm-learn",
    examId: "nclex",
    title: "Pharm Flash",
    type: "learning",
    user: { username: "rx_jen", avatarColor: "#A78BFA" },
    progress: 30,
    score: 65,
    rating: 15,
    pinned: false,
    learnItems: [
      { id: "l1", title: "Beta Blockers", content: "Block β1 (heart) and/or β2 (lungs, vessels)." },
      { id: "l2", title: "ACE Inhibitors", content: "End in -pril. Watch for dry cough & angioedema." },
    ],
    mcqItems: [
      {
        id: "m1",
        question: "Which drug class ends in '-olol'?",
        options: ["Beta blockers", "ACE inhibitors", "Statins", "SSRIs"],
        answer: 0,
      },
    ],
    reviewItems: [
      { id: "r1", prompt: "ACE inhibitor suffix?", answer: "-pril" },
    ],
  },
  {
    id: "bio-mcq",
    examId: "mcat",
    title: "Biochem MCQs",
    type: "mcq",
    user: { username: "bio_ben", avatarColor: "#FB923C" },
    progress: 55,
    score: 82,
    rating: 33,
    pinned: true,
    learnItems: [
      { id: "l1", title: "Glycolysis", content: "Glucose → 2 pyruvate, net 2 ATP." },
    ],
    mcqItems: [
      {
        id: "m1",
        question: "Rate-limiting enzyme of glycolysis?",
        options: ["Hexokinase", "PFK-1", "Pyruvate kinase", "Aldolase"],
        answer: 1,
      },
      {
        id: "m2",
        question: "NADH produced per glucose in glycolysis?",
        options: ["1", "2", "3", "4"],
        answer: 1,
      },
    ],
    reviewItems: [
      { id: "r1", prompt: "Glycolysis net ATP?", answer: "2 ATP" },
    ],
  },
  {
    id: "pance-mcq",
    examId: "pance",
    title: "Derm MCQs",
    type: "mcq",
    user: { username: "pa_lisa", avatarColor: "#2DD4BF" },
    progress: 20,
    score: 70,
    rating: 9,
    pinned: false,
    learnItems: [
      { id: "l1", title: "ABCDE Rule", content: "Asymmetry, Border, Color, Diameter, Evolution." },
    ],
    mcqItems: [
      {
        id: "m1",
        question: "Most common skin cancer?",
        options: ["BCC", "SCC", "Melanoma", "Merkel cell"],
        answer: 0,
      },
    ],
    reviewItems: [
      { id: "r1", prompt: "Melanoma warning sign?", answer: "Changing mole (Evolution)" },
    ],
  },
];

export function getExam(id: string): Exam | undefined {
  return exams.find((e) => e.id === id);
}

export function getSet(id: string): StudySet | undefined {
  return studySets.find((s) => s.id === id);
}

export function getSetsByExam(examId: string): StudySet[] {
  return studySets.filter((s) => s.examId === examId);
}
