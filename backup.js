import cron from "node-cron";
import { resolve } from "path";
import { copyFile } from "fs/promises";
import logger from "./logger.js";

const backupDb = async () => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = resolve("backups", `posts-${timestamp}.db`);
        await copyFile(resolve("db", "posts.db"), backupPath);
        logger.info(`Database backed up to ${backupPath}`);
    } catch (error) {
        logger.error(`Backup failed: ${error.message}`);
    }
};

// Schedule daily backups at midnight
cron.schedule("0 0 * * *", backupDb);

logger.info("Backup scheduler started");
