import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { Button, ModalSheet } from '@/components/ui';
import { VoiceInput } from '@/components/VoiceInput';
import { analyzeFood, requestAiConsent, scanDraft, setScanDraft } from '@/services/ai';
import { errorMessage } from '@/services/api';
import { localDate } from '@/services/dates';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';
import { MEAL_LABELS } from '@/app/log-food/_helpers';
import { colors, radii, spacing } from '@/constants/tokens';
import type { FoodItem, MealType } from '@/types';

const markIcon = require('@/assets/icons/onboarding/mark.svg');

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type TrackedItem = {
  id: string;
  food: FoodItem;
  quantity: number;
  photoUri?: string;
};

type Message =
  | { id: string; role: 'user'; kind: 'text'; text: string }
  | { id: string; role: 'user'; kind: 'photo'; uri: string }
  | { id: string; role: 'assistant'; kind: 'text'; text: string }
  | { id: string; role: 'assistant'; kind: 'typing' }
  | { id: string; role: 'assistant'; kind: 'food'; itemId: string };

function defaultMealSlot(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'snack';
  return 'dinner';
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? 'meal';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function formatServing(quantity: number): string {
  const q = Math.round(quantity * 4) / 4;
  const text = q.toFixed(2).replace(/\.?0+$/, '');
  return `${text} Serving${q === 1 ? '' : 's'}`;
}

export default function TrackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ text?: string; mealType?: string; openCamera?: string; openVoice?: string }>();
  const { state } = useAppStore();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [mealType, setMealType] = useState<MealType>(() =>
    MEAL_ORDER.includes(params.mealType as MealType) ? (params.mealType as MealType) : defaultMealSlot(),
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<TrackedItem | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const bootstrapped = useRef(false);

  const todayIso = localDate();
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: undefined, day: 'numeric', month: 'short' }).toUpperCase();
  const firstName = state.profile.name.trim().split(' ')[0] || 'there';

  /** Foods logged before for this meal slot, most frequent first. */
  const suggestions = useMemo(() => {
    const counts = new Map<string, { food: FoodItem; count: number }>();
    for (const day of state.foodLogs) {
      for (const entry of day.entries) {
        if (entry.mealType !== mealType) continue;
        const key = entry.food.name.toLowerCase();
        const current = counts.get(key);
        counts.set(key, { food: entry.food, count: (current?.count ?? 0) + 1 });
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((entry) => entry.food);
  }, [state.foodLogs, mealType]);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2400);
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const append = (...next: Message[]) => {
    setMessages((prev) => [...prev, ...next]);
    scrollToEnd();
  };

  const replaceTyping = (typingId: string, ...next: Message[]) => {
    setMessages((prev) => {
      const index = prev.findIndex((message) => message.id === typingId);
      if (index === -1) return [...prev, ...next];
      return [...prev.slice(0, index), ...next, ...prev.slice(index + 1)];
    });
    scrollToEnd();
  };

  /** Turn analysed foods into tracked items + chat messages. */
  const acceptFoods = (typingId: string, foods: FoodItem[]) => {
    const created: TrackedItem[] = foods.map((food) => ({ id: Crypto.randomUUID(), food, quantity: 1 }));
    setItems((prev) => [...prev, ...created]);
    replaceTyping(
      typingId,
      {
        id: Crypto.randomUUID(),
        role: 'assistant',
        kind: 'text',
        text: `I've tracked your ${joinNames(created.map((item) => item.food.name.toLowerCase()))}.`,
      },
      ...created.map((item) => ({ id: Crypto.randomUUID(), role: 'assistant' as const, kind: 'food' as const, itemId: item.id })),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const failTyping = (typingId: string, error: unknown) => {
    replaceTyping(typingId, {
      id: Crypto.randomUUID(),
      role: 'assistant',
      kind: 'text',
      text: errorMessage(error),
    });
  };

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      setDraft('');
      setBusy(true);
      const typingId = Crypto.randomUUID();
      append(
        { id: Crypto.randomUUID(), role: 'user', kind: 'text', text },
        { id: typingId, role: 'assistant', kind: 'typing' },
      );
      try {
        await requestAiConsent(state.preferences.aiConsent);
        await analyzeFood({ kind: 'text', text, mealSlot: mealType });
        const foods = scanDraft?.foods ?? [];
        setScanDraft(null);
        acceptFoods(typingId, foods);
      } catch (error) {
        failTyping(typingId, error);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, mealType, state.preferences.aiConsent],
  );

  /** Quick-add a food we already know without calling the AI. */
  const addKnownFood = (food: FoodItem) => {
    if (busy) return;
    Haptics.selectionAsync();
    const typingId = Crypto.randomUUID();
    append(
      { id: Crypto.randomUUID(), role: 'user', kind: 'text', text: food.name },
      { id: typingId, role: 'assistant', kind: 'typing' },
    );
    setTimeout(() => acceptFoods(typingId, [{ ...food, id: Crypto.randomUUID() }]), 350);
  };

  const openCamera = () => {
    Haptics.selectionAsync();
    setScanDraft(null);
    router.push({ pathname: '/scan/food-camera', params: { returnTo: 'track', mealSlot: mealType } });
  };

  const openGallery = async () => {
    if (busy) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos needed', 'Allow access to choose a food photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.65, base64: true });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];
    setBusy(true);
    const typingId = Crypto.randomUUID();
    append(
      { id: Crypto.randomUUID(), role: 'user', kind: 'photo', uri: asset.uri },
      { id: typingId, role: 'assistant', kind: 'typing' },
    );
    try {
      await requestAiConsent(state.preferences.aiConsent);
      await analyzeFood({ kind: 'food', uri: asset.uri, base64: asset.base64 ?? undefined, mediaType: asset.mimeType ?? 'image/jpeg', mealSlot: mealType });
      const foods = scanDraft?.foods ?? [];
      setScanDraft(null);
      acceptFoods(typingId, foods);
    } catch (error) {
      failTyping(typingId, error);
    } finally {
      setBusy(false);
    }
  };

  /** A photo analysed by the camera screen lands here when we regain focus. */
  useFocusEffect(
    useCallback(() => {
      const pending = scanDraft;
      if (!bootstrapped.current || !pending || !pending.photoUri) return;
      setScanDraft(null);
      const typingId = Crypto.randomUUID();
      append(
        { id: Crypto.randomUUID(), role: 'user', kind: 'photo', uri: pending.photoUri },
        { id: typingId, role: 'assistant', kind: 'typing' },
      );
      setTimeout(() => acceptFoods(typingId, pending.foods), 450);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  /** Handle deep-link params from the home composer exactly once. */
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    setScanDraft(null);
    if (params.text) void sendText(String(params.text));
    else if (params.openCamera) openCamera();
    else setTimeout(() => inputRef.current?.focus(), 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (id: string, patch: Partial<TrackedItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setEditing((current) => (current && current.id === id ? { ...current, ...patch } : current));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setMessages((prev) => prev.filter((message) => !(message.kind === 'food' && message.itemId === id)));
    setEditing(null);
  };

  const finish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    try {
      await appStoreActions.logFoods(items.map(({ food, quantity }) => ({ food, quantity })), mealType, todayIso);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not save', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.food.calories * item.quantity,
    }),
    { calories: 0 },
  );

  const hasConversation = messages.length > 0;
  const placeholder = items.length ? 'Want to adjust anything?' : 'What do you want to track?';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID="track-back"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Meal: ${MEAL_LABELS[mealType]}. Change meal`}
          testID="track-meal"
          onPress={() => {
            Haptics.selectionAsync();
            setMealPickerOpen(true);
          }}
          style={({ pressed }) => [styles.mealPill, pressed && styles.pressed]}
        >
          <Text style={styles.mealPillText}>{MEAL_LABELS[mealType]}</Text>
          <Feather name="chevron-down" size={16} color={colors.textPrimary} />
        </Pressable>
        <View style={[styles.iconButton, styles.dateBadge]} accessibilityLabel={`Today, ${todayLabel}`}>
          <Feather name="calendar" size={20} color={colors.textPrimary} />
        </View>
      </View>
      <Text style={styles.dateLabel}>TODAY, {todayLabel}</Text>

      {toast ? (
        <Animated.View entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(200)} style={styles.toast} accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{toast}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => setToast(null)} hitSlop={8}>
            <Feather name="x-circle" size={18} color={colors.textInverse} />
          </Pressable>
        </Animated.View>
      ) : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.thread, !hasConversation && styles.threadEmpty]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
        >
          {!hasConversation ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
              <View style={styles.emptyMark}>
                <Image source={markIcon} style={styles.emptyMarkIcon} contentFit="contain" />
              </View>
              <Text style={styles.emptyTitle}>
                {greeting()}, {firstName}!
              </Text>
              <Text style={styles.emptyHint}>Type, say or snap what you ate. I'll add it up and you confirm.</Text>
            </Animated.View>
          ) : (
            <>
              <AssistantRow>
                <Text style={styles.assistantText}>What do you want to track?</Text>
              </AssistantRow>
              {messages.map((message) => {
                if (message.role === 'user' && message.kind === 'text') {
                  return (
                    <Animated.View key={message.id} entering={FadeInDown.duration(220)} style={styles.userRow}>
                      <View style={styles.userBubble}>
                        <Text style={styles.userText}>{message.text}</Text>
                      </View>
                    </Animated.View>
                  );
                }
                if (message.role === 'user' && message.kind === 'photo') {
                  return (
                    <Animated.View key={message.id} entering={FadeInDown.duration(220)} style={styles.userRow}>
                      <Image source={{ uri: message.uri }} style={styles.userPhoto} contentFit="cover" accessibilityLabel="Your meal photo" />
                    </Animated.View>
                  );
                }
                if (message.kind === 'typing') {
                  return (
                    <AssistantRow key={message.id}>
                      <Text style={styles.assistantMuted}>Adding up your meal…</Text>
                    </AssistantRow>
                  );
                }
                if (message.kind === 'text') {
                  return (
                    <AssistantRow key={message.id}>
                      <Text style={styles.assistantText}>{message.text}</Text>
                    </AssistantRow>
                  );
                }
                const item = items.find((entry) => entry.id === message.itemId);
                if (!item) return null;
                return (
                  <Animated.View key={message.id} entering={FadeInDown.duration(260)} style={styles.foodBlock}>
                    <TrackedFoodCard
                      item={item}
                      mealLabel={MEAL_LABELS[mealType]}
                      onEdit={() => {
                        Haptics.selectionAsync();
                        setEditing(item);
                      }}
                    />
                    <View style={styles.feedbackRow}>
                      <Text style={styles.feedbackLabel}>Does this look right?</Text>
                      <FeedbackButton
                        icon="thumbs-up"
                        label="Looks right"
                        active={feedback[item.id] === 'up'}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setFeedback((prev) => ({ ...prev, [item.id]: 'up' }));
                          showToast('Thanks for the feedback!');
                        }}
                      />
                      <FeedbackButton
                        icon="thumbs-down"
                        label="Not quite right"
                        active={feedback[item.id] === 'down'}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setFeedback((prev) => ({ ...prev, [item.id]: 'down' }));
                          showToast('Thanks — tap the pencil to fix it, or tell me what to change.');
                        }}
                      />
                    </View>
                  </Animated.View>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Suggestions */}
        {!items.length && suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Often tracked for {MEAL_LABELS[mealType].toLowerCase()}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow} keyboardShouldPersistTaps="handled">
              {suggestions.map((food) => (
                <Pressable
                  key={food.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Track ${food.name}`}
                  testID={`suggestion-${food.id}`}
                  onPress={() => addKnownFood(food)}
                  style={({ pressed }) => [styles.suggestionChip, pressed && styles.pressed]}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {food.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Done tracking */}
        {items.length ? (
          <View style={styles.doneWrap}>
            <Button
              variant="dark"
              title={`Done tracking · ${Math.round(totals.calories)} kcal`}
              loading={busy}
              disabled={busy}
              onPress={() => void finish()}
              testID="track-done"
            />
          </View>
        ) : null}

        {/* Composer */}
        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <View style={styles.composer}>
            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor={colors.textPlaceholder}
              style={styles.input}
              multiline
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => void sendText(draft)}
              editable={!busy}
              testID="track-input"
            />
            <View style={styles.composerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
                testID="track-camera"
                onPress={openCamera}
                style={({ pressed }) => [styles.composerIcon, pressed && styles.pressed]}
              >
                <Feather name="camera" size={20} color={colors.textMuted} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose from gallery"
                testID="track-gallery"
                onPress={() => void openGallery()}
                style={({ pressed }) => [styles.composerIcon, pressed && styles.pressed]}
              >
                <Feather name="plus-circle" size={20} color={colors.textMuted} />
              </Pressable>
              <View style={styles.flex} />
              <VoiceInput compact onText={(text) => setDraft((prev) => (prev ? `${prev} ${text}` : text))} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send"
                accessibilityState={{ disabled: busy || !draft.trim() }}
                testID="track-send"
                disabled={busy || !draft.trim()}
                onPress={() => void sendText(draft)}
                style={({ pressed }) => [styles.sendButton, (busy || !draft.trim()) && styles.sendButtonIdle, pressed && styles.pressed]}
              >
                <Feather name="arrow-up" size={18} color={colors.textInverse} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Meal picker */}
      <ModalSheet visible={mealPickerOpen} onClose={() => setMealPickerOpen(false)} title="Which meal?" height={340}>
        <View style={styles.mealList}>
          {MEAL_ORDER.map((type) => {
            const selected = type === mealType;
            return (
              <Pressable
                key={type}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                testID={`meal-option-${type}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMealType(type);
                  setMealPickerOpen(false);
                }}
                style={({ pressed }) => [styles.mealOption, selected && styles.mealOptionOn, pressed && styles.pressed]}
              >
                <Text style={[styles.mealOptionText, selected && styles.mealOptionTextOn]}>{MEAL_LABELS[type]}</Text>
                {selected ? <Feather name="check" size={18} color={colors.textInverse} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>

      {/* Edit serving */}
      <ModalSheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.food.name} height={360}>
        {editing ? (
          <View style={styles.editBody}>
            <Text style={styles.editMeta}>
              {editing.food.servingSize} · {Math.round(editing.food.calories)} kcal per serving
            </Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Smaller serving"
                onPress={() => updateItem(editing.id, { quantity: Math.max(0.25, editing.quantity - 0.25) })}
                style={({ pressed }) => [styles.stepper, pressed && styles.pressed]}
              >
                <Feather name="minus" size={20} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.stepperValue}>{formatServing(editing.quantity)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Larger serving"
                onPress={() => updateItem(editing.id, { quantity: Math.min(5, editing.quantity + 0.25) })}
                style={({ pressed }) => [styles.stepper, styles.stepperDark, pressed && styles.pressed]}
              >
                <Feather name="plus" size={20} color={colors.textInverse} />
              </Pressable>
            </View>
            <Text style={styles.editTotal}>{Math.round(editing.food.calories * editing.quantity)} kcal</Text>
            <View style={styles.editActions}>
              <Button variant="outline" title="Remove" leadingIcon="trash-2" onPress={() => removeItem(editing.id)} style={styles.flex} />
              <Button variant="dark" title="Done" onPress={() => setEditing(null)} style={styles.flex} />
            </View>
          </View>
        ) : null}
      </ModalSheet>
    </View>
  );
}

function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.assistantRow}>
      <View style={styles.assistantAvatar}>
        <Image source={markIcon} style={styles.assistantAvatarIcon} contentFit="contain" />
      </View>
      <View style={styles.assistantBody}>{children}</View>
    </Animated.View>
  );
}

function TrackedFoodCard({ item, mealLabel, onEdit }: { item: TrackedItem; mealLabel: string; onEdit: () => void }) {
  const { food, quantity } = item;
  const kcal = Math.round(food.calories * quantity);
  return (
    <View style={styles.foodCard} testID={`tracked-${item.id}`}>
      <View style={styles.foodTop}>
        <View style={styles.foodThumbWrap}>
          {food.image ? (
            <Image source={{ uri: food.image }} style={styles.foodThumb} contentFit="cover" />
          ) : (
            <Feather name="coffee" size={22} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.foodTitleWrap}>
          <Text style={styles.foodTitle} numberOfLines={2}>
            {mealLabel}: {food.name}
          </Text>
          <View style={styles.servingBadge}>
            <Text style={styles.servingText}>{formatServing(quantity)}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${food.name}`}
          testID={`tracked-edit-${item.id}`}
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => [styles.editIcon, pressed && styles.pressed]}
        >
          <Feather name="edit-2" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.foodBottom}>
        <Text style={styles.foodKcal}>{kcal} kcal</Text>
        <View style={styles.macroRow}>
          <MacroPill letter="C" value={food.carbs * quantity} color={colors.macroCarbs} />
          <MacroPill letter="P" value={food.protein * quantity} color={colors.macroProtein} />
          <MacroPill letter="F" value={food.fat * quantity} color={colors.macroFat} />
          {food.fiber != null ? <MacroPill letter="Fi" value={food.fiber * quantity} color={colors.accentGreen} /> : null}
        </View>
      </View>
    </View>
  );
}

