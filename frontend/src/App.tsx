import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, ToastViewport } from './components/ui/Toast';
import { ToastContainer } from './components/ToastContainer';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CreateGamePage } from './pages/CreateGamePage';
import { GameDashboard } from './pages/GameDashboard';
import { GameResults } from './pages/GameResults';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="create-game" element={<CreateGamePage />} />
              <Route path="game/:code" element={<GameDashboard />} />
              <Route path="game/:code/results" element={<GameResults />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastViewport />
        <ToastContainer />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;