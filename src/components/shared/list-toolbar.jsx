import { Search, X } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

/** Filter tabs of a list: 28 px pills with `aria-pressed` and an optional count; controlled. */
export function FilterTabs({ label, value, onChange, options }) {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="filter-tabs"
      className="flex flex-wrap gap-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium outline-none max-md:min-h-11",
              "transition-[color,background-color,box-shadow] duration-(--dur-fast) focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-secondary text-foreground ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <>
                {" "}
                <span className="text-muted-foreground tabular-nums">
                  {o.count}
                </span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Search field with a leading icon and a "Clear search" button while it has a value. */
export function SearchField({ value, onChange, label, className }) {
  return (
    <InputGroup data-slot="search-field" className={cn("sm:w-72", className)}>
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => onChange("")}
          >
            <X aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

const results = (n, [one, other]) =>
  n === 0 ? `No ${other}` : n === 1 ? `1 ${one}` : `${n} ${other}`;

/**
 * List page toolbar: filter tabs left; filters, search and sort right; controlled (the page
 * decides where the state lives, e.g. the environments status in `?status=`).
 * `origins` are the FilterTabs options (`{ value, label, count? }`); `resultNoun`
 * names what `resultCount` counts (`[one, other]`, default results).
 */
export function ListToolbar({
  search,
  onSearchChange,
  searchLabel,
  origins,
  origin = "all",
  onOriginChange,
  filters,
  sort,
  resultCount,
  resultNoun = ["result", "results"],
}) {
  return (
    <div
      data-slot="list-toolbar"
      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {origins && onOriginChange ? (
          <FilterTabs
            label="Show"
            value={origin}
            onChange={onOriginChange}
            options={origins}
          />
        ) : null}
        {resultCount !== undefined ? (
          <p
            aria-live="polite"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {results(resultCount, resultNoun)}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {filters}
        <SearchField
          value={search}
          onChange={onSearchChange}
          label={searchLabel ?? "Search"}
        />
        {sort}
      </div>
    </div>
  );
}
