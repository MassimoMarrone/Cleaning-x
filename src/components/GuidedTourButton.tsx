import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { driver } from 'driver.js';
import type { Config, DriveStep, DriverHook } from 'driver.js';
import '../styles/GuidedTour.css';

type GuidedTourButtonProps = {
  steps: DriveStep[];
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  autoStart?: boolean;
  autoProgress?: boolean;
  autoProgressDelay?: number;
  label?: string;
  children?: ReactNode;
  onBeforeStart?: () => void | Promise<void>;
  onAfterEnd?: () => void;
  config?: Partial<Config>;
};

const filterAvailableSteps = (steps: DriveStep[]): DriveStep[] =>
  steps.filter((step) => {
    const { element } = step;

    if (!element) {
      return false;
    }

    if (typeof element === 'string') {
      return Boolean(document.querySelector(element));
    }

    if (element instanceof Element) {
      return true;
    }

    if (typeof element === 'function') {
      return true;
    }

    return false;
  });

export default function GuidedTourButton({
  steps,
  className = '',
  variant = 'primary',
  autoStart = false,
  autoProgress = false,
  autoProgressDelay = 2500,
  label = 'Avvia tour',
  children,
  onBeforeStart,
  onAfterEnd,
  config
}: GuidedTourButtonProps) {
  const tourInstanceRef = useRef<ReturnType<typeof driver> | null>(null);
  const isDestroyedRef = useRef(true);
  const autoProgressTimersRef = useRef<number[]>([]);
  const autoProgressRef = useRef(autoProgress);

  useEffect(() => {
    autoProgressRef.current = autoProgress;
  }, [autoProgress]);

  const clearAutoProgressTimers = useCallback(() => {
    autoProgressTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    autoProgressTimersRef.current = [];
  }, []);

  const scheduleAutoProgress = useCallback((availableStepsCount: number) => {
    clearAutoProgressTimers();

    if (!autoProgressRef.current || availableStepsCount <= 1) {
      return;
    }

    let stepIndex = 1;

    const queueNextStep = () => {
      if (!tourInstanceRef.current || isDestroyedRef.current) {
        return;
      }

      if (stepIndex >= availableStepsCount) {
        return;
      }

      const timerId = window.setTimeout(() => {
        if (!tourInstanceRef.current || isDestroyedRef.current) {
          return;
        }

        tourInstanceRef.current.moveNext();
        stepIndex += 1;

        if (stepIndex < availableStepsCount) {
          queueNextStep();
        }
      }, autoProgressDelay);

      autoProgressTimersRef.current.push(timerId);
    };

    queueNextStep();
  }, [autoProgressDelay, clearAutoProgressTimers]);

  const startTour = useCallback(async () => {
    if (onBeforeStart) {
      await onBeforeStart();
    }

    const availableSteps = filterAvailableSteps(steps);

    if (availableSteps.length === 0) {
      console.warn('Nessun elemento disponibile per il tour guidato.');
      return;
    }

    const { onDestroyed, ...restConfig } = config ?? {};

    const mergedConfig: Config = {
      animate: true,
      smoothScroll: true,
      allowClose: true,
      allowKeyboardControl: true,
      overlayOpacity: 0.6,
      overlayColor: 'rgba(19, 32, 67, 0.85)',
      popoverClass: 'tour-popover',
      stagePadding: 8,
      nextBtnText: 'Avanti',
      prevBtnText: 'Indietro',
      doneBtnText: 'Ho capito',
      showProgress: true,
      steps: availableSteps,
      onDestroyed: ((element, step, opts) => {
        clearAutoProgressTimers();
        (onDestroyed as DriverHook | undefined)?.(element, step, opts);
        tourInstanceRef.current = null;
        isDestroyedRef.current = true;
        onAfterEnd?.();
      }) as DriverHook,
      ...restConfig,
    };

    mergedConfig.steps = availableSteps;

    const tourInstance = driver(mergedConfig);
    tourInstanceRef.current = tourInstance;
    isDestroyedRef.current = false;
    tourInstance.drive();

    scheduleAutoProgress(availableSteps.length);
  }, [clearAutoProgressTimers, config, onAfterEnd, onBeforeStart, scheduleAutoProgress, steps]);

  useEffect(() => {
    return () => {
      clearAutoProgressTimers();
      tourInstanceRef.current?.destroy();
      tourInstanceRef.current = null;
      isDestroyedRef.current = true;
    };
  }, [clearAutoProgressTimers]);

  useEffect(() => {
    if (!autoStart) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void startTour();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [autoStart, startTour]);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    await startTour();
  };

  const buttonContent = children ?? label;
  const classes = ['tour-button', `tour-button--${variant}`, className].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} onClick={handleClick}>
      {buttonContent}
    </button>
  );
}
