export const theme = {
  colors: {
    night: '#0B1026',
    nightTop: '#131A3A',
    nightDeep: '#070A18',
    surface: '#161E3D',
    surfaceVariant: '#1F2A52',
    lavender: '#B9A8FF',
    moon: '#FFE9A8',
    softBlue: '#7FB2FF',
    textPrimary: '#EDF1FF',
    textSecondary: '#9AA6CC',
    danger: '#FF8FA3',
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    pill: 28,
  },
  spacing: (n: number) => n * 8,
} as const;

export type Theme = typeof theme;
