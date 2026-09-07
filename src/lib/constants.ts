export const PROVINCES = [
  { value: "EASTERN_CAPE", label: "Eastern Cape" },
  { value: "FREE_STATE", label: "Free State" },
  { value: "GAUTENG", label: "Gauteng" },
  { value: "KWAZULU_NATAL", label: "KwaZulu-Natal" },
  { value: "LIMPOPO", label: "Limpopo" },
  { value: "MPUMALANGA", label: "Mpumalanga" },
  { value: "NORTHERN_CAPE", label: "Northern Cape" },
  { value: "NORTH_WEST", label: "North West" },
  { value: "WESTERN_CAPE", label: "Western Cape" },
] as const;

export const COMPANY_TYPES = [
  { value: "PTY_LTD", label: "(Pty) Ltd" },
  { value: "CC", label: "Close Corporation (CC)" },
  { value: "SOLE_PROPRIETOR", label: "Sole Proprietor" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "NPO", label: "Non-Profit Organisation (NPO)" },
  { value: "TRUST", label: "Trust" },
  { value: "OTHER", label: "Other" },
] as const;

export const BBBEE_LEVELS = [
  { value: "LEVEL_1", label: "Level 1" },
  { value: "LEVEL_2", label: "Level 2" },
  { value: "LEVEL_3", label: "Level 3" },
  { value: "LEVEL_4", label: "Level 4" },
  { value: "LEVEL_5", label: "Level 5" },
  { value: "LEVEL_6", label: "Level 6" },
  { value: "LEVEL_7", label: "Level 7" },
  { value: "LEVEL_8", label: "Level 8" },
  { value: "EXEMPT_MICRO_ENTERPRISE", label: "Exempt Micro Enterprise (EME)" },
  { value: "QUALIFYING_SMALL_ENTERPRISE", label: "Qualifying Small Enterprise (QSE)" },
  { value: "NON_COMPLIANT", label: "Non-compliant" },
] as const;

export const CSD_STATUSES = [
  { value: "NOT_REGISTERED", label: "Not registered" },
  { value: "PENDING", label: "Pending" },
  { value: "REGISTERED", label: "Registered" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

export const CIDB_GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export const CIDB_CLASSES_OF_WORK = [
  { value: "GB", label: "GB — General Building" },
  { value: "CE", label: "CE — Civil Engineering" },
  { value: "EB", label: "EB — Electrical Engineering (Building)" },
  { value: "EP", label: "EP — Electrical Engineering (Infrastructure)" },
  { value: "ME", label: "ME — Mechanical Engineering" },
  { value: "SB", label: "SB — Specialist: Building" },
  { value: "SC", label: "SC — Specialist: Civil" },
] as const;

export const ONBOARDING_STEPS = [
  { key: "COMPANY_BASICS", label: "Company Basics", path: "basics" },
  { key: "COMPLIANCE", label: "Compliance", path: "compliance" },
  { key: "CAPABILITY", label: "Capability", path: "capability" },
  { key: "DOCUMENTS", label: "Documents", path: "documents" },
  { key: "REVIEW", label: "Review", path: "review" },
] as const;
