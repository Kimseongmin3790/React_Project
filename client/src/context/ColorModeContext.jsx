// client/src/context/ColorModeContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ColorModeContext = createContext();

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          background: {
            default: "#f5f5f5",
            paper: "#ffffff",
          },
          // 사이드바용 회색
          customSide: "#b0b0b0",
        }
      : {
          background: {
            default: "#121212",
            paper: "#1e1e1e",
          },
          customSide: "#202020",
        }),
  },
});

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem("colorMode") || "light"
  );

  useEffect(() => {
    localStorage.setItem("colorMode", mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
