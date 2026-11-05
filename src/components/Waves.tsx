// 背景に流れる細い潮の線（飾り）。ゆっくり横に流れ、動きを減らす設定では止まる
import s from "./Waves.module.css";

function wave(y: number, amp: number, len: number, w: number): string {
  let d = `M0 ${y}`;
  for (let x = 0; x <= w; x += len / 2) {
    const up = (x / (len / 2)) % 2 === 0;
    d += ` Q${x + len / 4} ${y + (up ? -amp : amp)} ${x + len / 2} ${y}`;
  }
  return d;
}

export function Waves({ count = 7, tone = "night" }: { count?: number; tone?: "night" | "paper" }) {
  const lines = Array.from({ length: count }, (_, i) => ({ y: 60 + i * 64, amp: 10 + (i % 3) * 6, len: [360, 480, 288, 240][i % 4] }));
  return (
    <div className={`${s.waves} ${tone === "paper" ? s.paper : ""}`} aria-hidden="true">
      <svg viewBox="0 0 2880 520" preserveAspectRatio="none">
        {lines.map((l, i) => (
          <path key={i} d={wave(l.y, l.amp, l.len, 2880)} style={{ animationDuration: `${38 + i * 6}s`, animationDirection: i % 2 ? "reverse" : "normal" }} />
        ))}
      </svg>
    </div>
  );
}
