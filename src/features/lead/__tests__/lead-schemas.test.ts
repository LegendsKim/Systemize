import { describe, expect, it } from "vitest";
import { leadValidation } from "../lead-content";
import {
  idempotencyKeySchema,
  leadSchema,
  parseLeadFormData,
  toFieldErrors,
} from "../lead-schemas";

function validLead(overrides: Record<string, string> = {}) {
  return {
    full_name: "דנה לוי",
    business_name: "מעבדות אריאל",
    phone: "050-1234567",
    email: "dana@example.co.il",
    message: "כל הזמנה עוברת דרך שלושה קבצי אקסל ואף אחד לא יודע מה המצב.",
    ...overrides,
  };
}

function formDataOf(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("leadSchema", () => {
  it("accepts a complete lead", () => {
    expect(leadSchema.safeParse(validLead()).success).toBe(true);
  });

  it("trims text fields and lowercases the email", () => {
    const parsed = leadSchema.parse(
      validLead({ full_name: "  דנה לוי  ", email: "  Dana@Example.CO.IL  " })
    );
    expect(parsed.full_name).toBe("דנה לוי");
    expect(parsed.email).toBe("dana@example.co.il");
  });

  it("reports every missing field in Hebrew, with actionable messages", () => {
    const result = leadSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = toFieldErrors(result.error);
    expect(errors.full_name?.[0]).toBe(leadValidation.full_name.required);
    expect(errors.business_name?.[0]).toBe(leadValidation.business_name.required);
    expect(errors.phone?.[0]).toBe(leadValidation.phone.required);
    expect(errors.email?.[0]).toBe(leadValidation.email.required);
    expect(errors.message?.[0]).toBe(leadValidation.message.required);
  });

  it.each([
    ["050-1234567", true],
    ["0501234567", true],
    ["+972 50 123 4567", true],
    ["(03) 1234567", true],
    ["12345", false],
    ["not-a-phone", false],
  ])("phone %s validity is %s", (phone, expected) => {
    expect(leadSchema.safeParse(validLead({ phone })).success).toBe(expected);
  });

  it.each([
    ["dana@example.co.il", true],
    ["dana+lead@example.com", true],
    ["dana@example", false],
    ["dana.example.com", false],
    ["@example.com", false],
  ])("email %s validity is %s", (email, expected) => {
    expect(leadSchema.safeParse(validLead({ email })).success).toBe(expected);
  });

  it("rejects a message that is too short and one that is too long", () => {
    const short = leadSchema.safeParse(validLead({ message: "קצר" }));
    expect(short.success).toBe(false);

    const long = leadSchema.safeParse(validLead({ message: "א".repeat(5001) }));
    expect(long.success).toBe(false);
  });

  it("rejects over-long names and emails", () => {
    expect(leadSchema.safeParse(validLead({ full_name: "א".repeat(201) })).success).toBe(
      false
    );
    expect(
      leadSchema.safeParse(
        validLead({ email: `${"a".repeat(320)}@example.com` })
      ).success
    ).toBe(false);
  });
});

describe("parseLeadFormData", () => {
  it("reads the five visitor fields from FormData", () => {
    const result = parseLeadFormData(formDataOf(validLead()));
    expect(result.success).toBe(true);
  });

  it("ignores server-generated fields a client tries to supply", () => {
    const formData = formDataOf({
      ...validLead(),
      id: "11111111-1111-4111-8111-111111111111",
      created_at: "1999-01-01T00:00:00.000Z",
      request_id: "forged-request-id",
    });

    const result = parseLeadFormData(formData);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(Object.keys(result.data).sort()).toEqual([
      "business_name",
      "email",
      "full_name",
      "message",
      "phone",
    ]);
  });

  it("drops non-string entries instead of coercing them", () => {
    const formData = formDataOf(validLead());
    formData.set("full_name", new File(["x"], "name.txt"));
    expect(parseLeadFormData(formData).success).toBe(false);
  });
});

describe("toFieldErrors", () => {
  it("keeps only known field paths", () => {
    const result = leadSchema.safeParse({ ...validLead(), full_name: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(Object.keys(toFieldErrors(result.error))).toEqual(["full_name"]);
  });
});

describe("idempotencyKeySchema", () => {
  it("accepts a UUID", () => {
    expect(
      idempotencyKeySchema.safeParse("6f9619ff-8b86-4d01-b42d-00cf4fc964ff").success
    ).toBe(true);
  });

  it.each(["", "not-a-uuid", "6f9619ff8b864d01b42d00cf4fc964ff", "../../etc/passwd"])(
    "rejects %s",
    (candidate) => {
      expect(idempotencyKeySchema.safeParse(candidate).success).toBe(false);
    }
  );
});
