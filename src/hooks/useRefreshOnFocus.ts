import * as React from "react";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Hook that triggers a refetch when the screen comes into focus.
 * Includes proper error handling for async refetch operations.
 * Skips the initial mount to avoid double-fetching.
 */
export function useRefreshOnFocus(refetch: () => void | Promise<void>) {
  const enabledRef = React.useRef(false);
  const [error, setError] = React.useState<Error | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (enabledRef.current) {
        // Handle both sync and async refetch functions
        try {
          const result = refetch();
          // If refetch returns a promise, handle its errors
          if (result && typeof result.catch === 'function') {
            result.catch((err: unknown) => {
              const error = err instanceof Error ? err : new Error('Refresh on focus failed');
              setError(error);
              console.warn('useRefreshOnFocus: Refresh failed:', error.message);
            });
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Refresh on focus failed');
          setError(error);
          console.warn('useRefreshOnFocus: Refresh failed:', error.message);
        }
      } else {
        enabledRef.current = true;
      }
    }, [refetch]),
  );

  return { error, clearError: () => setError(null) };
}
