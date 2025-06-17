import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { useToast } from './useToast';

export const useSocket = (gameCode?: string) => {
  const queryClient = useQueryClient();
  const { playerName } = useGameStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!gameCode) return;

    // Connect to socket
    socketService.connect(gameCode, playerName || undefined);

    // Listen for game updates
    const handleGameUpdate = (data: any) => {
      console.log('Game update received:', data);
      // Invalidate game query to refetch latest data
      queryClient.invalidateQueries({ queryKey: ['game', gameCode] });
    };

    const handlePlayerJoined = (data: any) => {
      console.log('Player joined:', data.playerName);
      if (data.playerName && data.playerName !== playerName) {
        toast({
          title: 'Player Joined',
          description: `${data.playerName} joined the game`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['game', gameCode] });
    };

    const handlePlayerLeft = (data: any) => {
      console.log('Player left:', data.playerName);
      if (data.playerName && data.playerName !== playerName) {
        toast({
          title: 'Player Left',
          description: `${data.playerName} left the game`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['game', gameCode] });
    };

    const handleUpdateRequested = () => {
      // Another client requested an update, refetch
      queryClient.invalidateQueries({ queryKey: ['game', gameCode] });
    };

    socketService.on('game_update', handleGameUpdate);
    socketService.on('player_joined', handlePlayerJoined);
    socketService.on('player_left', handlePlayerLeft);
    socketService.on('update_requested', handleUpdateRequested);

    return () => {
      socketService.off('game_update', handleGameUpdate);
      socketService.off('player_joined', handlePlayerJoined);
      socketService.off('player_left', handlePlayerLeft);
      socketService.off('update_requested', handleUpdateRequested);
      socketService.disconnect();
    };
  }, [gameCode, playerName, queryClient]);

  return {
    requestUpdate: () => socketService.requestUpdate()
  };
};