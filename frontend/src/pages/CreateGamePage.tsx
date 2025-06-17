import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useCreateGame } from '../hooks/useGame';
import { useGameStore } from '../store/gameStore';
import { ChipValue } from '../types/game';
import { Trash2, Plus } from 'lucide-react';

interface FormData {
  name: string;
  buyIn: number;
}

const DEFAULT_CHIPS: ChipValue[] = [
  { value: 1, color: 'White', quantity: 100 },
  { value: 5, color: 'Red', quantity: 100 },
  { value: 25, color: 'Green', quantity: 50 },
  { value: 100, color: 'Black', quantity: 25 },
];

export const CreateGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [chips, setChips] = useState<ChipValue[]>(DEFAULT_CHIPS);
  const createGame = useCreateGame();
  const { setCurrentGame } = useGameStore();

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createGame.mutateAsync({
        name: data.name,
        buyIn: data.buyIn,
        chipValues: chips.filter(chip => chip.quantity > 0),
      });
      
      setCurrentGame(result.game.code, true);
      navigate(`/game/${result.game.code}`);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const updateChip = (index: number, field: keyof ChipValue, value: any) => {
    const newChips = [...chips];
    newChips[index] = { ...newChips[index], [field]: value };
    setChips(newChips);
  };

  const removeChip = (index: number) => {
    setChips(chips.filter((_, i) => i !== index));
  };

  const addChip = () => {
    setChips([...chips, { value: 0, color: '', quantity: 0 }]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>Set up your poker game configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Game Name</label>
              <Input
                {...register('name', { required: 'Game name is required' })}
                placeholder="Friday Night Poker"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Buy-in Amount ($)</label>
              <Input
                type="number"
                {...register('buyIn', { 
                  required: 'Buy-in amount is required',
                  min: { value: 1, message: 'Buy-in must be at least $1' }
                })}
                placeholder="50"
              />
              {errors.buyIn && (
                <p className="text-red-500 text-sm mt-1">{errors.buyIn.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Chip Values</label>
                <Button type="button" variant="outline" size="sm" onClick={addChip}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Chip
                </Button>
              </div>
              <div className="space-y-2">
                {chips.map((chip, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Value"
                      value={chip.value || ''}
                      onChange={(e) => updateChip(index, 'value', parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Input
                      placeholder="Color"
                      value={chip.color}
                      onChange={(e) => updateChip(index, 'color', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={chip.quantity || ''}
                      onChange={(e) => updateChip(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChip(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createGame.isPending}
              >
                {createGame.isPending ? 'Creating...' : 'Create Game'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};