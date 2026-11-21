import { useMemo, useState } from "react";
import { searchCountries, type Country } from "@/features/countries/data";
import { useTheme } from "@/hooks/useTheme";
import "./MapSearchBar.web.css";

interface MapSearchBarProps {
  onSelect: (country: Country) => void;
}

export function MapSearchBar({ onSelect }: MapSearchBarProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(
    () => (query.trim() ? searchCountries(query).slice(0, 8) : []),
    [query],
  );

  const select = (country: Country) => {
    onSelect(country);
    setQuery("");
    setFocused(false);
  };

  return (
    <div
      className="odyssey-map-search"
      style={{
        backgroundColor: colors.paperRaised,
        borderColor: colors.line,
        color: colors.ink,
      }}
    >
      <span aria-hidden="true" className="odyssey-map-search-icon">
        &#8981;
      </span>
      <input
        aria-label="Search countries"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 100)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setQuery("");
          if (event.key === "Enter" && results[0]) select(results[0]);
        }}
        placeholder="Search countries"
        style={{ color: colors.ink }}
      />
      {query && (
        <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
          &times;
        </button>
      )}
      {focused && results.length > 0 && (
        <div
          className="odyssey-map-search-results"
          style={{ backgroundColor: colors.paperRaised, borderColor: colors.line }}
        >
          {results.map((country) => (
            <button
              type="button"
              key={country.iso}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(country)}
              style={{ borderColor: colors.line, color: colors.ink }}
            >
              <span>{country.flag}</span>
              <strong>{country.name}</strong>
              <small style={{ color: colors.inkSoft }}>{country.continent}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
