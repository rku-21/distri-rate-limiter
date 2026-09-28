
import { RateLimiterOptions } from "./config/RateLimitOptions";
import { StrategyFactory } from "./Factory/strategyFactory";
import { RateLimitMiddleWare } from "./middleware/RateLimitMiddleWare";
import { MemoryStore } from "./store/MemoryStore";
import { validateRateLimitOptions } from "./validate/validateRateLimitOptions";

export function rateLimit (options : RateLimiterOptions){

    try {
        validateRateLimitOptions(options);  

       const store=options.store ?? new MemoryStore();
       const strategy=StrategyFactory.create(options,store);

       const rateLimitMiddleware=new RateLimitMiddleWare(
        strategy,
        options.failureMode ?? "closed",
        options.keyGenerator,
        options.handler,
       
       )

    
       return  rateLimitMiddleware.handle;
    }
    catch(error: unknown){
        
        throw error;
    }
}