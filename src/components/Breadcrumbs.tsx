import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm mb-6 flex-wrap"
      style={{ color: "var(--text-muted)" }}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <span aria-hidden="true" className="select-none">
              /
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="transition-colors duration-150 hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--text-primary)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
