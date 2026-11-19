import { Ionicons } from '@expo/vector-icons';
import { lexer, Token, Tokens } from 'marked';
import React, { useMemo } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    View,
} from 'react-native';
import { chatTheme } from '../theme/chatTheme';

interface MarkdownTextProps {
    content: string;
    color?: string;
}

const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:)/i;

const openSafeUrl = (href: string) => {
    if (!SAFE_URL_PATTERN.test(href)) return;
    Linking.openURL(href).catch(() => {
        // Ignorar silenciosamente si el dispositivo no puede abrir el enlace
    });
};

const renderInlineTokens = (
    tokens: Token[],
    keyPrefix: string,
    baseTextStyle: TextStyle
): React.ReactNode[] => {
    return tokens.map((token, index) => {
        const key = `${keyPrefix}-${index}`;

        switch (token.type) {
            case 'strong': {
                const strongToken = token as Tokens.Strong;
                return (
                    <Text key={key} style={styles.bold}>
                        {renderInlineTokens(strongToken.tokens, key, baseTextStyle)}
                    </Text>
                );
            }
            case 'em': {
                const emToken = token as Tokens.Em;
                return (
                    <Text key={key} style={styles.italic}>
                        {renderInlineTokens(emToken.tokens, key, baseTextStyle)}
                    </Text>
                );
            }
            case 'del': {
                const delToken = token as Tokens.Del;
                return (
                    <Text key={key} style={styles.strikethrough}>
                        {renderInlineTokens(delToken.tokens, key, baseTextStyle)}
                    </Text>
                );
            }
            case 'codespan': {
                const codeToken = token as Tokens.Codespan;
                return (
                    <Text key={key} style={styles.inlineCode}>
                        {codeToken.text}
                    </Text>
                );
            }
            case 'link': {
                const linkToken = token as Tokens.Link;
                return (
                    <Text
                        key={key}
                        style={styles.link}
                        accessibilityRole="link"
                        onPress={() => openSafeUrl(linkToken.href)}
                    >
                        {linkToken.tokens?.length
                            ? renderInlineTokens(linkToken.tokens, key, baseTextStyle)
                            : linkToken.text}
                    </Text>
                );
            }
            case 'br':
                return '\n';
            case 'checkbox':
                return null;
            case 'escape': {
                const escapeToken = token as Tokens.Escape;
                return (
                    <Text key={key} style={baseTextStyle}>
                        {escapeToken.text}
                    </Text>
                );
            }
            case 'image': {
                const imageToken = token as Tokens.Image;
                return (
                    <Text key={key} style={baseTextStyle}>
                        {imageToken.text || imageToken.href}
                    </Text>
                );
            }
            case 'text': {
                const textToken = token as Tokens.Text;
                if (textToken.tokens?.length) {
                    return (
                        <Text key={key} style={baseTextStyle}>
                            {renderInlineTokens(textToken.tokens, key, baseTextStyle)}
                        </Text>
                    );
                }
                return (
                    <Text key={key} style={baseTextStyle}>
                        {textToken.text}
                    </Text>
                );
            }
            case 'html': {
                const htmlToken = token as Tokens.HTML;
                return (
                    <Text key={key} style={baseTextStyle}>
                        {htmlToken.text}
                    </Text>
                );
            }
            default:
                return (
                    <Text key={key} style={baseTextStyle}>
                        {token.raw}
                    </Text>
                );
        }
    });
};

