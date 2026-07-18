export type HomeQuestion = {
  stem: string;
  options: string[];
  correct: number;
  explain: string;
};

export type HomeFlashCard = {
  t: string;
  d: string;
  img?: string;
  imgAlt?: string;
};

export type HomeReadPage = {
  h: string;
  body: string[];
  key: string;
};

export type HomeSummaryContent = {
  titleSuffix: string;
  callout: string;
  keyTakeaways: string;
  expandDetail: string;
  checklist: string;
  bullets: string[];
  checks: string[];
  toggles: { id: string; title: string; body: string }[];
};

export type HomeContent = {
  questions: HomeQuestion[];
  cards: HomeFlashCard[];
  readPages: HomeReadPage[];
  summary: HomeSummaryContent;
  chatGreeting: string;
  chatMockReply: string;
  chatExplainThis: string;
  sessionQuizTitle: string;
  sessionCustomTitle: (n: number) => string;
  inProgress: string;
  termsInSet: (n: number) => string;
  flashcardLayout: string;
  favorite: string;
  addNote: string;
  yourNote: string;
  highlightColor: (color: string) => string;
};

const QUESTIONS_EN: HomeQuestion[] = [
  { stem: "A 58-year-old man has crushing chest pain and 2 mm ST-elevation in II, III, aVF. Best next step?", options: ["Aspirin + PCI within 90 minutes", "Fibrinolysis regardless of PCI access", "Beta-blocker alone", "Serial troponins only"], correct: 0, explain: "Inferior STEMI with timely PCI available → primary PCI plus aspirin." },
  { stem: "Which ECG finding best localizes an inferior wall MI?", options: ["ST-elevation in V1–V4", "ST-elevation in I and aVL", "ST-elevation in II, III, aVF", "Diffuse ST-depression"], correct: 2, explain: "Leads II, III, aVF face the inferior wall." },
  { stem: "First-line rate control in stable atrial fibrillation with preserved EF?", options: ["IV adenosine", "Beta-blocker", "Digoxin loading", "Immediate DC cardioversion"], correct: 1, explain: "Beta-blockers (or non-DHP calcium channel blockers) are first-line." },
  { stem: "Best step for suspected PE with a low pretest probability?", options: ["CT pulmonary angiography", "V/Q scan", "D-dimer", "Empiric heparin"], correct: 2, explain: "Low pretest probability → D-dimer to rule out." },
  { stem: "Preferred long-term therapy after NSTEMI?", options: ["Aspirin alone", "Dual antiplatelet therapy + high-intensity statin", "Warfarin", "Calcium channel blocker only"], correct: 1, explain: "DAPT plus a high-intensity statin is standard secondary prevention." },
  { stem: "Classic ECG pattern of acute pericarditis?", options: ["Diffuse ST-elevation with PR depression", "Regional ST-elevation", "Peaked T waves", "Delta wave"], correct: 0, explain: "Diffuse ST-elevation with PR depression is characteristic." },
  { stem: "Fastest symptom relief for stable angina?", options: ["Sublingual nitroglycerin", "Oral beta-blocker", "Ranolazine", "Aspirin"], correct: 0, explain: "Sublingual nitroglycerin gives rapid relief of anginal symptoms." },
  { stem: "Warfarin reversal in a patient with major bleeding?", options: ["Vitamin K alone", "4-factor PCC + vitamin K", "Fresh frozen plasma alone", "Protamine"], correct: 1, explain: "Major bleeding → 4-factor PCC plus IV vitamin K." },
  { stem: "Recommended AAA screening?", options: ["CT in all adults over 50", "One-time ultrasound in men 65–75 who ever smoked", "Annual MRI", "No screening"], correct: 1, explain: "One-time ultrasound for men 65–75 with any smoking history." },
  { stem: "Murmur that intensifies with the Valsalva maneuver?", options: ["Aortic stenosis", "Mitral regurgitation", "Hypertrophic cardiomyopathy", "Pulmonic stenosis"], correct: 2, explain: "Reduced preload from Valsalva increases the HOCM murmur." },
  { stem: "First-line antihypertensive in a Black patient without CKD?", options: ["ACE inhibitor", "Thiazide or calcium channel blocker", "Beta-blocker", "Alpha-blocker"], correct: 1, explain: "Thiazides or CCBs are preferred initial agents here." },
  { stem: "Lipid target strategy for secondary prevention?", options: ["Low-intensity statin", "High-intensity statin", "Fibrate", "Niacin"], correct: 1, explain: "High-intensity statin therapy is used for secondary prevention." },
];

