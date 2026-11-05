import { describe, expect, it } from "vitest";
import { HOUR, jstDayStart } from "./almanac";
import { notificationMail } from "./notification-mail";

const t = jstDayStart(2026, 11, 6) + 5 * HOUR;
const window = { start: t, end: t + 2 * HOUR, peak: t + HOUR, score: 80, reason: "上げ潮 × 朝まずめ" };

describe("notificationMail", () => {
  it("前の晩の時合い：地点名・時間帯・推算値", () => {
    const m = notificationMail({ kind: "jiai-evening", spotId: "jogashima", sendAt: 0, window });
    expect(m.subject).toContain("城ヶ島");
    expect(m.subject).toContain("5:00〜7:00");
    expect(m.text).toContain("推算値");
    expect(m.text).toContain("上げ潮 × 朝まずめ");
  });
  it("90分前", () => {
    const m = notificationMail({ kind: "jiai-before", spotId: "jogashima", sendAt: 0, window });
    expect(m.subject).toContain("あと90分");
    expect(m.text).toContain("5:00");
  });
  it("干潮：時刻と潮位に推算値と書く", () => {
    const m = notificationMail({ kind: "low-tide", spotId: "enoshima", sendAt: 0, low: { t, h: 12.4 } });
    expect(m.subject).toContain("江の島");
    expect(m.text).toContain("12cm（推算値）");
  });
});
