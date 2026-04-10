"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildBrowseUrl(
  locale: string,
  params: {
    manufacturer?: string;
    carBrand?: string;
    scale?: string;
    page: number;
  }
) {
  const searchParams = new URLSearchParams();

  if (params.manufacturer) searchParams.set("manufacturer", params.manufacturer);
  if (params.carBrand) searchParams.set("carBrand", params.carBrand);
  if (params.scale) searchParams.set("scale", params.scale);
  searchParams.set("page", String(params.page));

  return `/${locale}/browse?${searchParams.toString()}`;
}

export default function BrowsePageJumpControl({
  locale,
  currentPage,
  totalPages,
  manufacturer,
  carBrand,
  scale,
}: {
  locale: string;
  currentPage: number;
  totalPages: number;
  manufacturer?: string;
  carBrand?: string;
  scale?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentPage));

  const safeTotalPages = useMemo(() => Math.max(1, totalPages), [totalPages]);

  function goToPage(rawValue: string) {
    const parsed = Number.parseInt(rawValue, 10);

    if (Number.isNaN(parsed)) {
      setValue(String(currentPage));
      return;
    }

    const nextPage = clamp(parsed, 1, safeTotalPages);
    setValue(String(nextPage));

    router.push(
      buildBrowseUrl(locale, {
        manufacturer,
        carBrand,
        scale,
        page: nextPage,
      })
    );
  }

  return (
    <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <label className="grid gap-2">
        <span className="text-sm text-white/70">Jump to page</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/[^\d]/g, "");
            setValue(digitsOnly);
          }}
          onBlur={() => {
            if (!value) {
              setValue(String(currentPage));
              return;
            }

            const parsed = Number.parseInt(value, 10);
            if (Number.isNaN(parsed)) {
              setValue(String(currentPage));
              return;
            }

            setValue(String(clamp(parsed, 1, safeTotalPages)));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const parsed = Number.parseInt(value || String(currentPage), 10);
              const nextValue = clamp(Number.isNaN(parsed) ? currentPage + 1 : parsed + 1, 1, safeTotalPages);
              setValue(String(nextValue));
              return;
            }

            if (e.key === "ArrowDown") {
              e.preventDefault();
              const parsed = Number.parseInt(value || String(currentPage), 10);
              const nextValue = clamp(Number.isNaN(parsed) ? currentPage - 1 : parsed - 1, 1, safeTotalPages);
              setValue(String(nextValue));
              return;
            }

            if (e.key === "Enter") {
              e.preventDefault();
              goToPage(value);
            }
          }}
          className="field"
          placeholder="Enter page number"
        />
      </label>

      <button
        type="button"
        onClick={() => goToPage(value)}
        className="badge-chip justify-center text-center"
      >
        Go to page
      </button>
    </div>
  );
}