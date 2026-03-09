import { useState, useEffect } from 'react';

/**
 * Hook to simulate a loading state for a specified duration.
 * Returns [isLoading, setIsLoading] — loading auto-clears after `durationMs`.
 */
export const useSimulatedLoading = (durationMs: number = 600): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, durationMs);

        return () => clearTimeout(timer);
    }, [durationMs]);

    return [isLoading, setIsLoading];
};
