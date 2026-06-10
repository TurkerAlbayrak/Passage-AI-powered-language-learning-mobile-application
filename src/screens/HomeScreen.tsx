import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, LevelBadge, SectionTitle } from '../components/ui';
import { useLibrary } from '../context/LibraryContext';
import { useSettings } from '../context/SettingsContext';
import { colors, levelColors, radius, shadow, spacing, typography } from '../theme';
import { LEVELS, Level, LevelCounts } from '../types';
import { ReadStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ReadStackParamList, 'Home'>;

const LEVEL_DESC: Record<Level, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-intermediate',
  C1: 'Advanced',
  C2: 'Proficiency',
};

export function HomeScreen({ navigation }: Props) {
  const { api, ready } = useSettings();
  const { readPassages } = useLibrary();
  const [counts, setCounts] = useState<LevelCounts>({});
  const [loading, setLoading] = useState(true);
  const [randomLoading, setRandomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    setError(null);
    try {
      const c = await api.getLevelCounts();
      setCounts(c);
    } catch (e) {
      setError((e as Error).message || 'Could not reach the library.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (ready) {
      setLoading(true);
      fetchCounts();
    }
  }, [ready, fetchCounts]);

  // Refresh counts when returning to this screen (e.g. after changing API URL).
  useFocusEffect(
    useCallback(() => {
      if (ready) fetchCounts();
    }, [ready, fetchCounts]),
  );

  const handleRandom = async () => {
    setRandomLoading(true);
    try {
      const list = await api.getRandom({ count: 1 });
      const p = list[0];
      if (p) {
        navigation.navigate('Reader', { passageId: p.id, level: (p.level || 'A1') as Level });
      } else {
        Alert.alert('No passage', 'The library returned no passage. Try again.');
      }
    } catch (e) {
      Alert.alert('Couldn’t fetch', (e as Error).message || 'Could not get a random passage.');
    } finally {
      setRandomLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchCounts} tintColor={colors.primary} />
        }
      >
        <Text style={styles.eyebrow}>READ · LEARN · REMEMBER</Text>
        <Text style={styles.brand}>Passage</Text>
        <Text style={styles.tagline}>Every passage is a learning opportunity.</Text>

        <Button
          label={randomLoading ? 'Finding a passage…' : 'Random Passage'}
          icon=""
          loading={randomLoading}
          onPress={handleRandom}
          style={{ marginTop: spacing.md }}
        />

        <SectionTitle style={{ marginTop: spacing.xl }}>Choose your level</SectionTitle>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Can’t reach the library</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <Text style={styles.errorHint}>
              Set your API address in the Settings tab, then pull down to retry.
            </Text>
          </Card>
        ) : loading && Object.keys(counts).length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.levelList}>
            {LEVELS.map((lvl) => {
              const c = levelColors[lvl];
              const count = counts[lvl];
              return (
                <Pressable
                  key={lvl}
                  onPress={() => navigation.navigate('PassageList', { level: lvl })}
                  style={({ pressed }) => [styles.levelRow, pressed && styles.rowPressed]}
                >
                  <View style={[styles.levelTile, { backgroundColor: c.bg }]}>
                    <Text style={[styles.levelTileText, { color: c.fg }]}>{lvl}</Text>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelName}>{LEVEL_DESC[lvl]}</Text>
                    <Text style={styles.levelCount}>
                      {count !== undefined ? `${count} passages` : 'Tap to browse'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {readPassages.length > 0 && (
          <>
            <SectionTitle style={{ marginTop: spacing.xl }}>
              Read passages · {readPassages.length}
            </SectionTitle>
            <View style={styles.levelList}>
              {readPassages.map((rp) => (
                <Pressable
                  key={rp.id}
                  onPress={() =>
                    navigation.navigate('Reader', {
                      passageId: rp.id,
                      level: (rp.level || 'A1') as Level,
                    })
                  }
                  style={({ pressed }) => [styles.readRow, pressed && styles.rowPressed]}
                >
                  <View style={styles.readCheck}>
                    <Text style={styles.readCheckText}>✓</Text>
                  </View>
                  <View style={styles.levelInfo}>
                    <View style={styles.readTop}>
                      <LevelBadge level={rp.level} size="sm" />
                      <Text style={styles.readMeta}>Passage #{rp.id}</Text>
                    </View>
                    <Text style={styles.readPreview} numberOfLines={2}>
                      {rp.preview}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: {
    ...typography.small,
    color: colors.primary,
    letterSpacing: 2,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  brand: { ...typography.display, color: colors.ink },
  tagline: { ...typography.body, color: colors.inkSoft, marginBottom: spacing.sm },
  levelList: { gap: spacing.md },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  rowPressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  levelTile: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  levelTileText: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  levelInfo: { flex: 1 },
  levelName: { ...typography.heading, color: colors.ink },
  levelCount: { ...typography.caption, color: colors.inkFaint, marginTop: 2 },
  chevron: { fontSize: 30, color: colors.inkFaint, marginRight: spacing.sm, marginTop: -4 },
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  readCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  readCheckText: { color: colors.success, fontSize: 18, fontWeight: '800' },
  readTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  readMeta: { ...typography.small, color: colors.inkFaint },
  readPreview: { ...typography.caption, color: colors.inkSoft, lineHeight: 18 },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  errorCard: { backgroundColor: colors.dangerSoft },
  errorTitle: { ...typography.bodyStrong, color: colors.danger, marginBottom: spacing.xs },
  errorMsg: { ...typography.caption, color: colors.inkSoft, marginBottom: spacing.sm },
  errorHint: { ...typography.caption, color: colors.inkFaint },
});
