"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationState {
  isNavigating: boolean;
  currentPath: string;
  loadTime: number;
  isInitialLoad: boolean;
}

export function NavigationProgress() {
  const router = useRouter();
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    currentPath: pathname,
    loadTime: 0,
    isInitialLoad: true,
  });
  
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [averageLoadTime, setAverageLoadTime] = useState<number>(0);
  const loadTimesRef = useRef<number[]>([]);

  // Calculate average load time
  const updateAverageLoadTime = (newTime: number) => {
    loadTimesRef.current.push(newTime);
    // Keep only last 10 measurements
    if (loadTimesRef.current.length > 10) {
      loadTimesRef.current.shift();
    }
    const average = loadTimesRef.current.reduce((sum, time) => sum + time, 0) / loadTimesRef.current.length;
    setAverageLoadTime(average);
  };

  // Start navigation timing
  const startNavigation = () => {
    startTimeRef.current = performance.now();
    setNavigationState(prev => ({
      ...prev,
      isNavigating: true,
    }));
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // End navigation timing
  const endNavigation = () => {
    if (startTimeRef.current > 0) {
      const endTime = performance.now();
      const elapsed = endTime - startTimeRef.current;
      updateAverageLoadTime(elapsed);
      
      setNavigationState(prev => ({
        ...prev,
        isNavigating: false,
        loadTime: elapsed,
        isInitialLoad: false,
      }));
      
      startTimeRef.current = 0;
    }
  };

  // Monitor pathname changes (Next.js App Router navigation)
  useEffect(() => {
    if (navigationState.currentPath !== pathname) {
      // Navigation completed
      endNavigation();
      setNavigationState(prev => ({
        ...prev,
        currentPath: pathname,
      }));
    }
  }, [pathname, navigationState.currentPath]);

  // Intercept navigation events
  useEffect(() => {
    const handleRouteChange = () => {
      startNavigation();
    };

    // Override router methods to detect navigation start
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalForward = router.forward;

    router.push = (...args) => {
      handleRouteChange();
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      handleRouteChange();
      return originalReplace.apply(router, args);
    };

    router.back = () => {
      handleRouteChange();
      return originalBack.apply(router);
    };

    router.forward = () => {
      handleRouteChange();
      return originalForward.apply(router);
    };

    // Handle browser navigation (back/forward buttons)
    const handlePopState = () => {
      startNavigation();
    };

    window.addEventListener('popstate', handlePopState);

    // Handle link clicks for programmatic navigation detection
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        // Check if it's an internal navigation
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          // Add a small delay to ensure the navigation starts
          setTimeout(handleRouteChange, 10);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    // Handle initial page load
    if (navigationState.isInitialLoad) {
      startTimeRef.current = performance.now() - 200; // Assume some initial load time
      // Simulate initial load completion
      timeoutRef.current = setTimeout(() => {
        endNavigation();
      }, 100);
    }

    return () => {
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
      router.forward = originalForward;

      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router, pathname, navigationState.isInitialLoad]);

  const formatTime = (time: number): string => {
    if (time > 1000) {
      return `${(time / 1000).toFixed(2)}s`;
    }
    return `${Math.round(time)}ms`;
  };

  const getLoadingMessage = (): string => {
    const messages = [
      "Cargando página...",
      "Preparando contenido...",
      "Casi listo...",
      "Finalizando..."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getPerformanceColor = (time: number): string => {
    if (time < 200) return "text-green-600";
    if (time < 500) return "text-yellow-600";
    if (time < 1000) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
      {/* Loading indicator */}
      {navigationState.isNavigating && (
        <div className={cn(
          "flex items-center gap-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
          "border border-gray-200/50 dark:border-gray-700/50 text-foreground",
          "px-4 py-3 rounded-lg shadow-lg",
          "animate-in fade-in slide-in-from-top-5 duration-300"
        )}>
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{getLoadingMessage()}</span>
            {averageLoadTime > 0 && (
              <span className="text-xs text-muted-foreground">
                Promedio: {formatTime(averageLoadTime)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Performance indicator */}
      {!navigationState.isNavigating && navigationState.loadTime > 0 && (
        <div className={cn(
          "flex items-center gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
          "border border-gray-200/50 dark:border-gray-700/50",
          "px-3 py-2 rounded-lg shadow-md"
        )}>
          <div className="flex items-center gap-2">
            {navigationState.loadTime < 300 ? (
              <Zap className="h-4 w-4 text-green-600" />
            ) : (
              <Timer className="h-4 w-4 text-gray-600" />
            )}
            <div className="flex flex-col">
              <span className={cn("text-sm font-medium", getPerformanceColor(navigationState.loadTime))}>
                {formatTime(navigationState.loadTime)}
              </span>
              {averageLoadTime > 0 && averageLoadTime !== navigationState.loadTime && (
                <span className="text-xs text-muted-foreground">
                  Avg: {formatTime(averageLoadTime)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
