import { describe, expect, it } from "vitest";
import {
  buildInvitationMessage,
  buildInvitationWhatsAppHref,
} from "../share-message";

const subject = {
  fullName: "דנה כהן",
  projectName: "Lumin · תקשורת",
  shareUrl: "https://systemize.co.il/invite/abc123",
};

describe("invitation share message", () => {
  it("opens by name and names the project", () => {
    const message = buildInvitationMessage(subject);

    expect(message).toContain("היי דנה");
    expect(message).toContain("Lumin · תקשורת");
  });

  it("carries the link and says what happens after pressing it", () => {
    const message = buildInvitationMessage(subject);

    expect(message).toContain(subject.shareUrl);
    expect(message).toContain("Gmail");
    expect(message).toContain("שבעה ימים");
  });

  it("still reads as a message when the name is missing", () => {
    expect(buildInvitationMessage({ ...subject, fullName: "" })).toContain(
      "היי,"
    );
  });

  it("normalises a local phone into a chat link", () => {
    const href = buildInvitationWhatsAppHref({
      ...subject,
      phone: "050-123-4567",
    });

    expect(href).toContain("https://wa.me/972501234567?text=");
    expect(decodeURIComponent(href ?? "")).toContain(subject.shareUrl);
  });

  /*
   * A button that opens a chat with whoever happens to own the mistyped number is worse
   * than no button, so an unreadable phone yields nothing to press.
   */
  it("returns nothing when the phone cannot be read with confidence", () => {
    expect(
      buildInvitationWhatsAppHref({ ...subject, phone: "12" })
    ).toBeNull();
  });
});
