import { useCallback, useEffect } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { driver } from 'driver.js';
import type { Config, DriveStep, DriverHook } from 'driver.js';
import '../styles/GuidedTour.css';

type GuidedTourButtonProps = {
  steps: DriveStep[];
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  autoStart?: boolean;
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
  label = 'Avvia tour',
  children,
  onBeforeStart,
  onAfterEnd,
  config
}: GuidedTourButtonProps) {
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
        (onDestroyed as DriverHook | undefined)?.(element, step, opts);
        onAfterEnd?.();
      }) as DriverHook,
      ...restConfig,
    };

    mergedConfig.steps = availableSteps;

    const tourInstance = driver(mergedConfig);
    tourInstance.drive();
  }, [config, onAfterEnd, onBeforeStart, steps]);

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
