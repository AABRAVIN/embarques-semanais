import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

export function InactivityWatcher() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutRef = useRef(signOut);

  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      await signOutRef.current();
      navigate("/login", { replace: true });
    }, INACTIVITY_TIMEOUT);
  }, [navigate]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "wheel",
    ];

    const handleActivity = () => resetTimer();

    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  return null;
}
