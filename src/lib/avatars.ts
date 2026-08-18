const styles = [
  "adventurer",
  "bottts",
  "avataaars",
  "fun-emoji",
  "notionists",
  "lorelei",
  "micah",
  "thumbs",
];

const seeds = ["Vantah", "Aurora", "Nebula", "Orion", "Lumen", "Zafira", "Kairo", "Mirai"];

export const AVATAR_OPTIONS: string[] = styles.map(
  (style, index) =>
    `https://api.dicebear.com/9.x/${style}/svg?seed=${seeds[index]}&backgroundType=gradientLinear`,
);

export function randomAvatar() {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]!;
}

export function fallbackAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}
