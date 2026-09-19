import { describe, expect, vi, it} from "vitest";
import { RateLimitMiddleWare } from "../middleware/RateLimitMiddleWare";
import { RateLimiterStrategy } from "../strategies/RateLimiterStrategy";


describe("RateLimitMiddleware", ()=>{

    it("allows the request when the strategy allows it", async ()=>{

        const strategy : RateLimiterStrategy = {
            isAllowed : vi.fn().mockResolvedValue({
                allowed : true,
                limit : 5,
                remaining : 4,
            })
            
        };

        const keyGenerator = vi.fn().mockReturnValue("user-123");
        const handler = vi.fn();
        const middleware= new RateLimitMiddleWare (strategy, keyGenerator, handler);
        const req= {} as any;

        const res = {
            setHeader : vi.fn(),
        }  as any ;

        const next= vi.fn();

        await middleware.handle(req, res, next);

        expect(keyGenerator).toHaveBeenCalled();
        expect(strategy.isAllowed).toHaveBeenCalledWith("user-123");
        expect(next).toHaveBeenCalled();
     });

     it("reject the request with 429 and proper payload wen the strategy denies it", async ()=> {

       const mockResult = {
          allowed : false,
          limit : 5,
          remaining : 0,
          retryAfterMs :60000,
       }

       const strategy  : RateLimiterStrategy = {
           isAllowed : vi.fn().mockResolvedValue(mockResult),
       }

        const keyGenerator = vi.fn().mockReturnValue("user-123");
       
        const middleware=new RateLimitMiddleWare(strategy, keyGenerator);
        const req = {} as any ;
        const res = {
            setHeader : vi.fn(),
            status : vi.fn().mockReturnThis(),
            json : vi.fn(),
        } as any ;

        const next = vi.fn();

        await middleware.handle(req, res, next);

       

        expect(keyGenerator).toHaveBeenCalled();
        expect(strategy.isAllowed).toHaveBeenCalledWith("user-123");
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(429);

        expect(res.json).toHaveBeenCalledWith({
            message : "Too many requests",
            retryAfterMs : 60000,
            limit : 5, 
            remaining:0,
        })

    })
})
