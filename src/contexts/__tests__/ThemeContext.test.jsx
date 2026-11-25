import { act, render, screen } from "@testing-library/react";

import { ThemeProvider, useTheme } from "../ThemeContext";

const KEY = "openprime-theme-v2";

function Toggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      {isDark ? "Dark" : "Light"}
    </button>
  );
}

describe("ThemeProvider", () => {
  const stubMatchMedia = window.matchMedia;
  // The OS setting, as prefers-color-scheme reports it.
  const prefersDark = (dark) => {
    window.matchMedia = (query) => ({
      ...stubMatchMedia(query),
      matches: query === "(prefers-color-scheme: dark)" ? dark : false,
    });
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    window.matchMedia = stubMatchMedia;
    document.documentElement.classList.remove("dark");
  });

  it.each([
    [true, "Dark"],
    [false, "Light"],
  ])(
    "follows the OS setting (dark: %s) when nothing is stored",
    (dark, label) => {
      prefersDark(dark);
      render(
        <ThemeProvider>
          <Toggle />
        </ThemeProvider>,
      );

      expect(screen.getByRole("button")).toHaveTextContent(label);
      expect(document.documentElement.classList.contains("dark")).toBe(dark);
      // The OS default is not a choice: it keeps following the OS.
      expect(localStorage.getItem(KEY)).toBeNull();
    },
  );

  it("keeps a stored choice over the OS setting and stores a toggle", () => {
    prefersDark(true);
    localStorage.setItem(KEY, "false");
    render(
      <ThemeProvider>
        <Toggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Light");

    act(() => screen.getByRole("button").click());

    expect(screen.getByRole("button")).toHaveTextContent("Dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("true");
  });
});
