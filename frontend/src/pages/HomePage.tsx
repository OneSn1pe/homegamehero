import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useGameStore } from '../store/gameStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const { setCurrentGame } = useGameStore();

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.trim()) {
      setCurrentGame(gameCode.toUpperCase(), false);
      navigate(`/game/${gameCode.toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Home Game Hero</h1>
        <p className="text-lg text-gray-600">Organize your poker games with ease</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Game</CardTitle>
            <CardDescription>Start a new poker game as the organizer</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/create-game')}
            >
              Create Game
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join Existing Game</CardTitle>
            <CardDescription>Enter a game code to join as a player</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinGame} className="space-y-4">
              <Input
                placeholder="Enter game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono"
              />
              <Button type="submit" className="w-full" size="lg">
                Join Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};