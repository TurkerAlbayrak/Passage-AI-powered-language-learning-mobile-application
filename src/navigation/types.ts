import { NavigatorScreenParams } from '@react-navigation/native';
import { Level } from '../types';

export type ReadStackParamList = {
  Home: undefined;
  PassageList: { level: Level };
  Reader: { passageId: string; level: Level };
};

export type FlashcardsStackParamList = {
  Deck: undefined;
  Review: undefined;
};

export type RootTabParamList = {
  ReadTab: NavigatorScreenParams<ReadStackParamList>;
  FlashcardsTab: NavigatorScreenParams<FlashcardsStackParamList>;
  SettingsTab: undefined;
};
