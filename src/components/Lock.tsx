/** 鍵の印（有料の範囲）。線だけの南京錠。色は文字の色を使う */
export function Lock({ size = 12, label }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ flex: "none" }}>
      <rect x="2.75" y="7" width="10.5" height="7.25" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
