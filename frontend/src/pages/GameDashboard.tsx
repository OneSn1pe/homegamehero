import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame, useJoinGame, useUpdateChips, useAddRebuy, useEndGame } from '../hooks/useGame';
import { useGameStore } from '../store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Player } from '../types/game';
import { DollarSign, Users, Trophy, RefreshCw } from 'lucide-react';

export const GameDashboard: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isLeader, playerName, setPlayerName } = useGameStore();
  const { data: game, isLoading, error } = useGame(code || '');
  const joinGame = useJoinGame();
  const updateChips = useUpdateChips();
  const addRebuy = useAddRebuy();
  const endGame = useEndGame();

  const [joinName, setJoinName] = useState('');
  const [cashOutAmounts, setCashOutAmounts] = useState<Record<string, string>>({});
  const [rebuyAmounts, setRebuyAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error) {
      navigate('/');
    }
  }, [error, navigate]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !joinName.trim()) return;

    try {
      await joinGame.mutateAsync({ code, data: { playerName: joinName } });
      setPlayerName(joinName);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const handleCashOut = async (playerId: string) => {
    const amount = parseInt(cashOutAmounts[playerId]);
    if (!game || isNaN(amount)) return;

    try {
      await updateChips.mutateAsync({
        gameId: game._id,
        data: { playerId, cashOut: amount }
      });
      setCashOutAmounts({ ...cashOutAmounts, [playerId]: '' });
    } catch (error) {
      console.error('Failed to update chips:', error);
    }
  };

  const handleRebuy = async (playerId: string) => {
    const amount = parseInt(rebuyAmounts[playerId]) || game?.buyIn || 0;
    if (!game) return;

    try {
      await addRebuy.mutateAsync({
        gameId: game._id,
        data: { playerId, amount }
      });
      setRebuyAmounts({ ...rebuyAmounts, [playerId]: '' });
    } catch (error) {
      console.error('Failed to add rebuy:', error);
    }
  };

  const handleEndGame = async () => {
    if (!game || !window.confirm('Are you sure you want to end this game?')) return;

    try {
      await endGame.mutateAsync(game._id);
      navigate(`/game/${code}/results`);
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading game...</div>;
  }

  if (!game) {
    return <div className="text-center">Game not found</div>;
  }

  const isPlayerInGame = game.players.some(p => p.name === playerName);
  const needsToJoin = !isLeader && !isPlayerInGame;

  if (needsToJoin) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Join {game.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinGame} className="space-y-4">
              <Input
                placeholder="Your name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Join Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPot = game.players.reduce(
    (sum, p) => sum + p.buyIn + p.rebuys * (game.buyIn || 0), 
    0
  );

  const sortedPlayers = [...game.players].sort((a, b) => {
    const aChips = a.cashOut || 0;
    const bChips = b.cashOut || 0;
    return bChips - aChips;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pot</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPot}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{game.players.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buy-in</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${game.buyIn}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div key={player._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {index === 0 && player.cashOut && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {player.name}
                      {player.rebuys > 0 && (
                        <span className="text-sm text-gray-500">
                          ({player.rebuys} rebuy{player.rebuys > 1 ? 's' : ''})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Buy-in: ${player.buyIn + player.rebuys * game.buyIn}
                      {player.cashOut !== undefined && ` • Cash out: $${player.cashOut}`}
                    </p>
                  </div>
                  {isLeader && game.status === 'active' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRebuy(player._id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {isLeader && game.status === 'active' && !player.cashOut && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Cash out amount"
                      value={cashOutAmounts[player._id] || ''}
                      onChange={(e) => setCashOutAmounts({
                        ...cashOutAmounts,
                        [player._id]: e.target.value
                      })}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCashOut(player._id)}
                      disabled={!cashOutAmounts[player._id]}
                    >
                      Cash Out
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLeader && game.status === 'active' && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={handleEndGame}
            disabled={game.players.some(p => p.cashOut === undefined)}
          >
            End Game
          </Button>
        </div>
      )}
    </div>
  );
};