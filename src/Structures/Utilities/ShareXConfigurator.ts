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

interface ImageConfig {
    FileFormName: string;
    RequestMethod: string;
    Headers: {
        token: string;
        responseURL?: string;
    };
    RequestURL: string;
    DestinationType: string;
    Body: string;
    Data?: string;
    Name: string;
}

class ShareXConfigurator {
    private image: ImageConfig;

    constructor() {
        this.image = {
            Name: 'Folderr File',
            DestinationType: 'ImageUploader, FileUploader',
            RequestMethod: 'POST',
            RequestURL: '*{URL}/api/upload',
            Headers: {
                token: '',
            },
            Body: 'MultipartFormData',
            FileFormName: 'image',
        };
    }

    generateFiles(url: string, token: string, resURL?: string): string[] {
        if (!url || !token) {
            throw Error('[Configurator] - Missing parameters');
        }
        const imgConfig = this.image;
        imgConfig.RequestURL = `${url}/api/upload`;
        imgConfig.Headers.token = token;
        if (resURL) {
            imgConfig.Headers.responseURL = resURL;
        }
        const linkConfig = imgConfig;
        linkConfig.Name = 'Folderr Link';
        linkConfig.RequestURL = `${url}/api/link`;
        linkConfig.DestinationType = 'URLShortener';
        linkConfig.Body = 'JSON';
        linkConfig.Data = JSON.stringify('{"url":"$input$"}');
        return [JSON.stringify(imgConfig), JSON.stringify(linkConfig)];
    }
}

export default ShareXConfigurator;
