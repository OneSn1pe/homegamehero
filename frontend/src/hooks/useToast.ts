import { useToastStore } from '../store/toastStore';

export const useToast = () => {
  const { addToast, removeToast, toasts } = useToastStore();

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
  };
};