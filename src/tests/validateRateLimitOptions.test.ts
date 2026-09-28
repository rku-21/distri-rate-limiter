import { describe, expect, it } from "vitest";
import { validateRateLimitOptions } from "../validate/validateRateLimitOptions";

describe("validateRateLimitOptions", () => {

    it("accepts an open failure mode", () => {
        expect(() => validateRateLimitOptions({
            strategy: "token-bucket",
            capacity: 10,
            refillRatePerSecond: 2,
            failureMode: "open",
        })).not.toThrow();
    });

    it("accepts a closed failure mode", () => {
        expect(() => validateRateLimitOptions({
            strategy: "token-bucket",
            capacity: 10,
            refillRatePerSecond: 2,
            failureMode: "closed",
        })).not.toThrow();
    });

    it("rejects an invalid failure mode", () => {
        expect(() => validateRateLimitOptions({
            strategy: "token-bucket",
            capacity: 10,
            refillRatePerSecond: 2,
            failureMode: "invalid",
        } as never)).toThrow('failure mode must be either "open" or "closed"');
    });

    it("accept the valid token-bucket options", () => {

        expect(() => {
            return validateRateLimitOptions({
                strategy: "token-bucket",
                capacity: 10,
                refillRatePerSecond: 2,
            })

        }).not.toThrow();
    });

    it("rejects zero token-bucket capacity", () => {

        expect(() => {
            return validateRateLimitOptions({
                strategy: "token-bucket",
                capacity: 0,
                refillRatePerSecond: 3,
            })
        }).toThrow("capacity must be greater than 0");
    });

    it("rejects negative token-bucket capacity", () => {

        expect(() => {
            return validateRateLimitOptions({
                strategy: "token-bucket",
                capacity: -1,
                refillRatePerSecond: 3,
            })
        }).toThrow("capacity must be greater than 0");
    });

    it("accept zero token-bucket refill rate", () => {

        expect(() => {
            return validateRateLimitOptions({
                strategy: "token-bucket",
                capacity: 10,
                refillRatePerSecond: 0,
            })
        }).not.toThrow();
    });

    it("accepts valid leaky bucket options", () => {

        expect(() =>
            validateRateLimitOptions({
                strategy: "leaky-bucket",
                capacity: 10,
                leakRatePerSecond: 2,
            })
        ).not.toThrow();
    });

    it("rejects invalid leaky bucket capacity", () => {
        expect(() =>
            validateRateLimitOptions({
                strategy: "leaky-bucket",
                capacity: 0,
                leakRatePerSecond: 2,
            })
        ).toThrow("capacity must be greater than 0");
    });

    it("rejects negative leak rate", () => {
        expect(() =>
            validateRateLimitOptions({
                strategy: "leaky-bucket",
                capacity: 10,
                leakRatePerSecond: -1,
            })
        ).toThrow(
            "leakRate cannot be negative"
        );
    });

    it("accepts valid fixed window options", () => {
        expect(() =>
            validateRateLimitOptions({
                strategy: "fixed-window",
                capacity: 10,
                windowSizeMs: 1000,
            })
        ).not.toThrow();
    });

    it("rejects zero capacity option", () => {
        expect(() =>
            validateRateLimitOptions({
                strategy: "fixed-window",
                capacity: 0,
                windowSizeMs: 1000,
            })
        ).toThrow("capacity must be greater than 0");
    });

    it("rejects zero window size", () => {
        expect(() =>
            validateRateLimitOptions({
                strategy: "fixed-window",
                capacity: 10,
                windowSizeMs: 0,
            })
        ).toThrow("windowSizeMs must be greater than 0");
    });

    it("rejects negative window size", () => {
        expect(() =>
            validateRateLimitOptions({
                strategy: "fixed-window",
                capacity: 10,
                windowSizeMs: -1000,
            })
        ).toThrow("windowSizeMs must be greater than 0");
    });


    it("accepts valid sliding window log options", ()=>{

        expect(()=>{
            return validateRateLimitOptions({
                strategy : "sliding-window-log",
                capacity: 100,
                windowSizeMs: 1000,
            })
        }).not.toThrow();
    });

    it("reject zero capacity option", ()=>{

        expect(()=>{
            return validateRateLimitOptions({
                strategy : "sliding-window-log",
                capacity: 0,
                windowSizeMs: 1000,
            })
        }).toThrow("capacity must be greater than 0");
    });

    it("reject negative capacity option" , ()=>{

        expect (()=>{
            return validateRateLimitOptions({
                strategy : "sliding-window-log",
                capacity : -1, 
                windowSizeMs : 1000,
            })
        }).toThrow("capacity must be greater than 0");
    });

    it("reject zero windowSizeMs",()=>{

        expect(()=>{
            return validateRateLimitOptions({
                strategy :"sliding-window-log",
                capacity : 10,
                windowSizeMs : 0,
            })
        }).toThrow("windowSizeMs must be greater than 0");
    });

    it("rejects negative windowSizeMs", ()=>{
        
        expect(()=>{
            return validateRateLimitOptions({
            strategy : "sliding-window-log",
            capacity : 10, 
            windowSizeMs : -1000,
            })
        }).toThrow("windowSizeMs must be greater than 0")
    })

     it("accepts valid sliding window counter options", ()=>{

        expect(()=>{
            return validateRateLimitOptions({
                strategy : "sliding-window-counter",
                capacity: 100,
                windowSizeMs: 1000,
            })
        }).not.toThrow();
    });

    it("reject zero capacity option", ()=>{

        expect(()=>{
            return validateRateLimitOptions({
                strategy : "sliding-window-counter",
                capacity: 0,
                windowSizeMs: 1000,
            })
        }).toThrow("capacity must be greater than 0");
    });

    it("reject negative capacity option" , ()=>{

        expect (()=>{
            return validateRateLimitOptions({
                strategy : "sliding-window-counter",
                capacity : -1, 
                windowSizeMs : 1000,
            })
        }).toThrow("capacity must be greater than 0");
    });

    it("reject zero windowSizeMs",()=>{

        expect(()=>{
            return validateRateLimitOptions({
                strategy :"sliding-window-counter",
                capacity : 10,
                windowSizeMs : 0,
            })
        }).toThrow("windowSizeMs must be greater than 0");
    });

    it("rejects negative windowSizeMs", ()=>{
        
        expect(()=>{
            return validateRateLimitOptions({
            strategy : "sliding-window-counter",
            capacity : 10, 
            windowSizeMs : -1000,
            })
        }).toThrow("windowSizeMs must be greater than 0")
    })
});












