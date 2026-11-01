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
 * @fileoverview Handle Making ShareX configs
 */

/** A ShareX custom uploader (.sxcu), using the syntax of ShareX 13 and later */
interface ShareXConfig {
	Version: string;
	Name: string;
	DestinationType: string;
	RequestMethod: "POST";
	RequestURL: string;
	Headers: {
		Authorization: string;
		responseURL?: string;
	};
	Body: "MultipartFormData" | "JSON";
	FileFormName?: string;
	Data?: string;
	/** Where ShareX finds the link to copy. Uploads and links answer with just the URL as text */
	URL: string;
}

class ShareXConfigurator {
	/**
	 * @desc Builds the file upload config, then the link shortener config, as JSON text
	 */
	generateFiles(url: string, token: string, responseURL?: string): string[] {
		if (!url || !token) {
			throw new Error("[Configurator] - Missing parameters");
		}

		// Fresh objects every call, so one user's token can never end up in another's config
		const headers = () => ({
			Authorization: token,
			...(responseURL ? { responseURL } : {}),
		});
		const file: ShareXConfig = {
			Version: "14.0.0",
			Name: "Folderr File",
			DestinationType: "ImageUploader, FileUploader",
			RequestMethod: "POST",
			RequestURL: `${url}/api/file`,
			Headers: headers(),
			Body: "MultipartFormData",
			FileFormName: "file",
			URL: "{response}",
		};
		const link: ShareXConfig = {
			Version: "14.0.0",
			Name: "Folderr Link",
			DestinationType: "URLShortener",
			RequestMethod: "POST",
			RequestURL: `${url}/api/link`,
			Headers: headers(),
			Body: "JSON",
			Data: '{"url":"{input}"}',
			URL: "{response}",
		};
		return [JSON.stringify(file), JSON.stringify(link)];
	}
}

export default ShareXConfigurator;
