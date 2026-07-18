import type { AppLocale } from "@/lib/locale";

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

const QUESTIONS_AR: HomeQuestion[] = [
  { stem: "رجل 58 سنة يعاني ألمًا ساحقًا في الصدر مع ارتفاع ST بمقدار 2 مم في II وIII وaVF. ما أفضل خطوة تالية؟", options: ["أسبرين + PCI خلال 90 دقيقة", "الذائبة بالفibrinolysis بغض النظر عن توفر PCI", "حاصر بيتا وحده", "تسلسل التروponin فقط"], correct: 0, explain: "STEMI inferior مع PCI متاح في الوقت المناسب → PCI أولي مع أسبرين." },
  { stem: "أي نمط ECG يحدد موقع احتشاء الجدار السفلي بدقة؟", options: ["ارتفاع ST في V1–V4", "ارتفاع ST في I وaVL", "ارتفاع ST في II وIII وaVF", "انخفاض ST منتشر"], correct: 2, explain: "المشتقات II وIII وaVF تواجه الجدار السفلي." },
  { stem: "الخط الأول لضبط المعدة في الرجفان الأذيني المستقر مع EF محفوظ؟", options: ["أdenosine وريدي", "حاصر بيتا", "تحميل digoxin", "صدمة كهربائية فورية"], correct: 1, explain: "حاصرات بيتا (أو حاصرات قنوات الكalcium غير DHP) هي الخط الأول." },
  { stem: "أفضل خطوة عند اشتباه PE مع احتمال مسبق منخفض؟", options: ["تصوير الأوعية الرئوية CT", "مسح V/Q", "D-dimer", "هيبarin تجريبي"], correct: 2, explain: "احتمال مسبق منخفض → D-dimer للاستبعاد." },
  { stem: "العلاج طويل الأمد المفضل بعد NSTEMI؟", options: ["أسبرين وحده", "Dual antiplatelet + statin عالي الكثافة", "Warfarin", "حاصر قنوات الكalcium وحده"], correct: 1, explain: "DAPT مع statin عالي الكثافة هو الوقاية الثانوية المعيارية." },
  { stem: "نمط ECG الكلاسيكي للتِهاب التامور الحاد؟", options: ["ارتفاع ST منتشر مع انخفاض PR", "ارتفاع ST موضعي", "موجات T مدببة", "موجة delta"], correct: 0, explain: "ارتفاع ST منتشر مع انخفاض PR سمة مميزة." },
  { stem: "أسرع تخفيف لأعراض الذبحة المستقرة؟", options: ["Nitroglycerin تحت اللسان", "حاصر بيتا فموي", "Ranolazine", "أسبرين"], correct: 0, explain: "Nitroglycerin تحت اللسان يخفف أعراض الذبحة بسرعة." },
  { stem: "عكس Warfarin عند نزيف كبير؟", options: ["فيتامين K وحده", "4-factor PCC + فيتامين K", "بلازma طازجة مجمدة وحده", "Protamine"], correct: 1, explain: "نزيف كبير → 4-factor PCC مع فيتامين K وريدي." },
  { stem: "فحص AAA الموصى به؟", options: ["CT لجميع البالغين فوق 50", "موجات فوق صوتية لمرة واحدة للرجال 65–75 ممن دخّنوا", "MRI سنوي", "لا فحص"], correct: 1, explain: "موجات فوق صوتية لمرة واحدة للرجال 65–75 مع أي تاريخ تدخين." },
  { stem: "أي نفخة تشتد مع maneuver Valsalva؟", options: ["تضيق أورطي", "قصور mitral", "Cardiomyopathy hypertrophic", "تضيق pulmonic"], correct: 2, explain: "انخفاض preload من Valsalva يزيد نفخة HOCM." },
  { stem: "الخط الأول لعلاج ارتفاع الضغط لدى مريض أسود بدون CKD؟", options: ["مثبط ACE", "Thiazide أو حاصر قنوات الكalcium", "حاصر بيتا", "حاصر ألفا"], correct: 1, explain: "Thiazides أو CCBs هي العلاجات الأولية المفضلة هنا." },
  { stem: "استراتيجية الدهون للوقاية الثانوية؟", options: ["Statin كثافة منخفضة", "Statin كثافة عالية", "Fibrate", "Niacin"], correct: 1, explain: "Statin عالي الكثافة للوقاية الثانوية." },
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

const CARDS_AR: HomeFlashCard[] = [
  { t: "STEMI inferior — المشتقات؟", d: "II, III, aVF", img: "/flashcards/inferior-stemi.svg", imgAlt: "ECG لـ STEMI inferior مع ارتفاع ST في II وIII وaVF" },
  { t: "نافذة PCI مقابل الذائبة", d: "خلال 90 دقيقة", img: "/flashcards/pci-timeline.svg", imgAlt: "PCI خلال 90 دقيقة مقابل جدول الذائبة" },
  { t: "STEMI anterior — المشتقات؟", d: "V1 – V4", img: "/flashcards/anterior-stemi.svg", imgAlt: "ECG لـ STEMI anterior مع ارتفاع ST في V1–V4" },
  { t: "عكس Warfarin (نزيف كبير)", d: "4-factor PCC + فيتامين K" },
  { t: "ECG التِهاب التامور الحاد", d: "ارتفاع ST منتشر، انخفاض PR", img: "/flashcards/pericarditis-ecg.svg", imgAlt: "ECG التِهاب التامور مع ارتفاع ST منتشر" },
  { t: "Valsalva يزيد أي نفخة؟", d: "Cardiomyopathy hypertrophic" },
  { t: "فحص AAA", d: "موجات فوق صوتية، رجال 65–75 مدخّنون" },
  { t: "ذبحة مستقرة — تخفيف سريع", d: "Nitroglycerin تحت اللسان" },
];

const READ_PAGES_EN: HomeReadPage[] = [
  { h: "Chapter 1 · Cardiology", body: ["Acute coronary syndromes span unstable angina, NSTEMI, and STEMI along a continuum of plaque rupture and thrombus formation.", "First-line management prioritizes reperfusion. Where PCI is reachable within 90 minutes, it is preferred over fibrinolysis."], key: "ST-elevation in leads II, III, aVF localizes to the inferior wall — check a right-sided ECG for RV involvement." },
  { h: "Chapter 2 · Reperfusion", body: ["Primary PCI restores flow fastest and is the standard of care when a catheterization lab is available in time.", "Adjuncts include dual antiplatelet therapy, anticoagulation, and beta-blockade once the patient is hemodynamically stable."], key: "Door-to-balloon under 90 minutes is the benchmark for primary PCI." },
  { h: "Chapter 3 · Secondary prevention", body: ["After an event, high-intensity statins, DAPT, ACE inhibitors, and beta-blockers reduce recurrence.", "Cardiac rehabilitation and risk-factor control anchor long-term outcomes."], key: "High-intensity statin therapy is standard for secondary prevention." },
];

const READ_PAGES_AR: HomeReadPage[] = [
  { h: "الفصل 1 · أمراض القلب", body: ["متلازمات الشريان التاجي الحادة تشمل الذبحة غير المستقرة وNSTEMI وSTEMI على طيف تمزق اللويحة وتكوّن الخثرة.", "الإدارة الأولى تعطي الأولوية لإعادة التروية. عندما يكون PCI متاحًا خلال 90 دقيقة، يُفضّل على الذائبة."], key: "ارتفاع ST في II وIII وaVF يحدد الجدار السفلي — افحص ECG للجانب الأيمن لاشتباه RV." },
  { h: "الفصل 2 · إعادة التروية", body: ["PCI الأولي يستعيد التدفق أسرع وهو المعيار عند توفر مختبر القسطرة في الوقت.", "الإضافات تشمل dual antiplatelet والتخثر و حاصرات بيتا عند الاستقرار الدموي."], key: "من الباب إلى البالون خلال 90 دقيقة هو المعيار لـ PCI الأولي." },
  { h: "الفصل 3 · الوقاية الثانوية", body: ["بعد الحدث، statins عالية الكثافة وDAPT ومثبطات ACE وحاصرات بيتا تقلل الانتكاس.", "إعادة التأهيل القلبي والتحكم في عوامل الخطر يرسخان النتائج طويلة الأمد."], key: "Statin عالي الكثافة معيار للوقاية الثانوية." },
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

const SUMMARY_AR: HomeSummaryContent = {
  titleSuffix: "ملخص",
  callout: "توقيت إعادة التروية هو أعلى مفهوم عائد في هذه المجموعة — اربط كل شيء به.",
  keyTakeaways: "النقاط الأساسية",
  expandDetail: "توسيع للتفاصيل",
  checklist: "قائمة تحقق",
  bullets: [
    "ارتفاع ST يُحدد حسب مجموعة المشتقات: inferior (II, III, aVF)، anterior (V1–V4)، lateral (I, aVL, V5–V6).",
    "PCI خلال 90 دقيقة أفضل من الذائبة عندما يكون مختبر القسطرة متاحًا.",
    "Dual antiplatelet مع التخثر هو الرعاية الإضافية المعيارية.",
  ],
  checks: [
    "حدد موقع STEMI بمجموعات المشتقات",
    "احفظ نافذة PCI 90 دقيقة",
    "تذكر DAPT + statin للوقاية",
    "ECG للجانب الأيمن في MI inferior",
  ],
  toggles: [
    { id: "toggle-stemi", title: "STEMI مقابل NSTEMI — كيف تميّز", body: "STEMI يظهر ارتفاع ST مستمر ويحتاج إعادة تروية طارئة. NSTEMI يظهر انخفاض ST أو تغيرات T-wave مع troponin إيجابي، يُدار باستراتيجية invasive مبكرة أو موجهة بالإischemia." },
    { id: "toggle-meds", title: "الأدوية الإضافية بنظرة سريعة", body: "أسبرين، مثبط P2Y12، تخثر، statin عالي الكثافة، وحاصر بيتا عند الاستقرار — ومثبط ACE عند انخفاض EF." },
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

const META_AR: typeof META_EN = {
  chatGreeting: "مرحبًا! اسأل أي شيء عن هذا الملف — ظلّل نصًا في أي مكان أو اكتب أدناه.",
  chatMockReply: "النسخة المختصرة: ركّز على آلية أعلى عائد أولًا، ثم الاستثناء. هل تريد تحويلها إلى بطاقة أو سؤال تدريبي؟",
  chatExplainThis: "اشرح هذا",
  sessionQuizTitle: "تدريب اختبار",
  sessionCustomTitle: (n) => `مخصص · ${n} سؤال`,
  inProgress: "قيد التقدم",
  termsInSet: (n) => `مصطلحات في هذه المجموعة (${n})`,
  flashcardLayout: "تخطيط البطاقات",
  favorite: "مفضلة",
  addNote: "إضافة ملاحظة",
  yourNote: "ملاحظتك…",
  highlightColor: (color) => `تمييز ${color}`,
};

export function getHomeContent(locale: AppLocale): HomeContent {
  const isAr = locale === "ar";
  return {
    questions: isAr ? QUESTIONS_AR : QUESTIONS_EN,
    cards: isAr ? CARDS_AR : CARDS_EN,
    readPages: isAr ? READ_PAGES_AR : READ_PAGES_EN,
    summary: isAr ? SUMMARY_AR : SUMMARY_EN,
    ...(isAr ? META_AR : META_EN),
  };
}

/** Stable English questions for scoring (correct index only). */
export const QUESTION_CORRECT_INDEX = QUESTIONS_EN.map((q) => q.correct);
