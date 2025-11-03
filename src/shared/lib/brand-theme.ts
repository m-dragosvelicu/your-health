export type BrandThemeKey = "deep";

export const brandThemes: Record<BrandThemeKey, {
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  bg50: string;
  bg100: string;
  bg200: string;
  text: string;
}> = {
  deep: {
    name: "Deep Purple",
    primary: "#8046AF",
    primaryDark: "#6B3891",
    primaryLight: "#9559C4",
    bg50: "#FAF5FF",
    bg100: "#F3E8FF",
    bg200: "#E9D5FF",
    text: "#0A0713",
  },
};

export const themeOrder: readonly BrandThemeKey[] = ["deep"] as const;

export const defaultBrandTheme: BrandThemeKey = "deep";

function withAlpha(hex: string, alphaHex: string): string {
  // Expect #RRGGBB, return #RRGGBBAA
  if (!hex?.startsWith("#")) return hex;
  const clean = hex.slice(1);
  if (clean.length === 8) return hex; // already has alpha
  if (clean.length !== 6) return hex;
  return `#${clean}${alphaHex}`;
}

export function applyBrandTheme(themeKey: BrandThemeKey, root: HTMLElement = document.documentElement) {
  const t = brandThemes[themeKey];
  if (!t) return;
  root.style.setProperty("--brand-primary", t.primary);
  root.style.setProperty("--brand-primary-dark", t.primaryDark);
  root.style.setProperty("--brand-primary-light", t.primaryLight);
  root.style.setProperty("--brand-bg-50", t.bg50);
  root.style.setProperty("--brand-bg-100", t.bg100);
  root.style.setProperty("--brand-bg-200", t.bg200);
  root.style.setProperty("--brand-text", t.text);
  root.style.setProperty("--brand-primary-40", withAlpha(t.primary, "40"));
  root.setAttribute("data-brand-theme", themeKey);
}
