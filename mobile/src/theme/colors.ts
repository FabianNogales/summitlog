// Color system for SummitLog - Mountain & Hiking App
// Alpine Night Theme: volcanic black + glacier blue + campfire amber

export const colors = {
  // Backgrounds
  bgMain: '#060708',          // negro roca profundo
  bgSecondary: '#0D1012',     // fondo secundario tipo carbón
  bgCard: '#151A1D',          // cards, filtros, navbar
  bgElevated: '#1D2428',      // modales, paneles elevados

  // Borders
  borderSoft: '#293136',
  borderStrong: '#3F4A50',

  // Text
  textPrimary: '#F5F3EA',     // blanco cálido tipo nieve
  textSecondary: '#C3C8C4',   // gris claro legible
  textMuted: '#828B88',       // placeholders / texto apagado

  // Brand - Campfire Amber
  primary: '#F2A65A',         // botón principal / activo
  primaryHover: '#FFB86B',
  primaryDark: '#B87534',
  primaryGradient: 'linear-gradient(135deg, #F2A65A 0%, #E8893A 100%)',

  // Accent - Glacier Blue (mapas, ubicaciones, info)
  accent: '#7FA7B5',
  accentHover: '#93BDCB',
  accentDark: '#5D8A9A',

  // States
  success: '#7FA66A',         // verde natural, solo para éxito
  warning: '#D9A441',
  danger: '#D95F4C',

  // UI Elements
  inputBg: '#0B0E12',
  chipBg: '#181E21',
  chipActiveBg: '#F2A65A',
  chipActiveText: '#060708',
  
  // Navigation
  navInactive: '#828B88',
  navActive: '#F2A65A',
  
  // Map / Pins
  mapPinBg: 'rgba(21, 26, 29, 0.85)',
  mapPinBorder: '#7FA7B5',
  
  // Buttons
  buttonSecondaryBg: 'transparent',
  buttonSecondaryBorder: '#7FA7B5',
  buttonSecondaryText: '#7FA7B5',

  // Overlays
  overlay: 'rgba(6, 7, 8, 0.84)',
  overlayLight: 'rgba(6, 7, 8, 0.58)',

  // Transparency variants
  borderTransparent: 'rgba(242, 166, 90, 0.22)',
  bgElevatedTransparent: 'rgba(242, 166, 90, 0.08)',
  textSecondaryLight: 'rgba(245, 243, 234, 0.82)',

  // Legacy aliases for backwards compatibility
  background: '#060708',
  card: '#151A1D',
  cardSecondary: '#1D2428',
  primaryPressed: '#B87534',
  text: '#F5F3EA',
  placeholder: '#828B88',
  border: '#293136',
};