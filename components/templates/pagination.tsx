"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <nav
      aria-label="Templates pagination"
      className="mt-12 flex items-center justify-center gap-2"
    >

      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-slate-700
          text-slate-300
          transition
          hover:border-slate-500
          hover:text-white
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`
            h-10
            w-10
            rounded-xl
            border
            text-sm
            font-medium
            transition
            ${
              page === currentPage
                ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
            }
          `}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-slate-700
          text-slate-300
          transition
          hover:border-slate-500
          hover:text-white
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronRight className="h-4 w-4" />
      </button>

    </nav>
  );
}
