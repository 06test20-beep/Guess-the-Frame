import React, { useEffect, useState, useRef } from 'react';
import type { Player } from '../types';
import { AVATARS } from '../constants/game';
import AnimatedScore from './AnimatedScore';

interface Props {
  player: Player;
  rank: number;
  isJudge: boolean;
  onMinus: () => void;
  onPlus:  () => void;
}

export default function PlayerLeaderboardRow({ player, rank, isJudge, onMinus, onPlus }: Props) {
  const avatar   = AVATARS.find(a => a.id === player.avatarId);
  const rowClass = ['lb-row',
    rank === 1 ? 'lb-row--first' : '',
    isJudge    ? 'lb-row--judge' : '',
  ].join(' ');

  const prevScore = useRef(player.score);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (player.score > prevScore.current) {
      setFlashClass('score-flash-green');
      setTimeout(() => setFlashClass(''), 600);
    } else if (player.score < prevScore.current) {
      setFlashClass('score-flash-red');
      setTimeout(() => setFlashClass(''), 600);
    }
    prevScore.current = player.score;
  }, [player.score]);

  return (
    <div className={rowClass}>
      <span className="lb-row__rank">{rank}</span>

      {/* Avatar — photo takes priority over emoji */}
      {player.photoData ? (
        <img
          src={player.photoData}
          alt={player.name}
          className={`lb-row__avatar lb-row__avatar--photo ${isJudge ? 'lb-row__avatar--judge-pulse' : ''}`}
        />
      ) : (
        <div 
          className={`lb-row__avatar ${isJudge ? 'lb-row__avatar--judge-pulse' : ''}`} 
          style={{ background: avatar?.bgGradient }}
          role="img"
          aria-label={avatar?.label}
        >
          {avatar?.emoji}
        </div>
      )}

      <span className="lb-row__name" title={player.name}>
        {isJudge ? <span aria-hidden="true">⚖️ </span> : ''}{player.name}
      </span>

      <div className="lb-row__controls">
        <button className="lb-row__btn" onClick={onMinus} title={`−5 pts for ${player.name}`}>−</button>
        <button className="lb-row__btn" onClick={onPlus}  title={`+10 pts for ${player.name}`}>+</button>
      </div>

      {/* Animated score counter */}
      <AnimatedScore
        value={player.score}
        className={`lb-row__score ${flashClass} ${player.score < 0 ? 'lb-row__score--negative' : ''}`}
      />
    </div>
  );
}
