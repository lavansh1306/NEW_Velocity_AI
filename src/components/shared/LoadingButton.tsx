import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import SyncOutlined from '@mui/icons-material/SyncOutlined';

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
    isLoading?: boolean;
    loadingText?: string;
    /** Simulate async operation for prototype (ms). 0 = use external isLoading control. */
    simulateMs?: number;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children: React.ReactNode;
}

/**
 * Button with loading spinner, disabled state during submission, and double-click prevention.
 * For prototype use: set `simulateMs` to auto-show loading state for N ms then call onClick.
 */
export const LoadingButton = ({
    isLoading: externalLoading,
    loadingText,
    simulateMs = 0,
    onClick,
    children,
    disabled,
    ...props
}: LoadingButtonProps) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const isLoading = externalLoading || internalLoading;

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (isLoading) return;

            if (simulateMs > 0) {
                setInternalLoading(true);
                setTimeout(() => {
                    setInternalLoading(false);
                    onClick?.(e);
                }, simulateMs);
            } else {
                onClick?.(e);
            }
        },
        [isLoading, simulateMs, onClick]
    );

    return (
        <Button
            {...props}
            disabled={disabled || isLoading}
            onClick={handleClick}
            aria-busy={isLoading}
        >
            {isLoading ? (
                <>
                    <SyncOutlined
                        style={{ fontSize: 16 }}
                        className="mr-2 animate-spin"
                    />
                    {loadingText || children}
                </>
            ) : (
                children
            )}
        </Button>
    );
};
