import React, { useState } from 'react';
import FormatterApp from './components/FormatterApp';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [appStarted, setAppStarted] = useState(false);

  // Show the landing page first
  if (!appStarted) {
    return <LandingPage onStart={() => setAppStarted(true)} />;
  }

  // After starting, show the main application
  return <FormatterApp />;
};

export default App;