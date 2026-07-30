export type NavIconName = "home" | "study" | "upload" | "review" | "profile";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/feed", label: "Studio", icon: "study" },
  { href: "/upload", label: "Upload", icon: "upload" },
  { href: "/review", label: "Ripasso", icon: "review" },
  { href: "/profile", label: "Profilo", icon: "profile" },
];
