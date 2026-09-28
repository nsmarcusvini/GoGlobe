export const THEME_STORAGE_KEY = "goglobe-theme";

export type ThemePreference = "light" | "dark" | "system";

// Runs inline in <head>. Resolves the stored preference (or the OS setting) into
// data-theme="light|dark". Storage can throw (private mode): fall back to the OS.
export const themeInitScript = `(function(){try{var p=null;try{p=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.dataset.themePref=p||"system"}catch(e){}})();`;
