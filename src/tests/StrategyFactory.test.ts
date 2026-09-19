import { describe, expect, it} from "vitest";
import { StrategyFactory } from "../Factory/strategyFactory";
import { TokenBucketLimiter } from "../strategies/TokenBucketLimiter";
import { RateLimiterStore} from "../store/RateLimiterStore";
import { SlidingWindowCounter } from "../strategies/SlidingWindowCounterLimiter";
import { SlidingWindowLogLimiter } from "../strategies/SlidingWindowLogLimiter";
import { FixedWindowLimiter } from "../strategies/FixedWindowLimiter";
import { LeakyBucketLimiter } from "../strategies/LeakyBucketLimiter";


describe("Strategy Factory", async()=>{

    let store= {} as RateLimiterStore;

    it("creates TokenBucketLimiter", ()=>{

        const strategy=StrategyFactory.create({
            strategy : "token-bucket",
            capacity :10,
            refillRatePerSecond : 2,
        },
        store, 
       ) 
       
       expect(strategy).toBeInstanceOf(TokenBucketLimiter);
    });

    it("creates LeakyBucketLimiter", ()=>{

        const strategy=StrategyFactory.create({
            strategy: "leaky-bucket",
            capacity:10, 
            leakRatePerSecond:2
          },
           store,
       );
       expect(strategy).toBeInstanceOf(LeakyBucketLimiter);

    });

    it("creates fixedWindowLimiter", ()=>{

        const strategy = StrategyFactory.create(
          {
            strategy : "fixed-window",
            capacity  :10,
            windowSizeMs : 1000,
          },
          store
       );
       expect(strategy).toBeInstanceOf(FixedWindowLimiter);
        
    });


    it("creates sliding window log",()=>{

        const strategy=StrategyFactory.create(
            {
                strategy : "sliding-window-log",
                capacity : 10,
                windowSizeMs : 1000,
            },
            store,
        );
        expect(strategy).toBeInstanceOf(SlidingWindowLogLimiter);
    })

    it("creates sliding window counter", async ()=>{
        const strategy=StrategyFactory.create(
            {
                strategy : "sliding-window-counter",
                capacity : 10,
                windowSizeMs : 1000,
            },
            store,
        )

        expect(strategy).toBeInstanceOf(SlidingWindowCounter);
    });
})