import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { lookupWord } from '../api/dictionary';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { WordDefinition } from '../types';
import { speak } from '../utils/speech';
import { Button } from './ui';

interface Props {
  visible: boolean;
  word: string;
  context: string;
  alreadySaved: boolean;
  onClose: () => void;
  onSave: (definition: WordDefinition, meaningIndex: number) => void;
}

export function WordDefinitionModal({
  visible,
  word,
  context,
  alreadySaved,
  onClose,
  onSave,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (visible && word) {
      setLoading(true);
      setError(null);
      setDefinition(null);
      setSelectedMeaning(0);
      lookupWord(word)
        .then((d) => {
          if (!cancelled) setDefinition(d);
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [visible, word]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.word}>{definition?.word ?? word}</Text>
              {!!definition?.phonetic && (
                <Text style={styles.phonetic}>{definition.phonetic}</Text>
              )}
            </View>
            <Pressable
              onPress={() => speak(definition?.word ?? word)}
              style={styles.speakerBtn}
              hitSlop={8}
            >
              <Text style={styles.speakerIcon}>🔊</Text>
            </Pressable>
          </View>

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.muted}>Looking up…</Text>
            </View>
          )}

          {!!error && !loading && (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {definition && !loading && (
            <>
              {definition.meanings.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.posRow}
                  contentContainerStyle={{ gap: spacing.sm }}
                >
                  {definition.meanings.map((m, i) => (
                    <Pressable
                      key={`${m.partOfSpeech}-${i}`}
                      onPress={() => setSelectedMeaning(i)}
                      style={[styles.posChip, selectedMeaning === i && styles.posChipActive]}
                    >
                      <Text
                        style={[
                          styles.posChipText,
                          selectedMeaning === i && { color: colors.onAccent },
                        ]}
                      >
                        {m.partOfSpeech || '—'}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <ScrollView style={styles.defScroll} contentContainerStyle={{ gap: spacing.md }}>
                {definition.meanings[selectedMeaning]?.partOfSpeech ? (
                  <Text style={styles.pos}>
                    {definition.meanings[selectedMeaning].partOfSpeech}
                  </Text>
                ) : null}
                {definition.meanings[selectedMeaning]?.definitions.map((d, i) => (
                  <View key={i}>
                    <Text style={styles.definition}>
                      {i + 1}. {d.definition}
                    </Text>
                    {!!d.example && <Text style={styles.example}>“{d.example}”</Text>}
                  </View>
                ))}

                {!!context && (
                  <View style={styles.contextBox}>
                    <Text style={styles.contextLabel}>From your reading</Text>
                    <Text style={styles.contextText}>{context}</Text>
                  </View>
                )}
              </ScrollView>

              <Button
                label={alreadySaved ? 'Saved to Flashcards' : 'Save to Flashcards'}
                icon={alreadySaved ? '✓' : '＋'}
                variant={alreadySaved ? 'secondary' : 'primary'}
                disabled={alreadySaved}
                onPress={() => onSave(definition, selectedMeaning)}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,30,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '78%',
    ...shadow.floating,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  word: { ...typography.display, color: colors.ink },
  phonetic: { ...typography.body, color: colors.inkFaint, marginTop: 2 },
  speakerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: { fontSize: 20 },
  center: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  muted: { ...typography.caption, color: colors.inkFaint },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center' },
  posRow: { marginBottom: spacing.md, flexGrow: 0 },
  posChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  posChipActive: { backgroundColor: colors.accent },
  posChipText: { ...typography.caption, color: colors.inkSoft },
  defScroll: { marginBottom: spacing.lg },
  pos: { ...typography.caption, color: colors.accent, fontStyle: 'italic' },
  definition: { ...typography.body, color: colors.ink, lineHeight: 23 },
  example: { ...typography.caption, color: colors.inkFaint, marginTop: 4, fontStyle: 'italic' },
  contextBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  contextLabel: { ...typography.small, color: colors.accent, marginBottom: 4, textTransform: 'uppercase' },
  contextText: { ...typography.body, color: colors.inkSoft, lineHeight: 22, fontStyle: 'italic' },
});
