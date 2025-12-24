// useNuxtUITheme.ts
// Composable for dynamic Nuxt UI theme customization

export const useNuxtUITheme = () => {
  const appConfig = useAppConfig()

  /**
   * Set semantic color mapping
   */
  const setSemanticColor = (semantic: string, tailwindColor: string) => {
    if (appConfig.ui?.theme?.colors) {
      appConfig.ui.theme.colors[semantic] = tailwindColor
    }
  }

  /**
   * Get current semantic color
   */
  const getSemanticColor = (semantic: string): string => {
    return appConfig.ui?.theme?.colors?.[semantic] || 'gray'
  }

  /**
   * Set default variant for a component
   */
  const setComponentDefault = (component: string, prop: string, value: any) => {
    if (!appConfig.ui?.theme?.defaultVariants) {
      return
    }

    if (!appConfig.ui.theme.defaultVariants[component]) {
      appConfig.ui.theme.defaultVariants[component] = {}
    }

    appConfig.ui.theme.defaultVariants[component][prop] = value
  }

  /**
   * Get component default variant
   */
  const getComponentDefault = (component: string, prop: string): any => {
    return appConfig.ui?.theme?.defaultVariants?.[component]?.[prop]
  }

  /**
   * Reset theme to defaults
   */
  const resetTheme = () => {
    if (appConfig.ui?.theme?.colors) {
      appConfig.ui.theme.colors = {
        primary: 'blue',
        secondary: 'gray',
        success: 'green',
        info: 'blue',
        warning: 'yellow',
        error: 'red',
        neutral: 'gray'
      }
    }
  }

  /**
   * Apply a preset theme
   */
  const applyThemePreset = (preset: 'default' | 'vibrant' | 'muted') => {
    const presets = {
      default: {
        primary: 'blue',
        secondary: 'gray',
        success: 'green',
        info: 'blue',
        warning: 'yellow',
        error: 'red',
        neutral: 'gray'
      },
      vibrant: {
        primary: 'violet',
        secondary: 'slate',
        success: 'emerald',
        info: 'cyan',
        warning: 'amber',
        error: 'rose',
        neutral: 'zinc'
      },
      muted: {
        primary: 'slate',
        secondary: 'gray',
        success: 'teal',
        info: 'sky',
        warning: 'orange',
        error: 'pink',
        neutral: 'stone'
      }
    }

    if (appConfig.ui?.theme?.colors) {
      Object.assign(appConfig.ui.theme.colors, presets[preset])
    }
  }

  return {
    setSemanticColor,
    getSemanticColor,
    setComponentDefault,
    getComponentDefault,
    resetTheme,
    applyThemePreset
  }
}
