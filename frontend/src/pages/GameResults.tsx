import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

export const GameResults: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: game, isLoading } = useGame(code || '');

  if (isLoading) {
    return <div className="text-center">Loading results...</div>;
  }

  if (!game || game.status !== 'ended') {
    return <div className="text-center">Game not found or not ended</div>;
  }

  const playerStats = game.players.map(player => {
    const totalBuyIn = player.buyIn + player.rebuys * game.buyIn;
    const cashOut = player.cashOut || 0;
    const profit = cashOut - totalBuyIn;
    const profitPercentage = totalBuyIn > 0 ? (profit / totalBuyIn) * 100 : 0;

    return {
      ...player,
      totalBuyIn,
      cashOut,
      profit,
      profitPercentage,
    };
  }).sort((a, b) => b.profit - a.profit);

  const winners = playerStats.filter(p => p.profit > 0);
  const losers = playerStats.filter(p => p.profit < 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Game Results</h1>
        <p className="text-gray-600">{game.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {winners.map((player, index) => (
                <div key={player._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+${player.profit}</div>
                    <div className="text-sm text-gray-500">
                      +{player.profitPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Losers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {losers.map((player) => (
                <div key={player._id} className="flex items-center justify-between">
                  <span className="font-medium">{player.name}</span>
                  <div className="text-right">
                    <div className="font-bold text-red-600">${player.profit}</div>
                    <div className="text-sm text-gray-500">
                      {player.profitPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {game.payouts && game.payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Venmo Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {game.payouts.map((payout, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{payout.from}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span>{payout.to}</span>
                  </div>
                  <span className="font-bold">${payout.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={() => navigate('/')}>
          Start New Game
        </Button>
      </div>
    </div>
  );
};