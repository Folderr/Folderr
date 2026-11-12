import type DBClass from "../Database/db-class.js";
import logger from "../logger.js";

export async function tokenPurger(db: DBClass): Promise<void> {
	const purge = async () => {
		try {
			logger.debug("DB Maintenance - Deleting expired tokens");
			const count = await db.purgeExpiredTokens();
			logger.info(`DB Maintenance - Deleted ${count} expired tokens`);
		} catch (error) {
			if (
				!(
					error instanceof Error &&
					error.message.startsWith("DB > NOT IMPLEMENTED")
				)
			) {
				logger.error(error);
			}
		}
	};
	await purge();
	const HOUR = 60 * 60 * 1000; // An hour, in milliseconds
	setInterval(purge, HOUR).unref();
}
