import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminNav } from "../AdminNav";

const navigation = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

describe("AdminNav project category", () => {
  beforeEach(() => {
    navigation.pathname = "/admin";
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
        media: "(min-width: 64rem)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.open = true;
        },
      },
      close: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.open = false;
          this.dispatchEvent(new Event("close"));
        },
      },
    });
  });

  it("opens the categorized mobile drawer and closes it from its close control", async () => {
    navigation.pathname = "/admin/projects/project-1";
    render(
      <AdminNav
        unreadCount={2}
        projects={[{ id: "project-1", name: "Lumin", stage: "delivery" }]}
      />
    );

    expect(screen.getByText("פרויקט · Lumin")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "תפריט" }));

    const drawer = await screen.findByRole("dialog", { name: "מעבר בין אזורים" });
    expect(within(drawer).getByRole("link", { name: "סקירה" })).toBeInTheDocument();
    expect(
      within(drawer).getByRole("link", { name: "Lumin, פיתוח וביצוע" })
    ).toHaveAttribute("aria-current", "page");

    fireEvent.click(within(drawer).getByRole("button", { name: "סגירת התפריט" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "מעבר בין אזורים" })).not.toBeInTheDocument()
    );
  });

  it("shows active projects with their current status", () => {
    navigation.pathname = "/admin/projects/project-1";
    render(
      <AdminNav
        unreadCount={0}
        projects={[
          { id: "project-1", name: "DEMO", stage: "delivery" },
          { id: "project-2", name: "Lumin", stage: "full_discovery_and_planning" },
        ]}
      />
    );

    const currentProject = screen.getByRole("link", {
      name: "DEMO, פיתוח וביצוע",
    });
    expect(currentProject).toHaveAttribute("href", "/admin/projects/project-1");
    expect(currentProject).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Lumin, אפיון ותכנון מלא" })
    ).toBeInTheDocument();
  });

  it("renders projects as a category label rather than a navigation button", () => {
    navigation.pathname = "/admin/projects";
    render(<AdminNav unreadCount={0} projects={[]} />);

    const navigationRegion = screen.getByRole("navigation", {
      name: "ניווט סביבת הניהול",
    });
    expect(within(navigationRegion).getByText("פרויקטים")).toHaveClass(
      "admin-nav-group-label"
    );
    expect(screen.queryByRole("link", { name: "פרויקטים" })).not.toBeInTheDocument();
    expect(screen.getByText("אין פרויקטים פעילים")).toBeInTheDocument();
  });

  it("places the project status beneath the project name", () => {
    render(
      <AdminNav
        unreadCount={0}
        projects={[{ id: "project-1", name: "Lumin", stage: "full_discovery_and_planning" }]}
      />
    );

    const projectLink = screen.getByRole("link", { name: "Lumin, אפיון ותכנון מלא" });
    const copy = projectLink.querySelector(".admin-nav-project-copy");

    expect(copy).not.toBeNull();
    expect(copy?.querySelector("strong")).toHaveTextContent("Lumin");
    expect(copy?.querySelector("small")).toHaveTextContent("אפיון ותכנון מלא");
  });
});
