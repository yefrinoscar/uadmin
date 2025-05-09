"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Timer } from "lucide-react";



export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadTime, setLoadTime] = useState<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // Function to monitor page navigation start and end
  useEffect(() => {
    // Function to handle navigation start
    const handleNavigationStart = () => {
      setIsNavigating(true);
      startTimeRef.current = performance.now();
    };

    // Function to handle navigation end
    const handleNavigationEnd = () => {
      const endTime = performance.now();
      const elapsed = endTime - startTimeRef.current;
      setLoadTime(elapsed);
      setIsNavigating(false);
    };

    // Add event listeners for navigation
    if (typeof window !== 'undefined') {
      // Navigation started
      window.addEventListener('beforeunload', handleNavigationStart);
      window.addEventListener('popstate', handleNavigationStart);
      
      // Navigation completed
      window.addEventListener('load', handleNavigationEnd);
      
      // For clicks on anchor tags
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.href && !link.href.startsWith('#')) {
          handleNavigationStart();
          // Use setTimeout to allow the navigation end to be captured
          setTimeout(handleNavigationEnd, 50);
        }
      };
      
      document.addEventListener('click', handleClick);
      
      // Simulate initial page load completion
      if (startTimeRef.current === 0) {
        startTimeRef.current = performance.now() - 500; // Assume 500ms for first load
        setTimeout(handleNavigationEnd, 50);
      }
      
      return () => {
        window.removeEventListener('beforeunload', handleNavigationStart);
        window.removeEventListener('popstate', handleNavigationStart);
        window.removeEventListener('load', handleNavigationEnd);
        document.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 flex items-center gap-4 z-50">
      {isNavigating && (
        <div className="flex items-center gap-2 bg-primary/10 text-primary p-2 rounded-md animate-in fade-in slide-in-from-top-5 duration-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Cargando...</span>
        </div>
      )}
      <div className="flex items-center gap-2 bg-muted/50 text-foreground p-2 rounded-md">
        <Timer className="h-4 w-4" />
        <span className="text-xs font-medium">
          {loadTime > 1000 ? `${(loadTime / 1000).toFixed(2)}s` : `${loadTime.toFixed(0)}ms`}
        </span>
      </div>
    </div>
  );
}
