import { useState } from "react";
import { SignIn } from "./SignIn";
import { Scanning } from "./Scanning";
import { setSession } from "../../lib/auth";

type Step = "signin" | "scanning";

const ONBOARDING_KEY = "socialpulse.onboarding.v1";
const hasChromeStorage = typeof chrome !== "undefined" && !!chrome?.storage?.local;

interface AuthFlowProps {
  /** Called once auth + onboarding are persisted; panel reverts to signed-in view. */
  onComplete: () => void;
}

export function AuthFlow({ onComplete }: AuthFlowProps) {
  const [step, setStep] = useState<Step>("signin");

  const handleSignedIn = async (email: string) => {
    await setSession({
      userId: `dev-${Date.now()}`,
      email,
      accessToken: "dev-token",
    });
    await persistOnboarded();
    setStep("scanning");
  };

  return (
    <div className="auth-flow" data-step={step}>
      {step === "signin" && <SignIn onSignedIn={handleSignedIn} />}
      {step === "scanning" && <Scanning onDone={onComplete} />}
    </div>
  );
}

async function persistOnboarded() {
  const value = { completed: true };
  if (hasChromeStorage) {
    await chrome.storage.local.set({ [ONBOARDING_KEY]: value });
  } else {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(value));
  }
}
