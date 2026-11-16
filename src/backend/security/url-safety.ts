import type { JTDSchemaType } from "ajv/dist/jtd.js";
import AJV from "ajv/dist/jtd.js";
import type { LookupAddress, LookupOptions } from "dns";
import { Resolver } from "dns";
import type { Options } from "got";
import { BlockList, isIP } from "net";
import type Core from "../Structures/core.js";

export function isIPHost(rawUrl: string): boolean {
	const { hostname } = new URL(rawUrl); // Throws with invalid URL
	return isIP(hostname.replace(/^\[|\]$/g, "")) !== 0;
}

const resolver = new Resolver({ timeout: 2000, tries: 2 });
resolver.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8"]);
const ipBlocklist = new BlockList();

for (const [address, prefix] of [
	["0.0.0.0", 8], // The machines network
	["10.0.0.0", 8], // Private network
	["100.64.0.0", 10], // CGNat
	["127.0.0.0", 8], // Local. Why even would you bother?
	["169.254.0.0", 16], // Link-local
	["172.16.0.0", 12], // RFC1918, used by docker, vpns, virtual nets, etc
	["192.0.0.0", 24], // IETF protocol assignment
	["192.168.0.0", 16], // LAN
	["198.18.0.0", 15], // Network testing
	["224.0.0.0", 4], // Multicast
	["240.0.0.0", 4], // Otherwise reserved
] as const) {
	ipBlocklist.addSubnet(address, prefix, "ipv4");
}

for (const [address, prefix] of [
	["::", 128], // Unspecified
	["::1", 128], // Local
	["fc00::", 7], // Unique local
	["fe80::", 10], // Link-local
	["ff00::", 8], // Multicast
	["64:ff9b::", 96], // IPv4 map
	["2002::", 16], // IPv4 map
] as const) {
	ipBlocklist.addSubnet(address, prefix, "ipv6");
}

type MirrorResponse = {
	message: {
		res: string;
	};
};

const ajv = new AJV();

const msgschema: JTDSchemaType<MirrorResponse["message"]> = {
	properties: {
		res: { type: "string" },
	},
};

const mirrorschema: JTDSchemaType<MirrorResponse> = {
	properties: {
		message: msgschema,
	},
};

const mirrorparse = ajv.compileParser(mirrorschema);

export async function testMirrorURL(
	got: Core["got"],
	url: string,
): Promise<boolean> {
	try {
		if (isIPHost(url)) return false;
		const test = await got.get<MirrorResponse>(`${url}/api`, {
			// We can't wait forever to send a response
			responseType: "json",
			parseJson: mirrorparse,
			lookup: noPrivateDnsLookup as unknown as Options["lookup"],
			maxRedirects: 1, // In case of HTTP to HTTPS upgrade
			hooks: {
				beforeRedirect: [
					(options) => {
						if (isIPHost(options.url.href)) {
							throw new Error("URL DISALLOWED");
						}
					},
				],
			},
			timeout: 1000,
			retry: 1,
		});
		if (!test?.body) {
			return false;
		}

		return test.body.message.res === "Pong! Mirror Operational!";
	} catch {
		return false;
	}
}

export function noPrivateDnsLookup(
	hostname: string,
	options: LookupOptions,
	cb: (
		err: NodeJS.ErrnoException | null,
		address: string | LookupAddress[],
		family?: number,
	) => void,
) {
	const family =
		options.family === 6 || options.family === "IPv6"
			? 6
			: options.family === 4 || options.family === "IPv4"
				? 4
				: 0;
	const methods: Array<"resolve4" | "resolve6"> =
		family === 4
			? ["resolve4"]
			: family === 6
				? ["resolve6"]
				: ["resolve4", "resolve6"];
	const fail = (err: NodeJS.ErrnoException) =>
		options.all ? cb(err, []) : cb(err, "", 0);

	const found: LookupAddress[] = [];
	let pending = methods.length;

	for (const method of methods) {
		resolver[method](hostname, (_err, addresses) => {
			// An error or an empty answer just means no records of this family
			for (const address of addresses ?? []) {
				found.push({
					address,
					family: method === "resolve4" ? 4 : 6,
				});
			}

			if (--pending > 0) {
				return;
			}

			if (found.length === 0) {
				return fail(
					Object.assign(new Error(`ENOTFOUND ${hostname}`), {
						code: "ENOTFOUND",
						hostname,
					}),
				);
			}

			if (
				found.some((a) =>
					ipBlocklist.check(
						a.address,
						a.family === 6 ? "ipv6" : "ipv4",
					),
				)
			) {
				return fail(
					Object.assign(new Error("URL DISALLOWED"), {
						code: "EBLOCKED",
					}),
				);
			}

			return options.all
				? cb(null, found)
				: cb(null, found[0].address, found[0].family);
		});
	}
}
