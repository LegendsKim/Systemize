import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  authenticatedPortalContext,
  portalE2EProjects,
  portalE2EUsers,
} from "./portal-auth-helper";

test.describe.serial("authenticated client journey", () => {
  test.skip(
    process.env.PORTAL_E2E !== "1",
    "Run with npm run test:e2e:portal so deterministic local auth fixtures exist."
  );

  test("client and owner complete intake, document, and payment gates", async ({
    browser,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://127.0.0.1:3000";
    const [ownerContext, clientContext] = await Promise.all([
      authenticatedPortalContext(browser, portalE2EUsers.owner, origin),
      authenticatedPortalContext(browser, portalE2EUsers.clientA, origin),
    ]);

    try {
      const ownerPage = await ownerContext.newPage();
      const clientPage = await clientContext.newPage();

      /*
       * A client who has never been here is shown the orientation instead of the
       * dashboard, exactly once. Everything after this line depends on it being behind
       * us, which makes it the right place to prove it can be finished.
       */
      await clientPage.goto("/portal");
      const orientation = clientPage.getByRole("button", {
        name: "הבנתי, קדימה לאזור האישי",
      });
      if (await orientation.isVisible()) {
        await orientation.click();
      }
      await expect(
        clientPage.getByRole("heading", { name: /טוב לראות אותך/ })
      ).toBeVisible();

      await clientPage.goto(
        `/portal/projects/${portalE2EProjects.clientA}`
      );
      await expect(
        clientPage.getByRole("heading", { name: "E2E Project A" })
      ).toBeVisible();

      const deniedResponse = await clientPage.goto(
        `/portal/projects/${portalE2EProjects.clientB}`
      );
      expect(deniedResponse?.status()).toBe(404);

      await clientPage.goto(
        `/portal/projects/${portalE2EProjects.clientA}/discovery`
      );
      for (let step = 1; step <= 5; step += 1) {
        const visibleAnswers = clientPage.locator(
          ".intake-field:not([hidden]) textarea"
        );
        const count = await visibleAnswers.count();
        for (let index = 0; index < count; index += 1) {
          await visibleAnswers
            .nth(index)
            .fill(`תשובת E2E מפורטת לשלב ${step}, שדה ${index + 1}.`);
        }

        if (step < 5) {
          await clientPage
            .locator(
              '.intake-actions button[type="button"].portal-primary-action'
            )
            .click();
        }
      }

      await clientPage
        .locator('button[name="intent"][value="submit"]')
        .click();
      await expect(clientPage).toHaveURL(/notice=intake-submitted/);

      /*
       * The correction round trip. A change request has to reach the screen the client
       * actually opens, arrive with a note they can answer where they are reading it, and
       * come back as a submission the owner can see the answer to.
       */
      await ownerPage.goto(
        `/admin/projects/${portalE2EProjects.clientA}`
      );
      await ownerPage
        .locator('textarea[name="reviewNote"]')
        .fill("חסר לנו מי מקבל את ההחלטה בפועל.");
      await ownerPage
        .locator('button[name="decision"][value="request_changes"]')
        .click();
      await expect(ownerPage).toHaveURL(/notice=review-saved/);

      await clientPage.goto("/portal");
      await expect(
        clientPage.getByRole("heading", { name: /ממתינ(ה|ות) לך/ })
      ).toBeVisible();

      await clientPage.goto(
        `/portal/projects/${portalE2EProjects.clientA}/discovery`
      );
      await expect(
        clientPage.getByText("חסר לנו מי מקבל את ההחלטה בפועל.")
      ).toBeVisible();
      await clientPage
        .locator("#intake-client-reply")
        .fill("המנכ״ל מחליט ומנהלת התפעול מאשרת.");
      await clientPage
        .locator('.intake-review button[name="intent"][value="submit"]')
        .click();
      await expect(clientPage).toHaveURL(/notice=intake-submitted/);

      await ownerPage.goto(
        `/admin/projects/${portalE2EProjects.clientA}`
      );
      await expect(ownerPage.locator(".admin-client-reply")).toContainText(
        "מנהלת התפעול"
      );
      await ownerPage
        .locator('button[name="decision"][value="approve"]')
        .click();
      await expect(ownerPage).toHaveURL(/notice=review-saved/);

      const slotInput = ownerPage.locator('input[type="datetime-local"]');
      await expect(slotInput).toBeVisible();
      await slotInput.fill("2026-08-10T10:00");
      await slotInput.locator("xpath=ancestor::form").locator(
        'button[type="submit"]'
      ).click();
      await expect(ownerPage).toHaveURL(/notice=slot-created/);

      await clientPage.goto(
        `/portal/projects/${portalE2EProjects.clientA}`
      );
      await clientPage
        .locator(".workflow-slot-grid")
        .getByRole("button")
        .click();
      await expect(clientPage).toHaveURL(/notice=meeting-booked/);
      await expect(
        clientPage.getByText("מכינים את קישור ה־Zoom")
      ).toBeVisible();

      await ownerPage.goto(
        `/admin/projects/${portalE2EProjects.clientA}`
      );
      const completeMeetingForm = ownerPage
        .locator('input[name="slotId"]')
        .locator("xpath=ancestor::form");
      await completeMeetingForm.getByRole("button").click();
      await expect(ownerPage).toHaveURL(/notice=meeting-completed/);

      const documentForm = ownerPage.locator("form.document-editor");
      await expect(documentForm).toBeVisible();
      const narrativeFields = documentForm.locator("textarea");
      for (let index = 0; index < (await narrativeFields.count()); index += 1) {
        await narrativeFields
          .nth(index)
          .fill(
            `תוכן בדיקת E2E מפורט לשדה ${index + 1}, עם החלטות, הנחות ותוצאה עסקית ברורה.`
          );
      }
      await documentForm.locator('input[name="priceIls"]').fill("4500");
      await documentForm.getByRole("button", { name: /שמירת טיוטה/ }).click();
      await expect(ownerPage).toHaveURL(/notice=document-draft-saved/);
      expect(
        (await new AxeBuilder({ page: ownerPage }).analyze()).violations
      ).toEqual([]);

      const publishDocumentForm = ownerPage
        .locator('input[name="versionId"]')
        .locator("xpath=ancestor::form");
      await publishDocumentForm.getByRole("button", { name: /פרסום גרסה/ }).click();
      await expect(ownerPage).toHaveURL(/notice=document-published/);

      await clientPage.goto("/portal/documents");
      await expect(
        clientPage.getByRole("heading", {
          name: "סיכום שיחת היכרות והצעה לאפיון ותכנון",
        })
      ).toBeVisible();
      await clientPage.getByRole("link", { name: "צפייה במסמך" }).click();
      await expect(
        clientPage.getByText(
          "תוכן בדיקת E2E מפורט לשדה 1, עם החלטות, הנחות ותוצאה עסקית ברורה.",
          { exact: true }
        )
      ).toBeVisible();
      expect(
        (await new AxeBuilder({ page: clientPage }).analyze()).violations
      ).toEqual([]);

      const pdfHref = await clientPage
        .getByRole("link", { name: "הורדת PDF" })
        .getAttribute("href");
      expect(pdfHref).toBeTruthy();
      const pdfResponse = await clientContext.request.get(pdfHref ?? "");
      expect(pdfResponse.status()).toBe(200);
      expect(pdfResponse.headers()["content-type"]).toContain(
        "application/pdf"
      );
      expect((await pdfResponse.body()).subarray(0, 4).toString()).toBe("%PDF");

      await ownerPage.goto(
        `/admin/projects/${portalE2EProjects.clientA}`
      );
      const paymentForm = ownerPage
        .locator('input[name="amountIls"]')
        .locator("xpath=ancestor::form");
      await paymentForm.locator('input[name="amountIls"]').fill("1250");
      await paymentForm
        .locator('input[name="paymentUrl"]')
        .fill("https://payments.example.test/e2e");
      await paymentForm.getByRole("button").click();
      await expect(ownerPage).toHaveURL(/notice=payment-created/);

      await clientPage.goto(
        `/portal/projects/${portalE2EProjects.clientA}`
      );
      await expect(
        clientPage.locator('a[href="https://payments.example.test/e2e"]')
      ).toBeVisible();

      await ownerPage.goto(
        `/admin/projects/${portalE2EProjects.clientA}`
      );
      const paymentReceivedForm = ownerPage
        .locator('input[name="paymentRequestId"]')
        .locator("xpath=ancestor::form");
      await paymentReceivedForm.getByRole("button").click();
      await expect(ownerPage).toHaveURL(/notice=payment-received/);

      await clientPage.goto(
        `/portal/projects/${portalE2EProjects.clientA}`
      );
      await expect(
        clientPage.locator('a[href="https://payments.example.test/e2e"]')
      ).toHaveCount(0);

      await clientPage.goto("/admin");
      await expect(clientPage).toHaveURL(/\/portal$/);
    } finally {
      await Promise.all([ownerContext.close(), clientContext.close()]);
    }
  });
});
