import { Platform } from 'react-native';

export const chatTheme = {
    colors: {
        // Superficies
        canvas: '#F1F5F9',
        surface: '#FFFFFF',
        surfaceSubtle: '#F8FAFC',
        surfaceAccent: '#EFF6FF',
        surfaceError: '#FEF2F2',
        surfaceCode: '#0F172A',
        surfaceCodeHeader: '#1E293B',
        surfaceInlineCode: '#E2E8F0',

        // Marca / Acciones (contraste >= 4.5:1 con texto blanco)
        primary: '#1D4ED8',
        primarySoft: '#DBEAFE',
        primaryDisabled: '#CBD5E1',
        primaryDisabledIcon: '#475569',

        // Texto (contraste >= 4.5:1 sobre fondos claros)
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textInverse: '#FFFFFF',
        textCode: '#F8FAFC',
        textCodeMuted: '#CBD5E1',
        textError: '#991B1B',

        // Bordes y divisores (contraste no textual >= 3:1 en controles interactivos)
        borderSubtle: '#CBD5E1',
        borderInput: '#94A3B8',
        borderFocus: '#1D4ED8',
        borderError: '#DC2626',

        // Estados semánticos
        danger: '#B91C1C',
        dangerSoft: '#FEE2E2',
        online: '#15803D',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
    },
    radius: {
        sm: 8,
        md: 14,
        lg: 20,
        full: 999,
    },
    typography: {
        monoFont: Platform.select({
            ios: 'Menlo',
            android: 'monospace',
            default: 'monospace',
        }),
    },
} as const;
