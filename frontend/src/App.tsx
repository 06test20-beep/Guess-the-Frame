import React, { useEffect, useState } from 'react';
import useGameStore from './store/gameStore';
import { useOnlineGameStore } from './store/onlineGameStore';
import { migrateLocalStorageToIndexedDB } from './utils/migration';

// Pages
import LandingPage        from './pages/LandingPage';
import PlayerSetupPage    from './pages/PlayerSetupPage';
import LevelIntroPage     from './pages/LevelIntroPage';
import JudgeSelectionPage from './pages/JudgeSelectionPage';
import RoundCountdownPage from './pages/RoundCountdownPage';
import GameplayPage       from './pages/GameplayPage';
import FinalResultsPage   from './pages/FinalResultsPage';
import AdminPage          from './pages/AdminPage';
import PlayingSequencePage from './pages/PlayingSequencePage';
import OnlineSetupPage    from './pages/OnlineSetupPage';
import OnlineLobbyPage    from './pages/OnlineLobbyPage';
import OnlineGameplayPage from './pages/OnlineGameplayPage';

export default function App() {
  const phase = useGameStore(s => s.phase);
  const setPhase = useGameStore(s => s.setPhase);
  const [isMigrating, setIsMigrating] = useState(true);

  // Run IndexedDB migration on startup
  useEffect(() => {
    migrateLocalStorageToIndexedDB()
      .then(() => setIsMigrating(false))
      .catch((err) => {
        console.error('Migration failed:', err);
        // Continue anyway so app isn't permanently bricked, but warn
        setIsMigrating(false);
      });
  }, []);

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

  // Auto-navigate all players when server transitions room to 'playing'
  useEffect(() => {
    const unsub = useOnlineGameStore.subscribe((state, prevState) => {
      if (state.roomState === 'playing' && prevState.roomState !== 'playing') {
        const currentPhase = useGameStore.getState().phase;
        // Only navigate if we are already in the online flow
        if (currentPhase === 'online-lobby' || currentPhase === 'playing-sequence') {
          setPhase('online-gameplay');
        }
      }
    });
    return unsub;
  }, [setPhase]);

  if (isMigrating) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 text-white font-sans">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold text-gray-200">Optimizing Storage...</h2>
        <p className="text-gray-400 mt-2">Migrating media to IndexedDB</p>
      </div>
    );
  }

  switch (phase) {
    case 'landing':
      return <LandingPage />;

    case 'player-count':
    case 'player-setup':
      return <PlayerSetupPage />;

    case 'playing-sequence':
      return <PlayingSequencePage />;

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

    case 'online-setup':
      return <OnlineSetupPage />;

    case 'online-lobby':
      return <OnlineLobbyPage />;

    case 'online-gameplay':
      return <OnlineGameplayPage />;

    default:
      return <LandingPage />;
  }
}
