export function applyThemeTokens(settings: Record<string, any>): void {
  const root = document.documentElement;

  // Apply theme colors
  if (settings['theme.primaryColor']) {
    root.style.setProperty('--color-primary', settings['theme.primaryColor']);
  }
  if (settings['theme.secondaryColor']) {
    root.style.setProperty('--color-secondary', settings['theme.secondaryColor']);
  }
  if (settings['theme.backgroundColor']) {
    root.style.setProperty('--color-background', settings['theme.backgroundColor']);
  }
  if (settings['theme.textColor']) {
    root.style.setProperty('--color-text', settings['theme.textColor']);
  }
  if (settings['theme.accentColor']) {
    root.style.setProperty('--color-accent', settings['theme.accentColor']);
  }
}

