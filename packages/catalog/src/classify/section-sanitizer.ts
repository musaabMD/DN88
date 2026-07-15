import type { ParsedArticle, ParsedSection } from "../models/article.js";

const BASIC_SCIENCE_SPECIALTIES = new Set([
  "anatomy",
  "biochemistry",
  "embryology",
  "genetics",
  "histology",
  "physiology",
]);

type BasicScienceProfile = {
  overviewFocus: string;
  coreHeading: string;
  coreItems: string[];
  clinicalItems: string[];
  examItems: string[];
};

const BASIC_SCIENCE_PROFILES: Record<string, BasicScienceProfile> = {
  anatomy: {
    overviewFocus:
      "structure, boundaries, relations, blood supply, innervation, imaging appearance, and clinically important lesion patterns",
    coreHeading: "Anatomic Framework",
    coreItems: [
      "Identify the main structures, boundaries, compartments, and named spaces.",
      "Map arterial supply, venous drainage, lymphatic drainage, and nerve relationships when relevant.",
      "Connect surface landmarks and imaging planes to the underlying anatomy.",
    ],
    clinicalItems: [
      "Use the anatomy to localize injury, compression, referred pain, vascular compromise, or procedural risk.",
      "Prioritize nearby structures that are commonly injured, compressed, obstructed, or encountered surgically.",
      "Separate normal anatomic variants from findings that require clinical correlation.",
    ],
    examItems: [
      "Know boundaries, contents, supply, drainage, innervation, and the most testable clinical correlations.",
      "Vascular supply predicts ischemic deficits; nerve course predicts weakness and sensory findings.",
      "Anatomy questions often ask what structure is injured, compressed, or at risk during a procedure.",
    ],
  },
  biochemistry: {
    overviewFocus:
      "molecular structure, enzyme function, pathways, regulation, inheritance, laboratory correlation, and clinical phenotype",
    coreHeading: "Molecular Framework",
    coreItems: [
      "Define the key molecules, substrates, products, enzymes, cofactors, and cellular compartments.",
      "Follow the pathway logic: input, regulated step, output, energy cost or yield, and feedback control.",
      "Connect abnormal pathway function to laboratory patterns and clinical correlations.",
    ],
    clinicalItems: [
      "Use clinical correlations to explain mechanisms rather than treating the topic as a standalone disease.",
      "Link inherited or acquired defects to expected metabolites, symptoms, screening tests, and confirmatory tests.",
      "Medication and nutrition links should be included only when they directly affect the pathway or molecule.",
    ],
    examItems: [
      "Know the rate-limiting step, required cofactors, major products, and classic deficiency pattern.",
      "Track where the pathway occurs in the cell and which tissues depend on it most.",
      "Biochemistry questions often test mechanism, inheritance, lab abnormality, or response to a missing cofactor.",
    ],
  },
  embryology: {
    overviewFocus:
      "developmental origin, timing, morphogenesis, derivatives, congenital anomalies, and clinical correlations",
    coreHeading: "Developmental Framework",
    coreItems: [
      "Identify the embryologic origin, key developmental steps, and final adult derivatives.",
      "Connect timing errors to congenital anomalies and expected associated structures.",
      "Use germ layer, pouch, arch, fold, septation, and migration patterns when relevant.",
    ],
    clinicalItems: [
      "Clinical correlations should explain congenital anatomy, screening findings, imaging patterns, or syndromic associations.",
      "Avoid adult disease framing unless the topic is specifically a clinical congenital condition.",
      "Relate anomalies to function, complications, and structures that share the same developmental origin.",
    ],
    examItems: [
      "Know origins, derivatives, timing, and classic malformations.",
      "Shared embryologic origin often explains associated anomalies.",
      "Embryology questions commonly ask which structure failed to migrate, fuse, canalize, rotate, or regress.",
    ],
  },
  genetics: {
    overviewFocus:
      "inheritance, gene function, variant effect, penetrance, testing approach, and clinical correlation",
    coreHeading: "Genetic Framework",
    coreItems: [
      "Define the inheritance pattern, gene or chromosome region, variant effect, and biologic mechanism.",
      "Separate genotype, phenotype, penetrance, expressivity, anticipation, imprinting, and mosaicism when relevant.",
      "Use testing strategy and counseling implications only when they follow from the mechanism.",
    ],
    clinicalItems: [
      "Clinical correlations should connect inheritance or molecular mechanism to phenotype, screening, and family risk.",
      "Avoid generic risk-factor framing when the topic is a concept, pathway, chromosome, or inheritance pattern.",
      "Include reproductive counseling only when it directly applies to the concept.",
    ],
    examItems: [
      "Know inheritance pattern, recurrence risk, mechanism, and classic testing clue.",
      "Pedigrees test transmission logic more than memorized disease lists.",
      "Genetics questions often hinge on penetrance, expressivity, anticipation, imprinting, or de novo variation.",
    ],
  },
  histology: {
    overviewFocus:
      "microscopic architecture, cell types, stains, ultrastructure, function, and clinical correlation",
    coreHeading: "Microscopic Framework",
    coreItems: [
      "Identify the tissue layers, cell types, extracellular matrix, and defining microscopic features.",
      "Connect structure to normal function, barrier properties, secretion, absorption, contraction, or conduction.",
      "Use stains, microscopy, and ultrastructure when they distinguish similar tissues.",
    ],
    clinicalItems: [
      "Clinical correlations should explain how tissue architecture changes in injury, inflammation, neoplasia, or repair.",
      "Avoid symptom-based disease framing unless the article is specifically a clinical condition.",
      "Relate microscopic changes to gross pathology, imaging, or laboratory findings when relevant.",
    ],
    examItems: [
      "Know identifying microscopic features, cell types, stains, and structure-function relationships.",
      "Histology questions often ask what cell is responsible for a function or what layer is affected.",
      "Compare similar tissues by their lining, matrix, glands, immune cells, and vascular pattern.",
    ],
  },
  physiology: {
    overviewFocus:
      "normal function, regulation, feedback loops, reserve, compensation, and clinically relevant derangements",
    coreHeading: "Functional Framework",
    coreItems: [
      "Define the controlled variable, sensor, integrator, effector, and feedback loop.",
      "Track inputs, outputs, transporters, channels, receptors, hormones, and pressure or flow relationships.",
      "Connect normal physiology to compensation, decompensation, and expected laboratory or waveform changes.",
    ],
    clinicalItems: [
      "Clinical correlations should explain abnormal function rather than turn the topic into a generic disease template.",
      "Use mechanism to predict symptoms, vital-sign changes, laboratory patterns, and treatment targets when relevant.",
      "Separate normal adaptation from pathologic compensation.",
    ],
    examItems: [
      "Know the graph, equation, receptor, transporter, feedback loop, and response to perturbation.",
      "Physiology questions often ask what changes first and what compensates next.",
      "Mechanism matters more than memorizing isolated values.",
    ],
  },
};

