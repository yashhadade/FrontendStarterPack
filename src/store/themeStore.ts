import { create } from 'zustand';

interface ThemeState {
  primaryColor: string; // Stored as hex color (e.g., "#1e293b")
  setPrimaryColor: (color: string) => void;
  resetPrimaryColor: () => void;
}

// Default primary color (matching current CSS: 222 47% 18%)
const DEFAULT_PRIMARY_COLOR = '#1e293b';

// Load from localStorage on initialization
const loadStoredColor = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme-primary-color');
    return stored || DEFAULT_PRIMARY_COLOR;
  }
  return DEFAULT_PRIMARY_COLOR;
};

export const useThemeStore = create<ThemeState>((set) => ({
  primaryColor: loadStoredColor(),

  setPrimaryColor: (color: string) => {
    set({ primaryColor: color });
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-primary-color', color);
    }
    // Update CSS variables immediately
    updatePrimaryColorCSS(color);
  },

  resetPrimaryColor: () => {
    set({ primaryColor: DEFAULT_PRIMARY_COLOR });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-primary-color', DEFAULT_PRIMARY_COLOR);
    }
    updatePrimaryColorCSS(DEFAULT_PRIMARY_COLOR);
  },
}));

/**
 * Converts hex color to HSL format (H S% L%)
 * @param hex - Hex color string (e.g., "#1e293b" or "1e293b")
 * @returns HSL string (e.g., "222 47% 18%")
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Updates CSS variables for primary color throughout the app
 * @param hexColor - Hex color string
 */
export function updatePrimaryColorCSS(hexColor: string): void {
  const hsl = hexToHsl(hexColor);
  const root = document.documentElement;

  // Update primary color
  root.style.setProperty('--primary', hsl);

  // Update ring color (used for focus states)
  root.style.setProperty('--ring', hsl);

  // Parse HSL components
  const [hStr, sStr, lStr] = hsl.split(' ');
  const hNum = parseFloat(hStr);
  const sNum = parseFloat(sStr.replace('%', ''));
  const lightness = parseFloat(lStr.replace('%', ''));

  // Calculate and update primary foreground (white or black based on lightness)
  const primaryForeground = lightness > 50 ? '0 0% 0%' : '0 0% 100%';
  root.style.setProperty('--primary-foreground', primaryForeground);

  // Update navy colors to match primary (optional - you can remove this if you want navy separate)
  root.style.setProperty('--navy', hsl);

  // Sidebar background: slightly darker version of primary so selected tab stays visible
  const sidebarBgLightness = Math.max(5, Math.min(95, lightness - 10));
  const sidebarBackground = `${hNum} ${sNum}% ${sidebarBgLightness}%`;
  root.style.setProperty('--sidebar-background', sidebarBackground);

  // Sidebar foreground: contrast against sidebar background
  const sidebarForeground = sidebarBgLightness > 50 ? '0 0% 0%' : '0 0% 100%';
  root.style.setProperty('--sidebar-foreground', sidebarForeground);

  // Make sidebar highlight use the primary color as well
  root.style.setProperty('--sidebar-accent', hsl);
  root.style.setProperty('--sidebar-primary', hsl);
  root.style.setProperty('--sidebar-ring', hsl);
}

export default useThemeStore;
