import { useEffect } from "react";
import { useLocation } from "wouter";

export function RedirectTo({ to }: { to: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(to);
  }, [to]);

  return null;
}