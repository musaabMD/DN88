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
  {
    stem: "رجل في الثامنة والخمسين من العمر يشكو من ألم ساحق في الصدر، وتُظهر تخطيط القلب ارتفاع مقطع ST بمقدار 2 مم في II وIII وaVF. ما أفضل إجراء تالي؟",
    options: [
      "أسبرين + قسطرة قلبية علاجية خلال 90 دقيقة",
      "علاج بمذيبات الخثرة بغض النظر عن توفر القسطرة",
      "حاصر بيتا وحده",
      "قياس التروبونين متتابعًا فقط",
    ],
    correct: 0,
    explain:
      "احتشاء بارتفاع ST في الجدار السفلي مع إمكانية القسطرة في الوقت المناسب: قسطرة أولية مع أسبرين.",
  },
  {
    stem: "أي نمط في تخطيط القلب يُحدّد موقع احتشاء الجدار السفلي بدقة؟",
    options: ["ارتفاع ST في V1–V4", "ارتفاع ST في I وaVL", "ارتفاع ST في II وIII وaVF", "انخفاض ST منتشر"],
    correct: 2,
    explain: "المشتقات II وIII وaVF تواجه الجدار السفلي.",
  },
  {
    stem: "الخط الأول لضبط معدل ضربات القلب في الرجفان الأذيني المستقر مع نسبة طرح طبيعية؟",
    options: ["أدينوزين وريدي", "حاصر بيتا", "تحميل ديجوكسين", "صدمة كهربائية فورية"],
    correct: 1,
    explain: "حاصرات بيتا (أو حاصرات قنوات الكالسيوم غير ديهيدروبيريدين) هي الخط الأول.",
  },
  {
    stem: "أفضل خطوة عند اشتباه انصمام رئوي مع احتمال سريري منخفض؟",
    options: ["تصوير الأوعية الرئوية بالأشعة المقطعية", "مسح التهوية والتروية", "دي-دايمر", "هيبارين تجريبي"],
    correct: 2,
    explain: "احتمال سريري منخفض → فحص دي-دايمر لاستبعاد الانصمام.",
  },
  {
    stem: "العلاج طويل الأمد المفضل بعد احتشاء بدون ارتفاع ST؟",
    options: ["أسبرين وحده", "مضادات صفائح مزدوجة + ستاتين عالي الكثافة", "وارفارين", "حاصر قنوات الكالسيوم وحده"],
    correct: 1,
    explain: "العلاج بمضادات صفائح مزدوجة مع ستاتين عالي الكثافة هو معيار الوقاية الثانوية.",
  },
  {
    stem: "النمط الكلاسيكي لتخطيط القلب في التهاب التامور الحاد؟",
    options: ["ارتفاع ST منتشر مع انخفاض PR", "ارتفاع ST موضعي", "موجات T مدبّبة", "موجة دلتا"],
    correct: 0,
    explain: "ارتفاع ST منتشر مع انخفاض PR سمة مميزة لالتهاب التامور.",
  },
  {
    stem: "أسرع وسيلة لتخفيف أعراض الذبحة الصدرية المستقرة؟",
    options: ["نتروجليسرين تحت اللسان", "حاصر بيتا فموي", "رانولازين", "أسبرين"],
    correct: 0,
    explain: "النتروجليسرين تحت اللسان يخفّف الألم بسرعة.",
  },
  {
    stem: "عكس مفعول الوارفارين عند نزيف كبير؟",
    options: ["فيتامين K وحده", "مركز بروثرومبين مركّب (4 عوامل) + فيتامين K", "بلازما طازجة مجمّدة وحدها", "بروتامين"],
    correct: 1,
    explain: "النزيف الكبير → مركز بروثرومبين مركّب مع فيتامين K وريدي.",
  },
  {
    stem: "فحص تمدد الأوعية البطنية الموصى به؟",
    options: ["أشعة مقطعية لجميع البالغين فوق 50", "موجات فوق صوتية لمرة واحدة للرجال 65–75 ممن دخّنوا", "تصوير بالرنين سنوي", "لا يُوصى بفحص"],
    correct: 1,
    explain: "موجات فوق صوتية لمرة واحدة للرجال 65–75 مع أي تاريخ تدخين.",
  },
  {
    stem: "أي نفخة قلبية تشتد مع مناورة فيسلفا؟",
    options: ["تضيّق الأبهر", "قصور الصمام التاجي", "اعتلال عضلة القلب الضخامي", "تضيّق الشريان الرئوي"],
    correct: 2,
    explain: "انخفاض حجم الدم الداخل للبطين يزيد شدة نفخة اعتلال عضلة القلب الضخامي الانسدادي.",
  },
  {
    stem: "الخط الأول لعلاج ارتفاع ضغط الدم لدى مريض من أصل أفريقي بدون مرض كُلوي مزمن؟",
    options: ["مثبطات ACE", "مدرّ بول ثيازيدي أو حاصر قنوات الكالسيوم", "حاصر بيتا", "حاصر ألفا"],
    correct: 1,
    explain: "مدرّات البول الثيازيدية أو حاصرات قنوات الكالسيوم هي الخيارات الأولية المفضّلة.",
  },
  {
    stem: "استراتيجية الدهون للوقاية الثانوية؟",
    options: ["ستاتين كثافة منخفضة", "ستاتين كثافة عالية", "فيبرات", "فيتامين B3"],
    correct: 1,
    explain: "الستاتين عالي الكثافة معيار للوقاية الثانوية.",
  },
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
  {
    t: "احتشاء بارتفاع ST — الجدار السفلي: أي المشتقات؟",
    d: "II, III, aVF",
    img: "/flashcards/inferior-stemi.svg",
    imgAlt: "تخطيط قلب لاحتشاء الجدار السفلي مع ارتفاع ST في II وIII وaVF",
  },
  {
    t: "نافذة القسطرة مقابل مذيبات الخثرة",
    d: "خلال 90 دقيقة",
    img: "/flashcards/pci-timeline.svg",
    imgAlt: "القسطرة خلال 90 دقيقة مقابل العلاج بمذيبات الخثرة",
  },
  {
    t: "احتشاء بارتفاع ST — الجدار الأمامي: أي المشتقات؟",
    d: "V1 – V4",
    img: "/flashcards/anterior-stemi.svg",
    imgAlt: "تخطيط قلب لاحتشاء الجدار الأمامي مع ارتفاع ST في V1–V4",
  },
  { t: "عكس الوارفارين (نزيف كبير)", d: "مركز بروثرومبين مركّب + فيتامين K" },
  {
    t: "تخطيط القلب في التهاب التامور",
    d: "ارتفاع ST منتشر، انخفاض PR",
    img: "/flashcards/pericarditis-ecg.svg",
    imgAlt: "تخطيط قلب التهاب التامور مع ارتفاع ST منتشر",
  },
  { t: "أي نفخة تشتد مع مناورة فيسلفا؟", d: "اعتلال عضلة القلب الضخامي" },
  { t: "فحص تمدد الأوعية البطنية", d: "موجات فوق صوتية — رجال 65–75 ممن دخّنوا" },
  { t: "ذبحة مستقرة — تخفيف سريع", d: "نتروجليسرين تحت اللسان" },
];

