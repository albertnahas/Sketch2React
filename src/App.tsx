import React, { useState, useEffect } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import OnboardingModal from "./components/OnboardingModal";

const App: React.FC<{}> = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const hasCompletedOnboarding =
      localStorage.getItem("onboardingCompleted") === "true";
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="flex w-full h-full">
      <Toolbar />
      <Canvas />
      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
    </div>
  );
};

export default App;
