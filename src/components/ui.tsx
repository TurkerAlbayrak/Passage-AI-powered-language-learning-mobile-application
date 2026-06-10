import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, levelColors, radius, shadow, spacing, typography } from '../theme';

/** Primary / secondary / ghost button. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
}) {
  const palette: Record<string, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.onAccent },
    secondary: { bg: colors.primarySoft, fg: colors.primary },
    ghost: { bg: 'transparent', fg: colors.inkSoft, border: colors.border },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  };
  const p = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: p.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        p.border ? { borderWidth: 1, borderColor: p.border } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <Text style={[styles.buttonLabel, { color: p.fg }]}>
          {icon ? `${icon}  ` : ''}
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function LevelBadge({ level, size = 'md' }: { level: string; size?: 'sm' | 'md' }) {
  const c = levelColors[level] ?? { bg: colors.surfaceAlt, fg: colors.inkSoft };
  return (
    <View
      style={[
        styles.levelBadge,
        { backgroundColor: c.bg },
        size === 'sm' && { paddingHorizontal: 8, paddingVertical: 2 },
      ]}
    >
      <Text style={[styles.levelBadgeText, { color: c.fg, fontSize: size === 'sm' ? 11 : 13 }]}>
        {level || '—'}
      </Text>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      {content}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  leading,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  leading?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      <Text style={[styles.chipText, { color: active ? colors.onAccent : colors.inkSoft }]}>
        {leading ? `${leading} ` : ''}
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

export function EmptyState({
  emoji,
  title,
  message,
}: {
  emoji: string;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonLabel: { ...typography.bodyStrong, letterSpacing: 0.1 },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  levelBadgeText: { fontWeight: '800', letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.ink },
  chipIdle: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipText: { ...typography.caption },
  sectionTitle: { ...typography.heading, color: colors.ink, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 44, marginBottom: spacing.md },
  emptyTitle: { ...typography.title, color: colors.ink, marginBottom: spacing.xs, textAlign: 'center' },
  emptyMessage: { ...typography.body, color: colors.inkFaint, textAlign: 'center', lineHeight: 22 },
});
