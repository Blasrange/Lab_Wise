"use client";

import { useState, useEffect, useRef } from "react";

// Para cambiar el tiempo, solo modifica este valor en milisegundos.
// Por ejemplo, para 10 minutos: 10 * 60 * 1000 = 600000
const IDLE_TIMEOUT_DURATION = 360000; // 6 minutos

const useIdleTimeout = (onIdle: () => void) => {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(onIdle, IDLE_TIMEOUT_DURATION);
  };

  const handleEvent = () => {
    resetTimer();
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleEvent);
    });

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [onIdle]);

  return null; // This hook does not render anything
};

export default useIdleTimeout;
