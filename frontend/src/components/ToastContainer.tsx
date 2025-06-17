import React from 'react';
import { useToast } from '../hooks/useToast';
import { Toast } from './ui/Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          onOpenChange={(open) => {
            if (!open) dismiss(toast.id);
          }}
        />
      ))}
    </>
  );
};