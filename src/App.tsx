import React, { useState, useEffect } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import OnboardingModal from "./components/OnboardingModal";
import "./App.css";

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
    <div className="app-container">
      <Toolbar />
      <Canvas />
      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
    </div>
  );
};

export default App;
