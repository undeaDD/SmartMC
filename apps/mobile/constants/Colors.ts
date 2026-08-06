// Brand tokens, matching apps/landing/src/styles/theme.css so the app and
// web site feel related without being a literal reskin (the landing site is
// dark-only; the app keeps respecting the system's light/dark setting).
const tintColorLight = '#39bf45'; // brand-green
const tintColorDark = '#5ccf68'; // green-400 -- better contrast than the base green on a near-black background

export default {
  light: {
    text: '#181818', // brand-ink
    background: '#ffffff',
    tint: tintColorLight,
    tabIconDefault: '#8c8c8c', // brand-gray
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ffffff',
    background: '#121212', // ink-950
    tint: tintColorDark,
    tabIconDefault: '#8c8c8c', // brand-gray
    tabIconSelected: tintColorDark,
  },
};
