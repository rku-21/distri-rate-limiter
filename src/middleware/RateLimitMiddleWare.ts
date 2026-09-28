import { NextFunction,Request,Response } from "express";
import  {RateLimiterStrategy} from "../strategies/RateLimiterStrategy"
import { keyGenerator } from "../types/keyGenerator";
import { handler } from "../types/customHandler";

export class RateLimitMiddleWare {

    constructor (

        private readonly Limiter:RateLimiterStrategy,
        private readonly failureMode: string,
        private readonly keyGenerator?:keyGenerator,
        private readonly handler?:handler,
       
    ){
        this.handle=this.handle.bind(this);
    }

    async handle(   
        req:Request,
        res:Response,
        next:NextFunction,
    ): Promise<void> {

    try {
        const identifier=this.keyGenerator?.(req) ?? req.ip!;

        const result=await this.Limiter.isAllowed(identifier);

        res.setHeader("RateLimit-Limit", String(result.limit));
        res.setHeader("RateLimit-Remaining", String(result.remaining));
        if (result.retryAfterMs !== undefined) {
            res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs)));
            res.setHeader("RateLimit-Reset", String(Date.now() + result.retryAfterMs));
        }
        res.setHeader(
            "Access-Control-Expose-Headers",
            "RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After",
        );

       
        if(!result.allowed){

            if(this.handler){
                return this.handler(req,res,result);
            }
             res.status(429).json({
                message:"Too many requests",
                retryAfterMs:result.retryAfterMs,
                limit: result.limit,
                remaining: result.remaining,
            })
            return;
        }
        next();
    }catch(error){
        if(this.failureMode === "open"){
            return next();

        }
         res.status(503).json({
            error :"Rate Limiter unavailable",
         })
         return;



    }

    }


}