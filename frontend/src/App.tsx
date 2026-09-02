import React, { useEffect } from 'react';
import useGameStore from './store/gameStore';

// Pages
import LandingPage        from './pages/LandingPage';
import PlayerSetupPage    from './pages/PlayerSetupPage';
import LevelIntroPage     from './pages/LevelIntroPage';
import JudgeSelectionPage from './pages/JudgeSelectionPage';
import RoundCountdownPage from './pages/RoundCountdownPage';
import GameplayPage       from './pages/GameplayPage';
import FinalResultsPage   from './pages/FinalResultsPage';
import AdminPage          from './pages/AdminPage';

export default function App() {
  const phase = useGameStore(s => s.phase);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const store = useGameStore.getState();
      // Enter — advance through setup phases
      if (e.key === 'Enter') {
        if (store.phase === 'landing') store.setPhase('player-count');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  switch (phase) {
    case 'landing':
      return <LandingPage />;

    case 'player-count':
    case 'player-setup':
      return <PlayerSetupPage />;

    case 'level-intro':
      return <LevelIntroPage />;

    case 'judge-selection':
      return <JudgeSelectionPage />;

    case 'round-countdown':
      return <RoundCountdownPage />;

    case 'gameplay':
    case 'answer-reveal':
    case 'scoring':
      return <GameplayPage />;

    case 'final-results':
      return <FinalResultsPage />;

    case 'admin':
      return <AdminPage />;

    default:
      return <LandingPage />;
  }
}
