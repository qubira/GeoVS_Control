const LABELS: Record<string, string> = {
  player: "Jugador",
  developer: "Desarrollador",
  moderator: "Moderador",
  admin: "Admin",
};

export default function RoleBadge({ role }: { role: string }) {
  return <span className={`badge badge-${role}`}>{LABELS[role] || role}</span>;
}