function specialtyFromSourcePath(sourcePath: string): string {
  return sourcePath.match(/content\/([^/]+)\//i)?.[1]?.toLowerCase() ?? "";
}

function isBasicScienceArticle(article: ParsedArticle): boolean {
  const specialty = specialtyFromSourcePath(article.sourcePath) || article.specialty.toLowerCase();
  return (
    article.articleType?.trim().toLowerCase() === "basic-science" &&
    BASIC_SCIENCE_SPECIALTIES.has(specialty)
  );
}

function profileFor(article: ParsedArticle): BasicScienceProfile {
  const specialty = specialtyFromSourcePath(article.sourcePath) || article.specialty.toLowerCase();
  return BASIC_SCIENCE_PROFILES[specialty] ?? BASIC_SCIENCE_PROFILES.physiology;
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function makeSection(
  id: string,
  heading: string,
  bodyMarkdown: string,
  sortOrder: number
): ParsedSection {
  return { id, heading, bodyMarkdown, sortOrder };
}

function buildBasicScienceSections(article: ParsedArticle): ParsedSection[] {
  const profile = profileFor(article);
  const title = article.title;
  const subject = specialtyFromSourcePath(article.sourcePath) || article.specialty;

  const sections = [
    makeSection(
      "overview",
      "Overview",
      bulletList([
        `${title} is a ${subject} topic focused on ${profile.overviewFocus}.`,
        "Use this article to organize the core concept, the high-yield relationships, and the clinical correlations that follow from the basic science.",
        "Clinical guidance, medication dosing, procedural thresholds, and emergency workflows belong in disease-specific articles, not in this basic-science topic.",
      ]),
      0
    ),
    makeSection(
      "learning-focus",
      "Learning Focus",
      bulletList([
        "Start with definitions and normal structure or function.",
        "Then connect the mechanism to common exam clues, laboratory patterns, imaging findings, or lesion localization.",
        "Keep disease management details only when they directly clarify the underlying science.",
      ]),
      1
    ),
    makeSection(
      "core-concepts",
      profile.coreHeading,
      bulletList(profile.coreItems),
      2
    ),
    makeSection(
      "clinical-correlations",
      "Clinical Correlations",
      bulletList(profile.clinicalItems),
      3
    ),
    makeSection(
      "exam-focus",
      "Exam Focus",
      bulletList(profile.examItems),
      4
    ),
    makeSection(
      "references",
      "References",
      bulletList([
        "Use current anatomy, physiology, biochemistry, histology, embryology, and genetics references during specialist review.",
        "When imported source notes are present, reconcile them against current references before publication.",
      ]),
      5
    ),
  ];

  return sections;
}

function basicSciencePreamble(article: ParsedArticle): string {
  return [
    `# ${article.title}`,
    "",
    "> **Basic-science review notice:** This topic is organized for learning and clinical correlation. Disease-specific diagnosis, treatment, medication dosing, procedural thresholds, and emergency workflows should be checked in the relevant clinical article and local guidance.",
  ].join("\n");
}

export function sanitizeArticleSections(article: ParsedArticle): ParsedArticle {
  if (!isBasicScienceArticle(article)) return article;

  const importedSourceNotes = article.sections.filter((section) =>
    section.id.startsWith("imported-source-notes")
  );
  const generated = buildBasicScienceSections(article);
  const sections = [...generated, ...importedSourceNotes].map((section, index) => ({
    ...section,
    sortOrder: index,
  }));

  return {
    ...article,
    preambleMarkdown: basicSciencePreamble(article),
    sections,
  };
}
