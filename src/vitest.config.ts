import { deflate } from "node:zlib";
import {defineConfig} from "vitest/config";

const  config= defineConfig({
    test : {
        environment: "node",
        include : ["src/**/*.test.ts"],
        coverage :{
            provider : "v8",
            reporter :["text", "html"],
        },
        exclude :["dist/**", "node_modules/**"],
    },

});

export default config;