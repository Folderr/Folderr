/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 Folderr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * @fileoverview Handle the database file deletion queue
 */

import process from "process";
import DbQueue from "./Structures/Utilities/db-queue.js";
import { logger } from "./internals.js";

const queuer = new DbQueue();

let stopped = false;

process.env.NODE_ENV = "production";
logger.info("HEY");
// if (process.send) process.send("Hello World");

process.on("message", ({ msg, data }) => {
	if (msg === "add" && !stopped && typeof data === "string") {
		queuer.add(data);
	} else
		switch (msg) {
			case "check": {
				if (process.send) {
					process.send({ msg: { onGoing: queuer.onGoing, stopped } });
				}

				break;
			}

			case "shutdown": {
				stopped = true;
				if (!queuer.onGoing) process.exit(1);
				queuer.once("stopped", () => {
					process.exit(1);
				});

				break;
			}

			case "stop": {
				stopped = true;

				break;
			}
			// No default
		}
});
