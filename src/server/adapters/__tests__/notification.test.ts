import { describe, expect, it, vi } from "vitest";
import {
  ConsoleNotificationProvider,
  resolveNotificationProvider,
} from "../notification";
import { TelegramNotificationProvider } from "../telegram-notification";

/**
 * Provider selection. Tested as a pure function of configuration, so no credential is
 * needed and the production guard is verifiable.
 */

const credentials = { botToken: "token", chatId: "chat" };

describe("resolveNotificationProvider", () => {
  it("selects Telegram when both credentials are present", () => {
    const provider = resolveNotificationProvider({
      telegram: credentials,
      isProduction: false,
    });
    expect(provider).toBeInstanceOf(TelegramNotificationProvider);
  });

  it("selects Telegram in production too", () => {
    const provider = resolveNotificationProvider({
      telegram: credentials,
      isProduction: true,
    });
    expect(provider).toBeInstanceOf(TelegramNotificationProvider);
  });

  it("falls back to the console provider outside production", () => {
    const provider = resolveNotificationProvider({
      telegram: null,
      isProduction: false,
    });
    expect(provider).toBeInstanceOf(ConsoleNotificationProvider);
  });

  it("fails loudly rather than silently dropping notifications in production", () => {
    expect(() =>
      resolveNotificationProvider({ telegram: null, isProduction: true })
    ).toThrow(/TELEGRAM_BOT_TOKEN/);
  });
});

describe("ConsoleNotificationProvider", () => {
  it("logs the type, subject and safe metadata but never the body", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const result = await new ConsoleNotificationProvider().send({
      type: "lead_received",
      subject: "ליד חדש מהאתר",
      body: "שם: דנה לוי\nטלפון: 050-1234567",
      metadata: { leadId: "lead-1", requestId: "req-1" },
    });

    expect(result.success).toBe(true);
    const logged = info.mock.calls.flat().join(" ");
    expect(logged).toContain("lead-1");
    expect(logged).not.toContain("דנה לוי");
    expect(logged).not.toContain("050-1234567");

    info.mockRestore();
  });
});
