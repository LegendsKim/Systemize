import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional HTML element to render as. Defaults to div. */
  as?: "div" | "section" | "article";
}

/**
 * Card container with consistent border, radius, and padding.
 */
export function Card({
  children,
  className = "",
  as: Component = "div",
}: CardProps) {
  return (
    <Component
      className={[
        "rounded-lg border border-border bg-surface-0 p-6 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Component>
  );
}
