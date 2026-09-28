import {describe , it ,expect , vi} from "vitest";
import {RateLimitMiddleWare} from "../middleware/RateLimitMiddleWare";

describe("RateLimitMiddleware - failure Modes", ()=>{

    it("should fail-open when rate limiter throws an error", async()=>{
        const strategy = {
            isAllowed : vi.fn().mockRejectedValue(
                new Error("redis unavailable")
            ),
        };

        const middleware = new RateLimitMiddleWare(
            strategy as any,
            "open",
            ()=> "user-1",
            undefined,
        );

        const req = {} as any;

        const res= {
            status : vi.fn().mockReturnThis(),
            json : vi.fn(),
            setHeader  :vi.fn(),


        } as any ;

        const next = vi.fn();

        await middleware.handle(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalledWith(503);


    });

    it("should fail-closed when rate limiter throws an error", async ()=>{

        const strategy = {
            isAllowed  : vi.fn().mockRejectedValue(
                new Error("reids unavailable")
            ),
        };

        const middleware = new RateLimitMiddleWare(
            strategy as any, 
            "closed",
            ()=> "user-1",
            undefined,
        );
        

        const req= {} as any;

        const res = {
            status : vi.fn().mockReturnThis(),
            json : vi.fn(),
            setHeader : vi.fn(),
        } as any;

        const next = vi.fn();

        await middleware.handle(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            error : "Rate Limiter unavailable",
        });

        expect(next).not.toHaveBeenCalled();
    })
});  
