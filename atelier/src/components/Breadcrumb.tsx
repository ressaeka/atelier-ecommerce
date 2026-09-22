import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 sm:mb-6"
    >
      <ol className="flex flex-wrap items-center gap-y-1 text-[9px] leading-none">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center"
            >
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="font-medium uppercase tracking-[0.14em] text-[#999] transition-colors hover:text-[#1A1A1A]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`font-medium uppercase tracking-[0.14em] ${
                    isLast
                      ? 'text-[#1A1A1A]'
                      : 'text-[#999]'
                  }`}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span
                  className="mx-2 text-[#CCC]"
                  aria-hidden="true"
                >
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;