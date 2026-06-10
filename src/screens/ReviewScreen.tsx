import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, LevelBadge } from '../components/ui';
import { useLibrary } from '../context/LibraryContext';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { Flashcard } from '../types';
import { speak } from '../utils/speech';
import { previewInterval, ReviewGrade } from '../utils/srs';
import { FlashcardsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<FlashcardsStackParamList, 'Review'>;

const GRADES: { grade: ReviewGrade; label: string; color: string }[] = [
  { grade: 'again', label: 'Again', color: colors.danger },
  { grade: 'hard', label: 'Hard', color: colors.warning },
  { grade: 'good', label: 'Good', color: colors.primary },
  { grade: 'easy', label: 'Easy', color: colors.success },
];

export function ReviewScreen({ navigation }: Props) {
  const { cards, dueCards, reviewCard } = useLibrary();

  // Snapshot the queue once so grading doesn't reshuffle mid-session.
  const queue = useMemo<Flashcard[]>(
    () => (dueCards.length > 0 ? dueCards : cards),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const flip = useRef(new Animated.Value(0)).current;

  const current = queue[index];

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const doFlip = () => {
    Animated.spring(flip, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
    setFlipped((f) => !f);
  };

  const handleGrade = async (grade: ReviewGrade) => {
    if (!current) return;
    await reviewCard(current.id, grade);
    setReviewed((r) => r + 1);
    // Reset to front and advance.
    flip.setValue(0);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  if (queue.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            emoji="🌱"
            title="Nothing to review"
            message="Save some words while reading and they’ll appear here."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState
            emoji="🎉"
            title="Session complete!"
            message={`You reviewed ${reviewed} ${reviewed === 1 ? 'card' : 'cards'}. Spaced repetition will bring them back at the perfect time.`}
          />
          <Button label="Back to deck" onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(index / queue.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {index + 1} / {queue.length}
        </Text>
      </View>

      <Pressable style={styles.cardArea} onPress={doFlip}>
        {/* Front: recall prompt */}
        <Animated.View
          style={[
            styles.face,
            { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] }) },
          ]}
          pointerEvents={flipped ? 'none' : 'auto'}
        >
          {!!current.sourceLevel && <LevelBadge level={current.sourceLevel} size="sm" />}
          <Text style={styles.word}>{current.word}</Text>
          {!!current.phonetic && <Text style={styles.phonetic}>{current.phonetic}</Text>}
          <Pressable
            style={styles.listenBtn}
            onPress={() => speak(current.word)}
            hitSlop={8}
          >
            <Text style={styles.listenText}>🔊  Listen</Text>
          </Pressable>
          {!!current.context && (
            <View style={styles.contextBox}>
              <Text style={styles.contextText}>“{current.context}”</Text>
            </View>
          )}
          <Text style={styles.tapHint}>Tap to reveal meaning</Text>
        </Animated.View>

        {/* Back: definition */}
        <Animated.View
          style={[
            styles.face,
            styles.faceBack,
            { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] }) },
          ]}
          pointerEvents={flipped ? 'auto' : 'none'}
        >
          <Text style={styles.backWord}>{current.word}</Text>
          {!!current.partOfSpeech && <Text style={styles.backPos}>{current.partOfSpeech}</Text>}
          <Text style={styles.definition}>{current.definition}</Text>
          {!!current.context && (
            <View style={styles.contextBoxBack}>
              <Text style={styles.contextLabel}>In context</Text>
              <Text style={styles.contextTextBack}>“{current.context}”</Text>
            </View>
          )}
          <Text style={styles.tapHint}>How well did you recall it?</Text>
        </Animated.View>
      </Pressable>

      {flipped ? (
        <View style={styles.gradeRow}>
          {GRADES.map((g) => (
            <Pressable
              key={g.grade}
              style={[styles.gradeBtn, { borderColor: g.color }]}
              onPress={() => handleGrade(g.grade)}
            >
              <Text style={[styles.gradeLabel, { color: g.color }]}>{g.label}</Text>
              <Text style={styles.gradeInterval}>{previewInterval(current, g.grade)}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Button label="Show answer" onPress={doFlip} style={styles.showBtn} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  progressText: { ...typography.caption, color: colors.inkFaint },
  cardArea: { flex: 1, margin: spacing.lg },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backfaceVisibility: 'hidden',
    ...shadow.floating,
  },
  faceBack: { backgroundColor: colors.surface },
  word: { ...typography.display, fontSize: 38, color: colors.ink, textAlign: 'center' },
  phonetic: { ...typography.body, color: colors.inkFaint },
  listenBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  listenText: { ...typography.caption, color: colors.primary },
  contextBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  contextText: { ...typography.body, color: colors.inkSoft, fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  tapHint: { ...typography.small, color: colors.inkFaint, marginTop: spacing.sm },
  backWord: { ...typography.title, color: colors.ink },
  backPos: { ...typography.caption, color: colors.accent, fontStyle: 'italic' },
  definition: { ...typography.heading, color: colors.ink, textAlign: 'center', lineHeight: 26, fontWeight: '500' },
  contextBoxBack: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
  },
  contextLabel: { ...typography.small, color: colors.accent, marginBottom: 4, textTransform: 'uppercase' },
  contextTextBack: { ...typography.body, color: colors.inkSoft, fontStyle: 'italic', lineHeight: 22 },
  gradeRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  gradeBtn: {
    flex: 1,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  gradeLabel: { ...typography.bodyStrong },
  gradeInterval: { ...typography.small, color: colors.inkFaint, marginTop: 2 },
  showBtn: { margin: spacing.lg },
});