const renderBlockTokens = (
    tokens: Token[],
    keyPrefix: string,
    baseTextStyle: TextStyle
): React.ReactNode[] => {
    return tokens.map((token, index) => {
        const key = `${keyPrefix}-${index}`;

        switch (token.type) {
            case 'space':
            case 'def':
            case 'checkbox':
                return null;

            case 'heading': {
                const headingToken = token as Tokens.Heading;
                const headingStyle =
                    headingToken.depth === 1
                        ? styles.h1
                        : headingToken.depth === 2
                            ? styles.h2
                            : styles.h3;
                return (
                    <Text
                        key={key}
                        accessibilityRole="header"
                        style={[baseTextStyle, styles.heading, headingStyle]}
                    >
                        {renderInlineTokens(headingToken.tokens, key, baseTextStyle)}
                    </Text>
                );
            }

            case 'paragraph': {
                const paragraphToken = token as Tokens.Paragraph;
                return (
                    <Text key={key} style={baseTextStyle} selectable>
                        {renderInlineTokens(paragraphToken.tokens, key, baseTextStyle)}
                    </Text>
                );
            }

            case 'text': {
                const textToken = token as Tokens.Text;
                return (
                    <Text key={key} style={baseTextStyle} selectable>
                        {textToken.tokens?.length
                            ? renderInlineTokens(textToken.tokens, key, baseTextStyle)
                            : textToken.text}
                    </Text>
                );
            }

            case 'code': {
                const codeToken = token as Tokens.Code;
                return (
                    <View key={key} style={styles.codeBlock}>
                        <View style={styles.codeHeader}>
                            <Ionicons
                                name="code-slash-outline"
                                size={13}
                                color={chatTheme.colors.textCodeMuted}
                                accessible={false}
                            />
                            <Text style={styles.codeLang}>
                                {codeToken.lang || 'código'}
                            </Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.codeScrollContent}
                        >
                            <Text style={styles.codeBlockText} selectable>
                                {codeToken.text}
                            </Text>
                        </ScrollView>
                    </View>
                );
            }

            case 'blockquote': {
                const quoteToken = token as Tokens.Blockquote;
                return (
                    <View key={key} style={styles.blockquote}>
                        {renderBlockTokens(quoteToken.tokens, key, baseTextStyle)}
                    </View>
                );
            }

            case 'list': {
                const listToken = token as Tokens.List;
                const startNumber =
                    typeof listToken.start === 'number' ? listToken.start : 1;

                return (
                    <View key={key} style={styles.list}>
                        {listToken.items.map((item, itemIndex) => {
                            const itemKey = `${key}-item-${itemIndex}`;

                            return (
                                <View key={itemKey} style={styles.listItem}>
                                    {item.task ? (
                                        <View style={styles.taskIconContainer}>
                                            <Ionicons
                                                name={item.checked ? 'checkbox' : 'square-outline'}
                                                size={17}
                                                color={
                                                    item.checked
                                                        ? chatTheme.colors.primary
                                                        : chatTheme.colors.textSecondary
                                                }
                                                accessible={false}
                                            />
                                        </View>
                                    ) : listToken.ordered ? (
                                        <Text style={[baseTextStyle, styles.listMarker]}>
                                            {`${startNumber + itemIndex}.`}
                                        </Text>
                                    ) : (
                                        <View style={styles.bulletDotContainer}>
                                            <View style={styles.bulletDot} />
                                        </View>
                                    )}
                                    <View style={styles.listItemContent}>
                                        {renderBlockTokens(item.tokens, itemKey, baseTextStyle)}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                );
            }

            case 'table': {
                const tableToken = token as Tokens.Table;
                return (
                    <ScrollView
                        key={key}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tableScroll}
                    >
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                {tableToken.header.map((cell, cellIndex) => (
                                    <View key={`${key}-th-${cellIndex}`} style={styles.tableCell}>
                                        <Text style={[baseTextStyle, styles.bold]}>
                                            {renderInlineTokens(
                                                cell.tokens,
                                                `${key}-th-${cellIndex}`,
                                                baseTextStyle
                                            )}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            {tableToken.rows.map((row, rowIndex) => (
                                <View key={`${key}-tr-${rowIndex}`} style={styles.tableRow}>
                                    {row.map((cell, cellIndex) => (
                                        <View
                                            key={`${key}-td-${rowIndex}-${cellIndex}`}
                                            style={styles.tableCell}
                                        >
                                            <Text style={baseTextStyle}>
                                                {renderInlineTokens(
                                                    cell.tokens,
                                                    `${key}-td-${rowIndex}-${cellIndex}`,
                                                    baseTextStyle
                                                )}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                );
            }

            case 'hr':
                return <View key={key} style={styles.hr} />;

            case 'html': {
                const htmlToken = token as Tokens.HTML;
                const trimmed = htmlToken.text.trim();
                if (!trimmed) return null;
                return (
                    <Text key={key} style={baseTextStyle}>
                        {trimmed}
                    </Text>
                );
            }

            default:
                if (!token.raw.trim()) return null;
                return (
                    <Text key={key} style={baseTextStyle}>
                        {token.raw}
                    </Text>
                );
        }
    });
};

export const MarkdownText: React.FC<MarkdownTextProps> = ({
    content,
    color = chatTheme.colors.textPrimary,
}) => {
    const tokens = useMemo(
        () => lexer(content, { gfm: true, breaks: true }),
        [content]
    );

    const baseTextStyle = useMemo<TextStyle>(
        () => ({ ...styles.text, color }),
        [color]
    );

    return (
        <View style={styles.container}>
            {renderBlockTokens(tokens, 'md', baseTextStyle)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    text: {
        fontSize: 15,
        lineHeight: 22.5,
    },
    heading: {
        fontWeight: '700',
        marginTop: 4,
    },
    h1: {
        fontSize: 19,
        lineHeight: 26,
    },
    h2: {
        fontSize: 17,
        lineHeight: 24,
    },
    h3: {
        fontSize: 16,
        lineHeight: 23,
    },
    bold: {
        fontWeight: '700',
    },
    italic: {
        fontStyle: 'italic',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
    },
    inlineCode: {
        fontFamily: chatTheme.typography.monoFont,
        fontSize: 13.5,
        backgroundColor: chatTheme.colors.surfaceInlineCode,
        color: chatTheme.colors.textPrimary,
    },
    codeBlock: {
        backgroundColor: chatTheme.colors.surfaceCode,
        borderRadius: chatTheme.radius.sm + 2,
        overflow: 'hidden',
        marginVertical: 2,
    },
    codeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: chatTheme.colors.surfaceCodeHeader,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    codeLang: {
        fontFamily: chatTheme.typography.monoFont,
        fontSize: 11.5,
        color: chatTheme.colors.textCodeMuted,
        fontWeight: '600',
    },
    codeScrollContent: {
        padding: 12,
    },
    codeBlockText: {
        fontFamily: chatTheme.typography.monoFont,
        fontSize: 13,
        lineHeight: 20,
        color: chatTheme.colors.textCode,
    },
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: chatTheme.colors.primary,
        backgroundColor: chatTheme.colors.surfaceSubtle,
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 4,
    },
    list: {
        gap: 6,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    listMarker: {
        minWidth: 18,
        fontWeight: '600',
        color: chatTheme.colors.primary,
    },
    bulletDotContainer: {
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        width: 14,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: chatTheme.colors.primary,
    },
    taskIconContainer: {
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItemContent: {
        flex: 1,
        gap: 4,
    },
    link: {
        color: chatTheme.colors.primary,
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    hr: {
        height: 1,
        backgroundColor: chatTheme.colors.borderSubtle,
        marginVertical: 6,
    },
    tableScroll: {
        marginVertical: 2,
    },
    table: {
        borderWidth: 1,
        borderColor: chatTheme.colors.borderSubtle,
        borderRadius: chatTheme.radius.sm,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: chatTheme.colors.borderSubtle,
    },
    tableHeaderRow: {
        backgroundColor: chatTheme.colors.surfaceSubtle,
    },
    tableCell: {
        minWidth: 96,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRightWidth: 1,
        borderRightColor: chatTheme.colors.borderSubtle,
    },
});
