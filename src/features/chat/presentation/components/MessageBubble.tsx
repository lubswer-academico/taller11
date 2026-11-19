import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Message } from '../../domain/entities/Message';
import { chatTheme } from '../theme/chatTheme';
import { MarkdownText } from './MarkdownText';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface Props {
    message: Message;
    isVoiceMode?: boolean;
    isPaused?: boolean;
    onTogglePlayPause?: () => void;
    onSkipToText?: () => void;
    onReplay?: (message: Message) => void;
}

export const MessageBubble: React.FC<Props> = ({
    message,
    isVoiceMode = false,
    isPaused = false,
    onTogglePlayPause,
    onSkipToText,
    onReplay,
}) => {
    const isUser = message.role === 'user';
    const showVoicePlayer = !isUser && isVoiceMode;

    return (
        <View style={[styles.row, isUser ? styles.userRow : styles.aiRow]}>
            {!isUser && (
                <View style={styles.aiAvatar} accessible={false}>
                    <Ionicons
                        name="sparkles"
                        size={14}
                        color={chatTheme.colors.primary}
                    />
                </View>
            )}

            <View
                style={[
                    styles.container,
                    isUser ? styles.userContainer : styles.aiContainer,
                ]}
            >
                <View
                    style={[
                        styles.bubble,
                        isUser ? styles.userBubble : styles.aiBubble,
                    ]}
                >
                    {isUser ? (
                        <Text style={[styles.text, styles.userText]} selectable>
                            {message.content}
                        </Text>
                    ) : showVoicePlayer ? (
                        <VoiceMessagePlayer
                            isPaused={isPaused}
                            onTogglePlayPause={onTogglePlayPause ?? (() => {})}
                            onSkipToText={onSkipToText ?? (() => {})}
                        />
                    ) : (
                        <MarkdownText content={message.content} />
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.timestamp}>
                        {message.timestamp.toLocaleTimeString('es-EC', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>

                    {!isUser && !showVoicePlayer && onReplay && (
                        <TouchableOpacity
                            style={styles.replayButton}
                            onPress={() => onReplay(message)}
                            hitSlop={6}
                            activeOpacity={0.75}
                            accessibilityRole="button"
                            accessibilityLabel="Escuchar respuesta de nuevo"
                        >
                            <Ionicons
                                name="volume-medium-outline"
                                size={14}
                                color={chatTheme.colors.primary}
                                accessible={false}
                            />
                            <Text style={styles.replayText}>Escuchar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 6,
        paddingHorizontal: 12,
        gap: 8,
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    aiRow: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: chatTheme.colors.primarySoft,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    container: {
        maxWidth: '84%',
        flexShrink: 1,
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    aiContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        borderRadius: chatTheme.radius.lg,
        paddingHorizontal: 15,
        paddingVertical: 11,
        maxWidth: '100%',
    },
    userBubble: {
        backgroundColor: chatTheme.colors.primary,
        borderBottomRightRadius: 6,
    },
    aiBubble: {
        backgroundColor: chatTheme.colors.surface,
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: chatTheme.colors.borderSubtle,
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    text: {
        fontSize: 15,
        lineHeight: 22.5,
    },
    userText: {
        color: chatTheme.colors.textInverse,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    timestamp: {
        fontSize: 11.5,
        color: chatTheme.colors.textSecondary,
    },
    replayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minHeight: 28,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: chatTheme.radius.full,
        backgroundColor: chatTheme.colors.surface,
        borderWidth: 1,
        borderColor: chatTheme.colors.borderSubtle,
    },
    replayText: {
        fontSize: 12,
        color: chatTheme.colors.primary,
        fontWeight: '600',
    },
});
