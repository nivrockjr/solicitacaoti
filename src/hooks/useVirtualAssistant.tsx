
import { useState } from 'react';

export const useVirtualAssistant = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsVisible(true);
    } else {
      setIsMinimized(true);
    }
  };

  const hide = () => {
    setIsVisible(false);
    setIsMinimized(true);
  };

  const show = () => {
    setIsVisible(true);
    setIsMinimized(false);
  };

  return {
    isVisible,
    isMinimized,
    toggleVisibility,
    toggleMinimize,
    hide,
    show
  };
};
