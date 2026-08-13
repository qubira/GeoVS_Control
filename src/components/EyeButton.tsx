export default function EyeButton({ onClick, title = "Ver detalle" }: { onClick: () => void; title?: string }) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} title={title} aria-label={title}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}
