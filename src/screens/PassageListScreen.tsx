import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, EmptyState, LevelBadge } from '../components/ui';
import { useLibrary } from '../context/LibraryContext';
import { useSettings } from '../context/SettingsContext';
import { colors, radius, spacing, typography } from '../theme';
import { Passage } from '../types';
import { ReadStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ReadStackParamList, 'PassageList'>;

const PAGE_SIZE = 20;

export function PassageListScreen({ route, navigation }: Props) {
  const { level } = route.params;
  const { api } = useSettings();
  const { readPassageIds } = useLibrary();

  const [items, setItems] = useState<Passage[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      try {
        if (replace) setLoading(true);
        else setLoadingMore(true);
        setError(null);
        const batch = await api.getTexts({ level, page: nextPage, limit: PAGE_SIZE });
        if (batch.length < PAGE_SIZE) setReachedEnd(true);
        setItems((prev) => {
          const merged = replace ? batch : [...prev, ...batch];
          // De-dupe by id in case the API ignores pagination.
          const seen = new Set<string>();
          return merged.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
        });
        setPage(nextPage);
      } catch (e) {
        setError((e as Error).message || 'Failed to load passages.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [api, level],
  );

  useEffect(() => {
    setItems([]);
    setReachedEnd(false);
    load(1, true);
  }, [load]);

  useEffect(() => {
    navigation.setOptions({ title: `Level ${level}` });
  }, [navigation, level]);

  const handleEndReached = () => {
    if (!loading && !loadingMore && !reachedEnd) {
      load(page + 1, false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Loading {level} passages…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState emoji="📡" title="Couldn’t load" message={error} />
          <Button label="Try again" onPress={() => load(1, true)} style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={handleEndReached}
        ListEmptyComponent={
          <EmptyState
            emoji="🔎"
            title="Nothing here yet"
            message="No passages were returned for this level."
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : !reachedEnd && items.length > 0 ? (
            <Pressable onPress={handleEndReached} style={styles.loadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const read = readPassageIds.has(item.id);
          return (
            <Card
              style={styles.card}
              onPress={() => navigation.navigate('Reader', { passageId: item.id, level })}
            >
              <View style={styles.cardHeader}>
                <LevelBadge level={item.level || level} size="sm" />
                {read && <Text style={styles.readBadge}>✓ Read</Text>}
              </View>
              <Text style={styles.cardPreview} numberOfLines={3}>
                {item.text}
              </Text>
              <Text style={styles.cardMeta}>
                Passage #{item.id} · {item.wordCount ?? '—'} words
              </Text>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  muted: { ...typography.caption, color: colors.inkFaint },
  card: { gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readBadge: { ...typography.small, color: colors.success },
  cardPreview: { ...typography.body, color: colors.ink, lineHeight: 22 },
  cardMeta: { ...typography.small, color: colors.inkFaint, marginTop: spacing.xs },
  loadMore: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  loadMoreText: { ...typography.caption, color: colors.primary },
});
