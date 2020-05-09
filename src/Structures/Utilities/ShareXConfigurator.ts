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
