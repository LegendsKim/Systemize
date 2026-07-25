import React from "react";

type StatusVariant = "success" | "error" | "warning" | "info";

interface StatusMessageProps {
  variant: StatusVariant;
  children: React.ReactNode;
  /** Optional ID for aria-describedby association. */
  id?: string;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-success/10 text-success border-success/30",
  error: "bg-error/10 text-error border-error/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  info: "bg-info/10 text-info border-info/30",
};

const variantRoles: Record<StatusVariant, "status" | "alert"> = {
  success: "status",
  error: "alert",
  warning: "alert",
  info: "status",
};

/**
 * Accessible status message component.
 *
 * Uses appropriate ARIA roles: alert for errors/warnings, status for success/info.
 * Automatically announced by screen readers via live region semantics.
 */
export function StatusMessage({
  variant,
  children,
  id,
  className = "",
}: StatusMessageProps) {
  return (
    <div
      id={id}
      role={variantRoles[variant]}
      aria-live={variantRoles[variant] === "alert" ? "assertive" : "polite"}
      className={[
        "rounded-md border px-4 py-3 text-sm",
        variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
