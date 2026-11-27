import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // The stored choice, else the OS setting at load; only a toggle is stored,
  // so until then each load starts from the OS (no live change listener).
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("openprime-theme-v2");
    return saved
      ? JSON.parse(saved)
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    localStorage.setItem("openprime-theme-v2", JSON.stringify(!isDark));
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
