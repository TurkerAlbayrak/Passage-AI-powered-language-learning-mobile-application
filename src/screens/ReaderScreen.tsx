import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, LevelBadge } from '../components/ui';
import { WordDefinitionModal } from '../components/WordDefinitionModal';
import { useLibrary } from '../context/LibraryContext';
import { useSettings } from '../context/SettingsContext';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { Passage, WordDefinition } from '../types';
import { cleanWord } from '../api/dictionary';
import { speak, stopSpeaking } from '../utils/speech';
import { tokenize } from '../utils/tokenize';
import { ReadStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ReadStackParamList, 'Reader'>;

const FONT_SIZES = [16, 18, 20, 23];

export function ReaderScreen({ route, navigation }: Props) {
  const { passageId, level } = route.params;
  const { api } = useSettings();
  const { isWordSaved, saveWord, isRead, toggleRead } = useLibrary();

  const [passage, setPassage] = useState<Passage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [fontIndex, setFontIndex] = useState(1);

  const [selected, setSelected] = useState<{ word: string; context: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getText(passageId)
      .then((p) => {
        if (cancelled) return;
        if (!p) {
          setError('This passage could not be found.');
        } else {
          setPassage(p);
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [api, passageId]);

  const { tokens, sentences } = useMemo(
    () => (passage ? tokenize(passage.text) : { tokens: [], sentences: [] }),
    [passage],
  );

  const fontSize = FONT_SIZES[fontIndex];

  const onWordPress = (word: string, sentenceIndex: number) => {
    const clean = cleanWord(word);
    if (!clean) return;
    stopSpeaking();
    setSpeaking(false);
    setSelected({ word: clean, context: sentences[sentenceIndex] ?? passage?.text ?? '' });
  };

  const toggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else if (passage) {
      setSpeaking(true);
      speak(passage.text, { onDone: () => setSpeaking(false) });
    }
  };

  const handleToggleRead = () => {
    if (!passage) return;
    toggleRead({
      id: passage.id,
      level: String(passage.level || level),
      text: passage.text,
      wordCount: passage.wordCount,
    });
  };

  const handleSave = async (definition: WordDefinition, meaningIndex: number) => {
    if (!selected || !passage) return;
    await saveWord({
      definition,
      meaningIndex,
      context: selected.context,
      sourcePassageId: passage.id,
      sourcePassageTitle: passage.title,
      sourceLevel: String(passage.level || level),
    });
    setSelected(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !passage) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <EmptyState emoji="📄" title="Unavailable" message={error ?? 'Passage not found.'} />
          <Button label="Go back" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <LevelBadge level={String(passage.level || level)} size="sm" />
          <Text style={styles.metaText}>{passage.wordCount ?? '—'} words</Text>
          {isRead(passage.id) && <Text style={styles.readTag}>✓ Read</Text>}
        </View>
        <Text style={styles.title}>Passage #{passage.id}</Text>
        <Text style={styles.hint}>Tap any word to see its meaning and save it.</Text>

        <Text style={[styles.passage, { fontSize, lineHeight: fontSize * 1.6 }]}>
          {tokens.map((tok, i) => {
            if (!tok.isWord) {
              return (
                <Text key={i} style={styles.passage}>
                  {tok.text}
                </Text>
              );
            }
            const saved = isWordSaved(cleanWord(tok.text));
            return (
              <Text
                key={i}
                onPress={() => onWordPress(tok.text, tok.sentenceIndex)}
                suppressHighlighting
                style={saved ? styles.savedWord : undefined}
              >
                {tok.text}
              </Text>
            );
          })}
        </Text>

        <Button
          label={isRead(passage.id) ? 'Read — tap to unmark' : 'Mark as read'}
          icon={isRead(passage.id) ? '✓' : '○'}
          variant={isRead(passage.id) ? 'secondary' : 'primary'}
          onPress={handleToggleRead}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={() => setFontIndex((i) => (i + 1) % FONT_SIZES.length)}>
          <Text style={styles.toolBtnText}>Aa</Text>
        </Pressable>
        <Pressable
          style={[styles.speakBtn, speaking && styles.speakBtnActive]}
          onPress={toggleSpeak}
        >
          <Text style={styles.speakBtnText}>
            {speaking ? '⏸  Stop' : '🔊  Listen'}
          </Text>
        </Pressable>
      </View>

      <WordDefinitionModal
        visible={!!selected}
        word={selected?.word ?? ''}
        context={selected?.context ?? ''}
        alreadySaved={selected ? isWordSaved(selected.word) : false}
        onClose={() => setSelected(null)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  metaText: { ...typography.small, color: colors.inkFaint },
  readTag: { ...typography.small, color: colors.success },
  title: { ...typography.title, color: colors.ink, marginBottom: spacing.xs },
  hint: { ...typography.caption, color: colors.inkFaint, marginBottom: spacing.lg },
  passage: { color: colors.ink },
  savedWord: {
    color: colors.primary,
    backgroundColor: colors.highlight,
    fontWeight: '600',
  },
  toolbar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  toolBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  toolBtnText: { ...typography.bodyStrong, color: colors.ink },
  speakBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  speakBtnActive: { backgroundColor: colors.accent },
  speakBtnText: { ...typography.bodyStrong, color: colors.onAccent },
});