const READ_PAGES_EN: HomeReadPage[] = [
  { h: "Chapter 1 · Cardiology", body: ["Acute coronary syndromes span unstable angina, NSTEMI, and STEMI along a continuum of plaque rupture and thrombus formation.", "First-line management prioritizes reperfusion. Where PCI is reachable within 90 minutes, it is preferred over fibrinolysis."], key: "ST-elevation in leads II, III, aVF localizes to the inferior wall — check a right-sided ECG for RV involvement." },
  { h: "Chapter 2 · Reperfusion", body: ["Primary PCI restores flow fastest and is the standard of care when a catheterization lab is available in time.", "Adjuncts include dual antiplatelet therapy, anticoagulation, and beta-blockade once the patient is hemodynamically stable."], key: "Door-to-balloon under 90 minutes is the benchmark for primary PCI." },
  { h: "Chapter 3 · Secondary prevention", body: ["After an event, high-intensity statins, DAPT, ACE inhibitors, and beta-blockers reduce recurrence.", "Cardiac rehabilitation and risk-factor control anchor long-term outcomes."], key: "High-intensity statin therapy is standard for secondary prevention." },
];

const READ_PAGES_AR: HomeReadPage[] = [
  {
    h: "الفصل 1 · أمراض القلب",
    body: [
      "متلازمات الشريان التاجي الحادة — من الذبحة غير المستقرة إلى احتشاء بدون ارتفاع ST وارتفاع ST — تمثل طيفًا واحدًا من تمزق اللويحة وتكوّن الخثرة.",
      "الأولوية في الإدارة لإعادة التروية: إذا وُجدت قسطرة قلبية خلال 90 دقيقة، فهي أفضل من العلاج بمذيبات الخثرة.",
    ],
    key: "ارتفاع ST في II وIII وaVF يشير إلى الجدار السفلي — سجّل تخطيطًا للجانب الأيمن لاستبعاد إصابة البطين الأيمن.",
  },
  {
    h: "الفصل 2 · إعادة التروية",
    body: [
      "القسطرة الأولية تستعيد التدفق أسرع، وهي المعيار عند توفر مختبر القسطرة في الوقت المناسب.",
      "العلاج الإضافي يشمل مضادات صفائح مزدوجة، مميّعات، وحاصرات بيتا بعد الاستقرار الدموي.",
    ],
    key: "من الباب إلى البالون خلال 90 دقيقة هو المعيار للقسطرة الأولية.",
  },
  {
    h: "الفصل 3 · الوقاية الثانوية",
    body: [
      "بعد الحدث: ستاتين عالي الكثافة، مضادات صفائح مزدوجة، مثبطات ACE، وحاصرات بيتا تقلّل الانتكاس.",
      "إعادة التأهيل القلبي والتحكم في عوامل الخطر يرسخان النتائج على المدى الطويل.",
    ],
    key: "الستاتين عالي الكثافة معيار للوقاية الثانوية.",
  },
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
  callout: "توقيت إعادة التروية أهم مفهوم في هذه المجموعة — اربط باقي النقاط به.",
  keyTakeaways: "النقاط الأساسية",
  expandDetail: "تفاصيل إضافية",
  checklist: "قائمة مراجعة",
  bullets: [
    "ارتفاع ST يُحدد حسب المشتقات: السفلي (II, III, aVF)، الأمامي (V1–V4)، الجانبي (I, aVL, V5–V6).",
    "القسطرة خلال 90 دقيقة أفضل من مذيبات الخثرة عند توفر مختبر القسطرة.",
    "مضادات الصفائح المزدوجة مع مميّعات الدم علاج إضافي معياري.",
  ],
  checks: [
    "حدّد موقع احتشاء ارتفاع ST حسب مجموعات المشتقات",
    "احفظ نافذة 90 دقيقة للقسطرة",
    "تذكّر مضادات الصفائح المزدوجة + ستاتين للوقاية",
    "تخطيط الجانب الأيمن في احتشاء الجدار السفلي",
  ],
  toggles: [
    {
      id: "toggle-stemi",
      title: "احتشاء بارتفاع ST مقابل بدون ارتفاع ST — كيف تُميّز؟",
      body: "احتشاء بارتفاع ST: ارتفاع ST مستمر ويحتاج إعادة تروية عاجلة. احتشاء بدون ارتفاع ST: انخفاض ST أو تغيّرات T مع تروبونين إيجابي، يُدار باستراتيجية قسطرة مبكرة أو موجهة بقلة التروية.",
    },
    {
      id: "toggle-meds",
      title: "الأدوية الإضافية — نظرة سريعة",
      body: "أسبرين، مثبط P2Y12، مميّع، ستاتين عالي الكثافة، وحاصر بيتا بعد الاستقرار — ومثبط ACE عند انخفاض نسبة طرح البطين.",
    },
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
  chatGreeting: "مرحبًا! اسأل عن أي جزء من هذا الملف — ظلّل نصًا أو اكتب سؤالك أدناه.",
  chatMockReply: "باختصار: ركّز على الآلية الأكثر عائدًا أولًا، ثم الاستثناء. هل تريد تحويلها إلى بطاقة أو سؤال تدريبي؟",
  chatExplainThis: "اشرح هذا",
  sessionQuizTitle: "تدريب على الاختبار",
  sessionCustomTitle: (n) => (n === 1 ? "مخصص · سؤال واحد" : n === 2 ? "مخصص · سؤالان" : `مخصص · ${n} أسئلة`),
  inProgress: "قيد الإنجاز",
  termsInSet: (n) => (n === 1 ? "مصطلح واحد في المجموعة" : n === 2 ? "مصطلحان في المجموعة" : `${n} مصطلحات في المجموعة`),
  flashcardLayout: "طريقة عرض البطاقات",
  favorite: "مفضّلة",
  addNote: "إضافة ملاحظة",
  yourNote: "ملاحظتك…",
  highlightColor: (color) => {
    const labels: Record<string, string> = { yellow: "أصفر", green: "أخضر", blue: "أزرق", pink: "وردي" };
    return `تمييز ${labels[color] ?? color}`;
  },
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
