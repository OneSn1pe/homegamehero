import React from 'react';
import { Outlet } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { currentGameCode, clearGame } = useGameStore();

  const handleLeaveGame = () => {
    clearGame();
    localStorage.removeItem('leaderToken');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 
                className="text-xl font-bold text-primary-600 cursor-pointer"
                onClick={() => navigate('/')}
              >
                Home Game Hero
              </h1>
              {currentGameCode && (
                <span className="ml-4 text-sm text-gray-600">
                  Game Code: <span className="font-mono font-bold">{currentGameCode}</span>
                </span>
              )}
            </div>
            {currentGameCode && (
              <Button variant="outline" size="sm" onClick={handleLeaveGame}>
                Leave Game
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};