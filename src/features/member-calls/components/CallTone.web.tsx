import { useEffect } from 'react';

type Props = { active: boolean; variant?: 'incoming' | 'outgoing' };

export function CallTone({ active, variant = 'incoming' }: Props) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let stopped = false;

    const beep = (delay: number) => {
      const timer = setTimeout(() => {
        if (stopped) return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = variant === 'incoming' ? 470 : 425;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(variant === 'incoming' ? 0.22 : 0.1, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.34);
      }, delay);
      timers.add(timer);
    };

    const ring = () => {
      beep(0);
      beep(420);
    };
    ring();
    const interval = setInterval(ring, variant === 'incoming' ? 3_000 : 2_400);
    void context.resume().catch(() => {});

    return () => {
      stopped = true;
      clearInterval(interval);
      timers.forEach(clearTimeout);
      void context.close();
    };
  }, [active, variant]);

  return null;
}
