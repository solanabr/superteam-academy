"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeSlug?: string;
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  const pathname = usePathname();

  return (
    <section className="mb-8">
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <Link
          href={pathname}
          className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
            !activeSlug
              ? "bg-primary text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          All Courses
        </Link>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={`${pathname}?category=${category.slug}`}
            className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              activeSlug === category.slug
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}