function MacroPill({ letter, value, color }: { letter: string; value: number; color: string }) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.macroDot, { backgroundColor: color }]}>
        <Text style={styles.macroLetter}>{letter}</Text>
      </View>
      <Text style={styles.macroValue}>{Math.round(value)}g</Text>
    </View>
  );
}

function FeedbackButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: 'thumbs-up' | 'thumbs-down';
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.feedbackButton, active && styles.feedbackButtonOn, pressed && styles.pressed]}
    >
      <Feather name={icon} size={16} color={active ? colors.textInverse : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dateBadge: { backgroundColor: colors.card },
  mealPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
  },
  mealPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textPrimary },
  dateLabel: {
    textAlign: 'center',
    marginTop: spacing.xs,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  toast: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.darkSurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toastText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textInverse },
  thread: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  threadEmpty: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xxxl },
  emptyMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyMarkIcon: { width: 44, height: 44 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.4, color: colors.textPrimary, marginTop: spacing.xs },
  emptyHint: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  assistantAvatar: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.card, marginTop: 1 },
  assistantAvatarIcon: { width: 24, height: 24 },
  assistantBody: { flex: 1, paddingTop: 2 },
  assistantText: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  assistantMuted: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: colors.textPlaceholder },
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderBottomRightRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  userPhoto: { width: 200, height: 200, borderRadius: radii.lg, backgroundColor: colors.darkSurfaceAlt },
  foodBlock: { gap: spacing.xs, marginLeft: 32 },
  foodCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  foodTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  foodThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  foodThumb: { width: 56, height: 56 },
  foodTitleWrap: { flex: 1, gap: 6 },
  foodTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 21, letterSpacing: -0.2, color: colors.textPrimary },
  servingBadge: { alignSelf: 'flex-start', backgroundColor: colors.background, borderRadius: radii.xs, paddingHorizontal: 8, paddingVertical: 3 },
  servingText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
  editIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  foodBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  foodKcal: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textPrimary },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  macroPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  macroLetter: { fontFamily: 'Inter_700Bold', fontSize: 9, color: colors.textInverse },
  macroValue: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textPrimary },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingTop: 2 },
  feedbackLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, marginRight: 4 },
  feedbackButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  feedbackButtonOn: { backgroundColor: colors.darkSurface },
  suggestions: { paddingTop: spacing.xs, paddingBottom: spacing.sm, gap: spacing.xs },
  suggestionsTitle: { paddingHorizontal: spacing.lg, fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textMuted },
  suggestionRow: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  suggestionChip: {
    maxWidth: 200,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, color: colors.textPrimary, textAlign: 'center' },
  doneWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  composerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  composer: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: 4,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: 4,
    maxHeight: 110,
  },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  composerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  sendButtonIdle: { backgroundColor: colors.planFaded },
  mealList: { gap: spacing.xs },
  mealOption: {
    height: 52,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealOptionOn: { backgroundColor: colors.darkSurface },
  mealOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textPrimary },
  mealOptionTextOn: { color: colors.textInverse },
  editBody: { gap: spacing.md },
  editMeta: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  stepper: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  stepperDark: { backgroundColor: colors.darkSurface },
  stepperValue: { fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.textPrimary, minWidth: 120, textAlign: 'center' },
  editTotal: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.textMuted },
  editActions: { flexDirection: 'row', gap: spacing.xs },
  pressed: { opacity: 0.7 },
});
