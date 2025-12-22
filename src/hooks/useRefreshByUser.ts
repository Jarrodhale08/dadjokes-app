import * as React from "react";

/**
 * Hook for handling user-initiated refresh actions with proper error handling.
 * Wraps a refetch function with loading state and error management.
 */
export function useRefreshByUser(refetch: () => Promise<unknown>) {
  const [isRefetchingByUser, setIsRefetchingByUser] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  async function refetchByUser() {
    setIsRefetchingByUser(true);
    setError(null);

    try {
      await refetch();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Refresh failed');
      setError(error);
      console.warn('useRefreshByUser: Refresh failed:', error.message);
    } finally {
      setIsRefetchingByUser(false);
    }
  }

  return {
    isRefetchingByUser,
    refetchByUser,
    error,
    clearError: () => setError(null),
  };
}
