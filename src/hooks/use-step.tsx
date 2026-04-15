import {
  createSignal,
  createMemo,
  createContext,
  useContext,
  type ParentComponent,
} from "solid-js";

// ============================================================================
// Types
// ============================================================================

interface UseStepActions {
  goToNextStep: () => void;
  goToPrevStep: () => void;
  reset: () => void;
  canGoToNextStep: () => boolean;
  canGoToPrevStep: () => boolean;
  setStep: (step: number | ((step: number) => number)) => void;
}

type StepContextValue = [() => number, UseStepActions];

type SetStepCallbackType = (step: number | ((step: number) => number)) => void;

// ============================================================================
// Core Hook
// ============================================================================

export function useStep(maxStep: number): StepContextValue {
  const [currentStep, setCurrentStep] = createSignal(1);

  const canGoToNextStep = createMemo(() => currentStep() + 1 <= maxStep);
  const canGoToPrevStep = createMemo(() => currentStep() - 1 > 0);

  const setStep: SetStepCallbackType = (step) => {
    const newStep = step instanceof Function ? step(currentStep()) : step;

    if (newStep >= 1 && newStep <= maxStep) {
      setCurrentStep(newStep);
      return;
    }

    throw new Error("Step not valid");
  };

  const goToNextStep = () => {
    if (canGoToNextStep()) {
      setCurrentStep((step) => step + 1);
    }
  };

  const goToPrevStep = () => {
    if (canGoToPrevStep()) {
      setCurrentStep((step) => step - 1);
    }
  };

  const reset = () => {
    setCurrentStep(1);
  };

  return [
    currentStep,
    {
      goToNextStep,
      goToPrevStep,
      canGoToNextStep,
      canGoToPrevStep,
      setStep,
      reset,
    },
  ];
}

// ============================================================================
// Context
// ============================================================================

const StepContext = createContext<StepContextValue>();

// ============================================================================
// Provider
// ============================================================================

interface StepProviderProps {
  maxStep: number;
}

export const StepProvider: ParentComponent<StepProviderProps> = (props) => {
  const step = useStep(props.maxStep);

  return (
    <StepContext.Provider value={step}>{props.children}</StepContext.Provider>
  );
};

// ============================================================================
// Consumer Hook
// ============================================================================

export function useStepContext(): StepContextValue {
  const context = useContext(StepContext);

  if (!context) {
    throw new Error("useStepContext must be used within a <StepProvider>");
  }

  return context;
}
