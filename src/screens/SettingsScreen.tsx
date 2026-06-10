import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, SectionTitle } from '../components/ui';
import { CefrApi } from '../api/cefr';
import { DEFAULT_API_BASE_URL } from '../config';
import { useSettings } from '../context/SettingsContext';
import { ensureNotificationPermission } from '../utils/notifications';
import { colors, radius, spacing, typography } from '../theme';

export function SettingsScreen() {
  const { apiBaseUrl, setApiBaseUrl } = useSettings();
  const [draft, setDraft] = useState(apiBaseUrl);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [notifState, setNotifState] = useState<string | null>(null);

  const onSave = async () => {
    await setApiBaseUrl(draft);
    setResult({ ok: true, msg: 'Saved. Pull to refresh on the Read tab.' });
  };

  const onTest = async () => {
    setTesting(true);
    setResult(null);
    const url = draft.trim().replace(/\/+$/, '');
    try {
      const api = new CefrApi(url);
      const counts = await api.getLevelCounts();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      await setApiBaseUrl(url);
      setResult({
        ok: true,
        msg: total > 0 ? `Connected. ${total} passages available.` : 'Connected to the API.',
      });
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message || 'Connection failed.' });
    } finally {
      setTesting(false);
    }
  };

  const onEnableNotifications = async () => {
    const ok = await ensureNotificationPermission();
    setNotifState(
      ok
        ? 'Notifications enabled. We’ll remind you when words are due.'
        : 'Notifications are off. Enable them in your device settings (a physical device is required).',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>Settings</Text>

          <SectionTitle style={{ marginTop: spacing.lg }}>Library API</SectionTitle>
          <Card>
            <Text style={styles.label}>CEFR Texts API address</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="http://10.0.2.2:8000"
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
            />
            <Text style={styles.help}>
              Android emulator: http://10.0.2.2:8000{'\n'}
              iOS simulator: http://localhost:8000{'\n'}
              Physical device: http://YOUR-PC-IP:8000{'\n'}
              Or your deployed URL (Railway / Render / Fly).
            </Text>

            <View style={styles.btnRow}>
              <Button label="Test connection" variant="secondary" onPress={onTest} style={{ flex: 1 }} />
              <Button label="Save" onPress={onSave} style={{ flex: 1 }} />
            </View>

            {testing && (
              <View style={styles.testing}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.muted}>Testing…</Text>
              </View>
            )}
            {result && (
              <Text style={[styles.result, { color: result.ok ? colors.success : colors.danger }]}>
                {result.ok ? '✓ ' : '✕ '}
                {result.msg}
              </Text>
            )}

            {draft.trim() !== DEFAULT_API_BASE_URL && (
              <Button
                label="Reset to default"
                variant="ghost"
                onPress={() => setDraft(DEFAULT_API_BASE_URL)}
                style={{ marginTop: spacing.sm }}
              />
            )}
          </Card>

          <SectionTitle style={{ marginTop: spacing.xl }}>Reminders</SectionTitle>
          <Card>
            <Text style={styles.cardText}>
              Passage uses spaced repetition and can remind you when saved words are due for review.
            </Text>
            <Button
              label="Enable review reminders"
              variant="secondary"
              icon="🔔"
              onPress={onEnableNotifications}
              style={{ marginTop: spacing.md }}
            />
            {!!notifState && <Text style={styles.muted}>{notifState}</Text>}
          </Card>

          <Text style={styles.footer}>
            Passage · Free experience{'\n'}Every passage is a learning opportunity.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  brand: { ...typography.display, color: colors.ink, marginTop: spacing.sm },
  label: { ...typography.caption, color: colors.inkSoft, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.surfaceAlt,
  },
  help: { ...typography.small, color: colors.inkFaint, marginTop: spacing.sm, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  testing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  muted: { ...typography.caption, color: colors.inkFaint, marginTop: spacing.sm },
  result: { ...typography.caption, marginTop: spacing.md },
  cardText: { ...typography.body, color: colors.inkSoft, lineHeight: 22 },
  footer: { ...typography.small, color: colors.inkFaint, textAlign: 'center', marginTop: spacing.xxl, lineHeight: 18 },
});
