import winston from "winston";
import { resolve } from "path";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({
            filename: resolve("logs", "error.log"),
            level: "error",
            handleExceptions: true,
            handleRejections: true,
        }),
        new winston.transports.File({
            filename: resolve("logs", "combined.log"),
        }),
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
    ],
});

logger.on("error", (err) => {
    console.error(`Logger error: ${err.message}`);
});

export default logger;
