import * as Haptics from 'expo-haptics';
import { useStore } from '../store/projects';

const enabled = () => useStore.getState().settings.haptics;

export const haptic = {
  select: () => enabled() && Haptics.selectionAsync().catch(() => {}),
  light: () => enabled() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  success: () => enabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => enabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
