export const INITIAL_CLASSES = [
  { id: 1, label: "3A", year: "2025-2026", count: 28 },
  { id: 2, label: "3B", year: "2025-2026", count: 31 },
  { id: 3, label: "M1 MIAGE", year: "2025-2026", count: 22 },
  { id: 4, label: "M2 MIAGE", year: "2025-2026", count: 19 },
  { id: 5, label: "L3 INFO", year: "2025-2026", count: 35 },
];

export const AVATARS = [
  "https://api.dicebear.com/7.x/personas/svg?seed=Alice&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/personas/svg?seed=Bob&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/personas/svg?seed=Clara&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/personas/svg?seed=David&backgroundColor=d1f4cc",
  "https://api.dicebear.com/7.x/personas/svg?seed=Emma&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/personas/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/personas/svg?seed=Grace&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/personas/svg?seed=Hugo&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/personas/svg?seed=Iris&backgroundColor=d1f4cc",
  "https://api.dicebear.com/7.x/personas/svg?seed=Jules&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/personas/svg?seed=Kira&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/personas/svg?seed=Leo&backgroundColor=ffd5dc",
];

const FIRST_NAMES = [
  "Alice","Bob","Clara","David","Emma","Félix","Grace","Hugo","Iris","Jules","Kira","Léo","Maya","Nathan","Olivia","Pierre","Quinn","Rania","Samuel","Tina","Ugo","Vera","William","Xena","Yann","Zoé"
];

const LAST_NAMES = [
  "Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau","Simon","Laurent","Lefebvre","Michel","Garcia","David","Bertrand","Roux","Vincent","Fournier"
];

export const INITIAL_STUDENTS = Array.from({ length: 32 }, (_, i) => ({
  id: i + 1,
  firstName: FIRST_NAMES[i % FIRST_NAMES.length],
  lastName: LAST_NAMES[i % LAST_NAMES.length],
  email: `${FIRST_NAMES[i % FIRST_NAMES.length].toLowerCase()}.${LAST_NAMES[i % LAST_NAMES.length].toLowerCase()}@etudiant.fr`,
  classId: [1, 1, 1, 2, 2, 3][i % 6],
  photo: AVATARS[i % AVATARS.length],
  createdAt: "2026-02-15",
}));

export const EXPORTS_LOG = [
  { id: 1, class: "3A", format: "PDF", by: "admin@ecole.fr", date: "2026-02-20 14:32" },
  { id: 2, class: "M1 MIAGE", format: "HTML", by: "prof.dupont@ecole.fr", date: "2026-02-19 09:15" },
  { id: 3, class: "3B", format: "PDF", by: "admin@ecole.fr", date: "2026-02-18 16:48" },
];

export const CLASS_COLORS = ["#e8593a", "#2e75b6", "#70ad47", "#9b59b6", "#f39c12", "#1abc9c"];
