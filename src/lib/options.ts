export const LANGUAGE_OPTIONS = ["English", "Hindi", "Telugu"] as const;
export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];
export const isLanguageOption = (value: string): value is LanguageOption =>
  LANGUAGE_OPTIONS.includes(value as LanguageOption);

export const DEPARTMENT_OPTIONS = [
  "MARKETING",
  "SALES",
  "HR",
  "CONTENT",
  "PRODUCT",
  "OPERATIONS",
  "GEN AI SOCIAL MEDIA",
] as const;
export type DepartmentOption = (typeof DEPARTMENT_OPTIONS)[number];
export const isDepartmentOption = (value: string): value is DepartmentOption =>
  DEPARTMENT_OPTIONS.includes(value as DepartmentOption);

export const CATEGORY_OPTIONS = [
  "Fashion & Lifestyle",
  "Beauty & Personal Care",
  "Tech & Gadgets",
  "Gaming",
  "Food & Dining",
  "Travel",
  "News & Politics",
  "Finance & Business",
  "Health & Fitness",
  "Education",
  "Entertainment",
  "Sports",
  "Other",
] as const;
export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];
export const isCategoryOption = (value: string): value is CategoryOption =>
  CATEGORY_OPTIONS.includes(value as CategoryOption);

export const COUNTRY_CODE_OPTIONS = [
  { value: "+91", label: "India (+91)" },
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+65", label: "Singapore (+65)" },
] as const;

export const normalizeDepartment = (
  value?: string | null
): DepartmentOption | null => {
  if (!value) {
    return null;
  }
  const lowercase = value.trim().toLowerCase();
  if (!lowercase) {
    return null;
  }
  const match = DEPARTMENT_OPTIONS.find(
    (option) => option.toLowerCase() === lowercase
  );
  return match ?? null;
};
