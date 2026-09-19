export type RateLimitStrategyType =
    | "token-bucket"
    | "sliding-window-log"
    | "sliding-window-counter" 
    | "fixed-window"
    | "leaky-bucket";