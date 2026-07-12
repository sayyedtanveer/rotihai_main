import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-4 py-2 text-sm text-muted-foreground">
      {/* Desktop: show all items */}
      <ol className="hidden sm:flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-primary underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: show first, ellipsis, and last item */}
      <ol className="flex sm:hidden items-center gap-1">
        {items.length <= 2 ? (
          items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="text-foreground font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary underline"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })
        ) : (
          <>
            <li className="flex items-center gap-1">
              <Link
                href={items[0].href}
                className="text-muted-foreground hover:text-primary underline"
              >
                {items[0].label}
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">...</span>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-foreground font-medium" aria-current="page">
                {items[items.length - 1].label}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
