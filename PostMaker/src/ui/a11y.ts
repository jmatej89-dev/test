import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

type FlagName = 'isReduceTransparencyEnabled' | 'isReduceMotionEnabled';
type EventName = 'reduceTransparencyChanged' | 'reduceMotionChanged';

function useA11yFlag(name: FlagName, event: EventName) {
  const [v, setV] = useState(false);
  useEffect(() => {
    let alive = true;
    const read = (AccessibilityInfo as unknown as Record<string, (() => Promise<boolean>) | undefined>)[name];
    // Not every platform implements every flag (e.g. web) – default to off.
    if (typeof read === 'function') read.call(AccessibilityInfo).then((x) => alive && setV(x)).catch(() => {});
    let sub: { remove: () => void } | undefined;
    try {
      sub = AccessibilityInfo.addEventListener(event, (x: boolean) => setV(x));
    } catch {
      sub = undefined;
    }
    return () => {
      alive = false;
      sub?.remove();
    };
  }, [name, event]);
  return v;
}

export const useReduceTransparency = () => useA11yFlag('isReduceTransparencyEnabled', 'reduceTransparencyChanged');
export const useReduceMotion = () => useA11yFlag('isReduceMotionEnabled', 'reduceMotionChanged');
