import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, EmptyState, LevelBadge } from '../components/ui';
import { useLibrary } from '../context/LibraryContext';
import { colors, radius, spacing, typography } from '../theme';
import { speak } from '../utils/speech';
import { DAY_MS } from '../utils/srs';
import { FlashcardsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<FlashcardsStackParamList, 'Deck'>;

function dueLabel(dueAt: number): { text: string; hot: boolean } {
  const delta = dueAt - Date.now();
  if (delta <= 0) return { text: 'Due now', hot: true };
  if (delta < 60 * 60 * 1000) return { text: `in ${Math.round(delta / (60 * 1000))}m`, hot: false };
  if (delta < DAY_MS) return { text: `in ${Math.round(delta / (60 * 60 * 1000))}h`, hot: false };
  return { text: `in ${Math.round(delta / DAY_MS)}d`, hot: false };
}

export function DeckScreen({ navigation }: Props) {
  const { cards, dueCards, removeCard, progress } = useLibrary();

  const confirmDelete = (id: string, word: string) => {
    Alert.alert('Remove card', `Remove “${word}” from your flashcards?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCard(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.brand}>Flashcards</Text>
        <Text style={styles.sub}>Context-aware vocabulary with spaced repetition.</Text>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          cards.length > 0 ? (
            <Card style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View>
                  <Text style={styles.reviewCount}>{dueCards.length}</Text>
                  <Text style={styles.reviewLabel}>
                    {dueCards.length === 1 ? 'card due' : 'cards due'}
                  </Text>
                </View>
                <View style={styles.reviewStats}>
                  <MiniStat value={cards.length} label="Total" />
                  <MiniStat value={progress.reviewsDone} label="Reviews" />
                  <MiniStat value={progress.streak} label="Streak" />
                </View>
              </View>
              <Button
                label={dueCards.length > 0 ? 'Start review' : 'All caught up — review anyway'}
                icon={dueCards.length > 0 ? '⚡' : '↻'}
                variant={dueCards.length > 0 ? 'primary' : 'secondary'}
                onPress={() => navigation.navigate('Review')}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🗂️"
            title="No saved words yet"
            message="Tap words while reading a passage and save them here. Each card keeps the sentence it came from."
          />
        }
        renderItem={({ item }) => {
          const due = dueLabel(item.dueAt);
          return (
            <Card style={styles.wordCard}>
              <View style={styles.wordHeader}>
                <View style={styles.wordTitleRow}>
                  <Text style={styles.word}>{item.word}</Text>
                  {!!item.partOfSpeech && <Text style={styles.pos}>{item.partOfSpeech}</Text>}
                </View>
                <Pressable hitSlop={8} onPress={() => speak(item.word)}>
                  <Text style={styles.speaker}>🔊</Text>
                </Pressable>
              </View>
              <Text style={styles.def} numberOfLines={2}>
                {item.definition}
              </Text>
              {!!item.context && (
                <Text style={styles.context} numberOfLines={2}>
                  “{item.context}”
                </Text>
              )}
              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  {!!item.sourceLevel && <LevelBadge level={item.sourceLevel} size="sm" />}
                  <Text style={[styles.dueChip, due.hot && styles.dueChipHot]}>{due.text}</Text>
                </View>
                <Pressable hitSlop={8} onPress={() => confirmDelete(item.id, item.word)}>
                  <Text style={styles.delete}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  brand: { ...typography.display, color: colors.ink },
  sub: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  reviewCard: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewCount: { ...typography.display, color: colors.primary },
  reviewLabel: { ...typography.caption, color: colors.primary },
  reviewStats: { flexDirection: 'row', gap: spacing.lg },
  miniStat: { alignItems: 'center' },
  miniValue: { ...typography.heading, color: colors.ink },
  miniLabel: { ...typography.small, color: colors.inkFaint },
  wordCard: { gap: spacing.xs },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  word: { ...typography.heading, color: colors.ink },
  pos: { ...typography.caption, color: colors.accent, fontStyle: 'italic' },
  speaker: { fontSize: 18 },
  def: { ...typography.caption, color: colors.inkSoft, lineHeight: 19 },
  context: { ...typography.caption, color: colors.inkFaint, fontStyle: 'italic', lineHeight: 19 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dueChip: {
    ...typography.small,
    color: colors.inkFaint,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  dueChipHot: { color: colors.primary, backgroundColor: colors.primarySoft },
  delete: { ...typography.caption, color: colors.danger },
});
