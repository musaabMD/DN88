export const MEDICAL_SPECIALTIES = [
  "Allergy and immunology",
  "Anaesthesiology",
  "Cardiology",
  "Cardiothoracic surgery",
  "Critical care medicine",
  "Dermatology",
  "Ear, nose, and throat",
  "Emergency medicine",
  "Endocrinology and metabolic disorders",
  "Gastroenterology and hepatology",
  "General surgery",
  "Genetics",
  "Geriatric medicine",
  "Haematology",
  "Health maintenance",
  "Hospital medicine",
  "Infectious diseases",
  "Internal medicine",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Nutrition",
  "Obstetrics and gynaecology",
  "Oncology",
  "Ophthalmology",
  "Orthopaedics",
  "Paediatrics and adolescent medicine",
  "Palliative care",
  "Primary care",
  "Psychiatry",
  "Respiratory disorders",
  "Rheumatology",
  "Sleep medicine",
  "Surgery",
  "Urology",
  "Vascular surgery",
  "Women's health",
] as const;

export type MedicalSpecialty = (typeof MEDICAL_SPECIALTIES)[number];

export type SpecialtyTopic = {
  id: string;
  title: string;
  specialty: MedicalSpecialty;
};

function topicId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function topicsFor(
  specialty: MedicalSpecialty,
  titles: string[]
): SpecialtyTopic[] {
  return titles.map((title) => ({
    id: topicId(title),
    title,
    specialty,
  }));
}

const ALLERGY_AND_IMMUNOLOGY_TOPICS = [
  "Acute asthma exacerbation in adults",
  "Acute rhinosinusitis",
  "Adult-onset Still's disease",
  "Allergic bronchopulmonary aspergillosis",
  "Allergic rhinitis",
  "Anaphylaxis",
  "Assessment of eosinophilia",
  "Assessment of food allergies and sensitivities",
  "Assessment of urticaria",
  "Asthma in adults",
  "Asthma in children",
  "Chronic granulomatous disease",
  "Common cutaneous drug reactions",
  "Complement deficiencies",
  "Contact dermatitis",
  "Cryoglobulinaemia",
  "Dermatitis herpetiformis",
  "Eczema",
  "Eosinophilic oesophagitis",
  "Food allergy",
  "Graft-versus-host disease",
  "Hypersensitivity pneumonitis",
  "Hypogammaglobulinaemia",
  "Insect bites and stings",
  "Mast cell activation syndrome",
  "Nasal polyps",
  "Non-allergic rhinitis",
  "Occupational asthma",
  "Paediatric acute-onset neuropsychiatric syndrome",
  "Paradoxical vocal fold motion (intermittent laryngeal obstruction)",
  "Rh incompatibility",
  "Severe combined immunodeficiency",
  "Urticaria and angio-oedema",
  "Wiskott-Aldrich syndrome",
] as const;

export const SPECIALTY_TOPIC_GROUPS: Array<{
  specialty: MedicalSpecialty;
  topics: SpecialtyTopic[];
}> = [
  {
    specialty: "Allergy and immunology",
    topics: topicsFor("Allergy and immunology", [
      ...ALLERGY_AND_IMMUNOLOGY_TOPICS,
    ]),
  },
];

export const ALL_SPECIALTY_TOPICS: SpecialtyTopic[] =
  SPECIALTY_TOPIC_GROUPS.flatMap((group) => group.topics);

export function filterSpecialtyTopics(query: string): SpecialtyTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_SPECIALTY_TOPICS;
  return ALL_SPECIALTY_TOPICS.filter(
    (topic) =>
      topic.title.toLowerCase().includes(q) ||
      topic.specialty.toLowerCase().includes(q)
  );
}

export function specialtiesWithoutTopics(): MedicalSpecialty[] {
  const withTopics = new Set(
    SPECIALTY_TOPIC_GROUPS.map((group) => group.specialty)
  );
  return MEDICAL_SPECIALTIES.filter((s) => !withTopics.has(s));
}
