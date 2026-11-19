import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { chatTheme } from '../theme/chatTheme';

interface VoiceMessagePlayerProps {
    isPaused: boolean;
    onTogglePlayPause: () => void;
    onSkipToText: () => void;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
    isPaused,
    onTogglePlayPause,
    onSkipToText,
}) => {
    const [reduceMotion, setReduceMotion] = useState(true);
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then(enabled => {
                if (mounted) setReduceMotion(enabled);
            })
            .catch(() => {
                if (mounted) setReduceMotion(false);
            });

        const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            enabled => setReduceMotion(enabled)
        );

        return () => {
            mounted = false;
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (isPaused || reduceMotion) {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(0);
            return;
        }

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 750,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 750,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        loop.start();
        return () => loop.stop();
    }, [isPaused, reduceMotion, pulseAnim]);

    const ringScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.24],
    });

    const ringOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.45, 0],
    });

    return (
        <View style={styles.container}>
            <View style={styles.micWrapper}>
                {!isPaused && !reduceMotion && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.micPulseRing,
                            {
                                opacity: ringOpacity,
                                transform: [{ scale: ringScale }],
                            },
                        ]}
                    />
                )}
                <View
                    style={[
                        styles.micBadge,
                        isPaused ? styles.micBadgePaused : styles.micBadgeActive,
                    ]}
                >
                    <Ionicons
                        name={isPaused ? 'mic-off-outline' : 'mic'}
                        size={20}
                        color={isPaused ? chatTheme.colors.textSecondary : chatTheme.colors.primary}
                        accessible={false}
                    />
                </View>
            </View>

            <View style={styles.statusContainer}>
                <Text style={styles.statusTitle}>
                    {isPaused ? 'Audio en pausa' : 'Escuchando respuesta'}
                </Text>
                <Text style={styles.statusSubtitle}>
                    {isPaused ? 'Toca reproducir o ver texto' : 'Toca la flecha para leer'}
                </Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.playPauseButton}
                    onPress={onTogglePlayPause}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={isPaused ? 'Reanudar audio' : 'Pausar audio'}
                >
                    <Ionicons
                        name={isPaused ? 'play' : 'pause'}
                        size={18}
                        color={chatTheme.colors.textInverse}
                        accessible={false}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={onSkipToText}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Saltar audio y mostrar texto"
                >
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={chatTheme.colors.textPrimary}
                        accessible={false}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minWidth: 245,
        paddingVertical: 2,
    },
    micWrapper: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micPulseRing: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: chatTheme.colors.primary,
    },
    micBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    micBadgeActive: {
        backgroundColor: chatTheme.colors.primarySoft,
        borderColor: '#93C5FD',
    },
    micBadgePaused: {
        backgroundColor: chatTheme.colors.surfaceSubtle,
        borderColor: chatTheme.colors.borderSubtle,
    },
    statusContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '600',
        color: chatTheme.colors.textPrimary,
    },
    statusSubtitle: {
        fontSize: 12,
        lineHeight: 16,
        color: chatTheme.colors.textSecondary,
        marginTop: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    playPauseButton: {
        minWidth: 44,
        minHeight: 44,
        borderRadius: 22,
        backgroundColor: chatTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButton: {
        minWidth: 44,
        minHeight: 44,
        borderRadius: 22,
        backgroundColor: chatTheme.colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: chatTheme.colors.borderInput,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