const CARDS_EN: HomeFlashCard[] = [
  { t: "Inferior STEMI — leads?", d: "II, III, aVF", img: "/flashcards/inferior-stemi.svg", imgAlt: "Inferior STEMI ECG with ST elevation in II, III, aVF" },
  { t: "PCI window vs fibrinolysis", d: "Within 90 minutes", img: "/flashcards/pci-timeline.svg", imgAlt: "PCI within 90 minutes vs fibrinolysis timeline" },
  { t: "Anterior STEMI — leads?", d: "V1 – V4", img: "/flashcards/anterior-stemi.svg", imgAlt: "Anterior STEMI ECG with ST elevation in V1–V4" },
  { t: "Warfarin reversal (major bleed)", d: "4-factor PCC + vitamin K" },
  { t: "Acute pericarditis ECG", d: "Diffuse ST-elevation, PR depression", img: "/flashcards/pericarditis-ecg.svg", imgAlt: "Pericarditis ECG with diffuse ST elevation" },
  { t: "Valsalva increases which murmur?", d: "Hypertrophic cardiomyopathy" },
  { t: "AAA screening", d: "Ultrasound, men 65–75 ever-smokers" },
  { t: "Stable angina — fast relief", d: "Sublingual nitroglycerin" },
];

const READ_PAGES_EN: HomeReadPage[] = [
  { h: "Chapter 1 · Cardiology", body: ["Acute coronary syndromes span unstable angina, NSTEMI, and STEMI along a continuum of plaque rupture and thrombus formation.", "First-line management prioritizes reperfusion. Where PCI is reachable within 90 minutes, it is preferred over fibrinolysis."], key: "ST-elevation in leads II, III, aVF localizes to the inferior wall — check a right-sided ECG for RV involvement." },
  { h: "Chapter 2 · Reperfusion", body: ["Primary PCI restores flow fastest and is the standard of care when a catheterization lab is available in time.", "Adjuncts include dual antiplatelet therapy, anticoagulation, and beta-blockade once the patient is hemodynamically stable."], key: "Door-to-balloon under 90 minutes is the benchmark for primary PCI." },
  { h: "Chapter 3 · Secondary prevention", body: ["After an event, high-intensity statins, DAPT, ACE inhibitors, and beta-blockers reduce recurrence.", "Cardiac rehabilitation and risk-factor control anchor long-term outcomes."], key: "High-intensity statin therapy is standard for secondary prevention." },
];

const SUMMARY_EN: HomeSummaryContent = {
  titleSuffix: "Summary",
  callout: "Reperfusion timing is the single highest-yield concept in this set — anchor everything else to it.",
  keyTakeaways: "Key takeaways",
  expandDetail: "Expand for detail",
  checklist: "Checklist",
  bullets: [
    "ST-elevation localizes by lead group: inferior (II, III, aVF), anterior (V1–V4), lateral (I, aVL, V5–V6).",
    "PCI within 90 minutes beats fibrinolysis when a cath lab is reachable.",
    "Dual antiplatelet therapy plus anticoagulation is standard adjunctive care.",
  ],
  checks: [
    "Localize STEMI by lead groups",
    "Know the 90-minute PCI window",
    "Recall DAPT + statin for prevention",
    "Right-sided ECG in inferior MI",
  ],
  toggles: [
    { id: "toggle-stemi", title: "STEMI vs NSTEMI — how to tell", body: "STEMI shows persistent ST-elevation and needs emergent reperfusion. NSTEMI shows ST-depression or T-wave changes with positive troponin, managed with early invasive or ischemia-guided strategies." },
    { id: "toggle-meds", title: "Adjunctive medications at a glance", body: "Aspirin, a P2Y12 inhibitor, anticoagulation, high-intensity statin, and beta-blockade once stable — plus an ACE inhibitor when EF is reduced." },
  ],
};

const META_EN: Omit<HomeContent, "questions" | "cards" | "readPages" | "summary"> = {
  chatGreeting: "Hi! Ask anything about this file — highlight text anywhere or type below.",
  chatMockReply: "Here's the short version: focus on the highest-yield mechanism first, then the exception. Want me to turn this into a flashcard or a practice question?",
  chatExplainThis: "explain this",
  sessionQuizTitle: "Quiz practice",
  sessionCustomTitle: (n) => `Custom · ${n} questions`,
  inProgress: "In progress",
  termsInSet: (n) => `Terms in this set (${n})`,
  flashcardLayout: "Flashcard layout",
  favorite: "Favorite",
  addNote: "Add note",
  yourNote: "Your note…",
  highlightColor: (color) => `Highlight ${color}`,
};

export function getHomeContent(): HomeContent {
  return {
    questions: QUESTIONS_EN,
    cards: CARDS_EN,
    readPages: READ_PAGES_EN,
    summary: SUMMARY_EN,
    ...META_EN,
  };
}

/** Stable English questions for scoring (correct index only). */
export const QUESTION_CORRECT_INDEX = QUESTIONS_EN.map((q) => q.correct);
