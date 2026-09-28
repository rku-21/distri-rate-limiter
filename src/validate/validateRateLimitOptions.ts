import { openSync } from "node:fs";
import { RateLimiterOptions } from "../config/RateLimitOptions";
import { error } from "node:console";

export function validateRateLimitOptions (options : RateLimiterOptions): void {

    if(!options){
        throw new Error("Rate Limit options are required");
    }
    if(options.failureMode !=undefined && options.failureMode != "open" && options.failureMode !== "closed"){
            throw new Error('failure mode must be either "open" or "closed"');
        }

    switch(options.strategy) {

      

        case "token-bucket":
            if(options.capacity <=0){
                throw new Error("capacity must be greater than 0");
            }

            if(options.refillRatePerSecond <0){
                throw new Error("refillRate cannot be negative");
            }

            break;
        
        case "leaky-bucket" :
            if(options.capacity <=0){
                throw new Error("capacity must be greater than 0");
            }

            if(options.leakRatePerSecond <0){
                throw new Error("leakRate cannot be negative");
            }

            break;
        
        case "fixed-window":
        case "sliding-window-counter":
        case "sliding-window-log":
            if(options.capacity <=0){
                throw new Error("capacity must be greater than 0");
            }
            if(options.windowSizeMs <=0){
                throw new Error("windowSizeMs must be greater than 0");
            }

            break;

        
        
        default:
            throw new Error(`Unsupported strategy`);
        
        
        


    }
}