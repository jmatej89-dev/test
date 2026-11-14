import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

function useA11yFlag(read: () => Promise<boolean>, event: 'reduceTransparencyChanged' | 'reduceMotionChanged' | 'highTextContrastChanged') {
  const [v, setV] = useState(false);
  useEffect(() => {
    let alive = true;
    read().then((x) => alive && setV(x)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener(event, (x: boolean) => setV(x));
    return () => {
      alive = false;
      sub.remove();
    };
  }, [read, event]);
  return v;
}

export const useReduceTransparency = () =>
  useA11yFlag(AccessibilityInfo.isReduceTransparencyEnabled, 'reduceTransparencyChanged');
export const useReduceMotion = () => useA11yFlag(AccessibilityInfo.isReduceMotionEnabled, 'reduceMotionChanged');
