import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBubble } from '../components/MessageBubble';
import { useChat } from '../hooks/useChat';
import { useVoicePlayback } from '../hooks/useVoicePlayback';
import { chatTheme } from '../theme/chatTheme';

interface SuggestionItem {
    id: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    prompt: string;
}

const SUGGESTIONS: SuggestionItem[] = [
    {
        id: 'explain',
        icon: 'bulb-outline',
        label: 'Explicar un concepto',
        prompt: 'Explícame Clean Architecture en términos sencillos con un ejemplo.',
    },
    {
        id: 'code',
        icon: 'code-slash-outline',
        label: 'Ayuda con código',
        prompt: 'Dame un ejemplo práctico de un custom hook en React Native con TypeScript.',
    },
    {
        id: 'summary',
        icon: 'book-outline',
        label: 'Consejos de estudio',
        prompt: 'Dame 5 consejos clave para estructurar una app móvil profesional.',
    },
];

export const ChatScreen: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const { messages, isLoading, error, sendMessage, clearChat } = useChat();
    const {
        activeMessageId,
        status,
        playMessage,
        togglePlayPause,
        skipToText,
        stopAll,
    } = useVoicePlayback();

    const canSend = Boolean(inputText.trim()) && !isLoading;

    const handleSend = async () => {
        if (!canSend) return;
        const text = inputText;
        setInputText('');
        await stopAll();
        const assistantMessage = await sendMessage(text);
        if (assistantMessage) {
            playMessage(assistantMessage);
        }
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const handleClearChat = async () => {
        await stopAll();
        clearChat();
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.header}>
                <View style={styles.headerBrand}>
                    <View style={styles.brandBadge} accessible={false}>
                        <Ionicons
                            name="sparkles"
                            size={18}
                            color={chatTheme.colors.textInverse}
                        />
                    </View>
                    <View>
                        <Text style={styles.headerTitle} accessibilityRole="header">
                            Chat con la IA
                        </Text>
                        <View style={styles.headerStatusRow}>
                            <Ionicons
                                name="mic-outline"
                                size={12}
                                color={chatTheme.colors.online}
                                accessible={false}
                            />
                            <Text style={styles.headerSubtitle}>
                                Asistente con respuesta por voz
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleClearChat}
                    disabled={messages.length === 0 && !error}
                    style={[
                        styles.clearBtn,
                        messages.length === 0 && !error && styles.clearBtnDisabled,
                    ]}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Limpiar conversación"
                >
                    <Ionicons
                        name="trash-outline"
                        size={17}
                        color={
                            messages.length === 0 && !error
                                ? chatTheme.colors.textSecondary
                                : chatTheme.colors.danger
                        }
                        accessible={false}
                    />
                    <Text
                        style={[
                            styles.clearText,
                            messages.length === 0 && !error && styles.clearTextDisabled,
                        ]}
                    >
                        Limpiar
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.chatArea}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <MessageBubble
                            message={item}
                            isVoiceMode={activeMessageId === item.id}
                            isPaused={activeMessageId === item.id && status === 'paused'}
                            onTogglePlayPause={togglePlayPause}
                            onSkipToText={skipToText}
                            onReplay={playMessage}
                        />
                    )}
                    contentContainerStyle={[
                        styles.messagesList,
                        messages.length === 0 && styles.emptyListContainer,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconCircle} accessible={false}>
                                <Ionicons
                                    name="chatbubbles-outline"
                                    size={32}
                                    color={chatTheme.colors.primary}
                                />
                            </View>
                            <Text style={styles.emptyTitle}>
                                ¿En qué puedo ayudarte hoy?
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                Escribe tu consulta. Escucharás la respuesta en voz alta o podrás pasar directo al texto.
                            </Text>
                            <View style={styles.suggestionsList}>
                                {SUGGESTIONS.map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.suggestionChip}
                                        onPress={() => setInputText(item.prompt)}
                                        activeOpacity={0.8}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Usar sugerencia: ${item.label}`}
                                    >
                                        <Ionicons
                                            name={item.icon}
                                            size={18}
                                            color={chatTheme.colors.primary}
                                            accessible={false}
                                        />
                                        <Text style={styles.suggestionText}>
                                            {item.label}
                                        </Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color={chatTheme.colors.textSecondary}
                                            accessible={false}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    }
                />

                {isLoading && (
                    <View style={styles.loadingRow}>
                        <View style={styles.loadingPill}>
                            <ActivityIndicator size="small" color={chatTheme.colors.primary} />
                            <Text style={styles.loadingText}>
                                Gemini está escribiendo...
                            </Text>
                        </View>
                    </View>
                )}

                {error && (
                    <View
                        style={styles.errorContainer}
                        accessibilityRole="alert"
                        accessibilityLiveRegion="assertive"
                    >
                        <Ionicons
                            name="alert-circle-outline"
                            size={20}
                            color={chatTheme.colors.danger}
                            accessible={false}
                        />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.inputDock}>
                    <View
                        style={[
                            styles.inputWrapper,
                            isInputFocused && styles.inputWrapperFocused,
                        ]}
                    >
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            placeholder="Escribe un mensaje..."
                            placeholderTextColor={chatTheme.colors.textSecondary}
                            accessibilityLabel="Escribe tu mensaje para Gemini"
                            multiline
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                !canSend && styles.sendButtonDisabled,
                            ]}
                            onPress={handleSend}
                            disabled={!canSend}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Enviar mensaje"
                        >
                            <Ionicons
                                name="arrow-up"
                                size={20}
                                color={
                                    canSend
                                        ? chatTheme.colors.textInverse
                                        : chatTheme.colors.primaryDisabledIcon
                                }
                                accessible={false}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: chatTheme.colors.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: chatTheme.spacing.lg,
        paddingVertical: 10,
        backgroundColor: chatTheme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: chatTheme.colors.borderSubtle,
    },
    headerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 1,
    },
    brandBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: chatTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '700',
        color: chatTheme.colors.textPrimary,
    },
    headerStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 1,
    },
    headerSubtitle: {
        fontSize: 12,
        lineHeight: 16,
        color: chatTheme.colors.textSecondary,
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: chatTheme.radius.full,
        backgroundColor: chatTheme.colors.surfaceError,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    clearBtnDisabled: {
        backgroundColor: chatTheme.colors.surfaceSubtle,
        borderColor: chatTheme.colors.borderSubtle,
        opacity: 0.65,
    },
    clearText: {
        color: chatTheme.colors.danger,
        fontSize: 13.5,
        fontWeight: '600',
    },
    clearTextDisabled: {
        color: chatTheme.colors.textSecondary,
    },
    chatArea: {
        flex: 1,
        backgroundColor: chatTheme.colors.canvas,
    },
    messagesList: {
        paddingVertical: 12,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    emptyIconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: chatTheme.colors.primarySoft,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        lineHeight: 27,
        fontWeight: '700',
        color: chatTheme.colors.textPrimary,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14.5,
        lineHeight: 21,
        color: chatTheme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 22,
        maxWidth: 320,
    },
    suggestionsList: {
        width: '100%',
        maxWidth: 360,
        gap: 10,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 48,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: chatTheme.radius.md,
        backgroundColor: chatTheme.colors.surface,
        borderWidth: 1,
        borderColor: chatTheme.colors.borderSubtle,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14.5,
        lineHeight: 20,
        fontWeight: '500',
        color: chatTheme.colors.textPrimary,
    },
    loadingRow: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        alignItems: 'flex-start',
    },
    loadingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: chatTheme.radius.full,
        backgroundColor: chatTheme.colors.surface,
        borderWidth: 1,
        borderColor: chatTheme.colors.borderSubtle,
    },
    loadingText: {
        color: chatTheme.colors.textSecondary,
        fontSize: 13.5,
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: chatTheme.colors.surfaceError,
        borderRadius: chatTheme.radius.md,
        borderWidth: 1,
        borderColor: chatTheme.colors.borderError,
    },
    errorText: {
        flex: 1,
        color: chatTheme.colors.textError,
        fontSize: 13.5,
        lineHeight: 19,
        fontWeight: '500',
    },
    inputDock: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: chatTheme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: chatTheme.colors.borderSubtle,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        backgroundColor: chatTheme.colors.surfaceSubtle,
        borderWidth: 1.5,
        borderColor: chatTheme.colors.borderInput,
        borderRadius: 26,
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 5,
    },
    inputWrapperFocused: {
        borderColor: chatTheme.colors.borderFocus,
        backgroundColor: chatTheme.colors.surface,
    },
    input: {
        flex: 1,
        minHeight: 38,
        maxHeight: 120,
        paddingVertical: 8,
        fontSize: 15.5,
        lineHeight: 22,
        color: chatTheme.colors.textPrimary,
    },
    sendButton: {
        minWidth: 44,
        minHeight: 44,
        borderRadius: 22,
        backgroundColor: chatTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: chatTheme.colors.primaryDisabled,
    },
});
