interface ImageConfig { FileFormName: string; RequestMethod: string; Headers: { uid: string; token: string }; RequestURL: string; DestinationType: string; Body: string; Name: string }

class ShareXConfigurator {
    private image: ImageConfig;

    constructor() {
        this.image = {
            Name: 'Image.Evolve-X',
            DestinationType: 'ImageUploader',
            RequestMethod: 'POST',
            RequestURL: '*{URL}/api/image',
            Headers: {
                token: '',
                uid: '',
            },
            Body: 'MultipartFormData',
            FileFormName: 'image',
        };
    }

    generateFiles(uid: string, url: string, token: string): string {
        if (!uid || !url || !token) {
            throw Error('[Configurator] - Missing parameters');
        }
        const imgConfig = this.image;
        imgConfig.RequestURL.replace('*{URL}', url);
        imgConfig.Headers.token = token;
        imgConfig.Headers.uid = uid;
        return JSON.stringify(imgConfig);
    }
}

export default ShareXConfigurator;
