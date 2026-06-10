import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';
import { DeckScreen } from '../screens/DeckScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PassageListScreen } from '../screens/PassageListScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, typography } from '../theme';
import { useLibrary } from '../context/LibraryContext';
import {
  FlashcardsStackParamList,
  ReadStackParamList,
  RootTabParamList,
} from './types';

const ReadStack = createNativeStackNavigator<ReadStackParamList>();
const FlashStack = createNativeStackNavigator<FlashcardsStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const stackHeader = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTitleStyle: { ...typography.heading, color: colors.ink },
  headerTintColor: colors.primary,
  contentStyle: { backgroundColor: colors.background },
};

function ReadStackNavigator() {
  return (
    <ReadStack.Navigator screenOptions={stackHeader}>
      <ReadStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <ReadStack.Screen name="PassageList" component={PassageListScreen} options={{ title: 'Passages' }} />
      <ReadStack.Screen name="Reader" component={ReaderScreen} options={{ title: '', headerBackTitle: 'Back' }} />
    </ReadStack.Navigator>
  );
}

function FlashcardsStackNavigator() {
  return (
    <FlashStack.Navigator screenOptions={stackHeader}>
      <FlashStack.Screen name="Deck" component={DeckScreen} options={{ headerShown: false }} />
      <FlashStack.Screen name="Review" component={ReviewScreen} options={{ title: 'Review' }} />
    </FlashStack.Navigator>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{icon}</Text>;
}

export function RootNavigator() {
  const { dueCards } = useLibrary();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: { ...typography.small },
      }}
    >
      <Tab.Screen
        name="ReadTab"
        component={ReadStackNavigator}
        options={{
          title: 'Read',
          tabBarIcon: ({ focused }) => <TabIcon icon="📖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="FlashcardsTab"
        component={FlashcardsStackNavigator}
        options={{
          title: 'Flashcards',
          tabBarBadge: dueCards.length > 0 ? dueCards.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 11 },
          tabBarIcon: ({ focused }) => <TabIcon icon="🗂️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
