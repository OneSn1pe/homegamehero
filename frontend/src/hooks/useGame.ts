import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { API_ENDPOINTS } from '../config/api';
import { 
  Game, 
  CreateGameData, 
  JoinGameData, 
  UpdateChipsData, 
  AddRebuyData 
} from '../types/game';

export const useCreateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateGameData) => {
      const response = await apiClient.post<{ game: Game; leaderToken: string }>(
        API_ENDPOINTS.games,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('leaderToken', data.leaderToken);
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
};

export const useGame = (code: string) => {
  return useQuery({
    queryKey: ['game', code],
    queryFn: async () => {
      const response = await apiClient.get<Game>(`${API_ENDPOINTS.games}/${code}`);
      return response.data;
    },
    enabled: !!code,
    // Remove polling - WebSocket will handle updates
    refetchOnWindowFocus: true,
  });
};

export const useJoinGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ code, data }: { code: string; data: JoinGameData }) => {
      const response = await apiClient.post<Game>(
        `${API_ENDPOINTS.games}/${code}/join`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', variables.code] });
    },
  });
};

export const useUpdateChips = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ gameId, data }: { gameId: string; data: UpdateChipsData }) => {
      const response = await apiClient.put<Game>(
        `${API_ENDPOINTS.games}/${gameId}/chips`,
        data
      );
      return response.data;
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ['game', game.code] });
    },
  });
};

export const useAddRebuy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ gameId, data }: { gameId: string; data: AddRebuyData }) => {
      const response = await apiClient.post<Game>(
        `${API_ENDPOINTS.games}/${gameId}/rebuy`,
        data
      );
      return response.data;
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ['game', game.code] });
    },
  });
};

export const useEndGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gameId: string) => {
      const response = await apiClient.post<Game>(
        `${API_ENDPOINTS.games}/${gameId}/end`
      );
      return response.data;
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ['game', game.code] });
    },
  });
};