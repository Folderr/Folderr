import fs, { existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import wlogger from '../Structures/WinstonLogger';

interface CertOptions {
    key?: string | any;
    cert?: string | any;
    requestCert?: boolean;
    ca?: string[];
}

interface EmailOptions {
    mailerOptions?: {
        auth: {
            user: string;
            pass: string;
        };
        port?: number;
        secure?: boolean;
        host: string;
        requireTLS?: boolean;
        ignoreTLS?: boolean;
    };
    sendingEmail?: string;
}

export interface KeyOptions {
    privKeyPath: string;
    algorithm?: string;
    pubKeyPath: string;
}

export interface Options {
    port?: number;
    url?: string;
    db: DBConfig;
    signups?: number;
    apiOnly?: boolean;
    trustProxies?: boolean;
    certOptions?: CertOptions;
    auth: KeyOptions;
    email?: EmailOptions;
}

export interface ServerConfig {
    port: number;
    signups: number;
    url: string;
    trustProxies?: boolean;
    apiOnly?: boolean;
    jwtConfig: {
        privKeyPath: string;
        algorithm?: string;
        pubKeyPath: string;
    }
    httpsCertOptions?: {
        key?: string;
        cert?: string;
        requestCert?: boolean;
        ca?: string[];
    }
}

export interface DBConfig {
    url: string;
    protocol?: string;
    dbName?: string
    extraConfig?: object;
}

export interface EmailConfig {
    mailerOptions?: {
        auth: {
            username: string;
            password: string;
        };
        port?: number;
        secure?: boolean;
        host: string;
        requireTls?: boolean;
        ignoreTls?: boolean;
    };
    sendingEmail?: string;
}

export interface CoreConfig {
    port: number;
    signups: number;
    url: string;
    trustProxies: boolean;
    apiOnly: boolean;
}

export interface KeyConfig {
    jwtConfig: {
        privKeyPath: string;
        algorithm?: string;
        pubKeyPath: string;
    }
    httpsCertOptions?: {
        key?: string;
        cert?: string;
        requestCert?: boolean;
        ca?: string[];
    }
}

export interface ActEmailConfig {
    mailerOptions?: {
        auth: {
            user: string;
            pass: string;
        };
        port?: number;
        secure?: boolean;
        host: string;
        requireTLS?: boolean;
        ignoreTLS?: boolean;
    };
    sendingEmail?: string;
}

export default class ConfigHandler {

    static fetchFiles(): { server: object, db: object, email: object | undefined | false } {
        const dir = join(process.cwd(), 'configs');
        const server = existsSync(join(dir, 'server.yaml') ) && yaml.load(fs.readFileSync(join(dir, 'server.yaml'), { encoding: 'utf8' } ) );
        const db = existsSync(join(dir, 'db.yaml') ) && yaml.load(fs.readFileSync(join(dir, 'db.yaml'), { encoding: 'utf8' } ) );
        const email = existsSync(join(dir, 'email.yaml') ) && yaml.load(fs.readFileSync(join(dir, 'email.yaml'), { encoding: 'utf8' } ) );
        const missing: string[] = [];
        if (typeof server !== 'object') {
            missing.push("server.yaml");
        }
        if (typeof db !== 'object') {
            missing.push("db.yaml");
        }
        if (typeof email !== 'object' && typeof email !== 'undefined') {
            missing.push("email.yaml");
        }
        if (missing.length > 0 && !(missing.length === 1 && missing[0] === 'email.yaml') ) {
            console.log(`Invalid YAML config, missing: ${missing.join(', ')}`)
            throw Error(`Invalid YAML config, missing: ${missing.join(', ')}`);
        } // OK TS, shut up.
        // @ts-ignore
        return { server, db, email };
    }

    static verifyFetch(): { core: CoreConfig, email: ActEmailConfig, key: KeyConfig, db: DBConfig } {
        let failedPort = false;
        let failedSignups: boolean | string = false;
        const missingFiles: string[] = [];

        const files = <{server: ServerConfig, db: DBConfig, email?: EmailConfig}>this.fetchFiles();
        const missingConfigs: { server: string[], db: string[] } = { server: [], db: [] };
        if (!files.server.jwtConfig || !files.server.jwtConfig.privKeyPath || !files.server.jwtConfig.pubKeyPath) {
            missingConfigs.server.push('server/auth_config - See documentation');
        }
        if (!files.server.port || typeof files.server.port !== 'number') {
            missingConfigs.server.push('server/port - Must be a number');
        }
        if ((!files.server.signups && files.server.signups !== 0) || typeof files.server.signups !== 'number') {
            missingConfigs.server.push('server/signups - Must be a number')
        }
        if (!files.server.url || typeof files.server.url !== 'string') {
            missingConfigs.db.push('server/url - Must be a url string');
        }
        if (!files.db.url || typeof files.db.url !== 'string') {
            missingConfigs.db.push("db/url - Must be a url string");
        }
        if (missingConfigs.server.length > 0 || missingConfigs.db.length > 0) {
            console.log('[CONFIG] Missing/Invalid Required Options:')
            if (missingConfigs.server.length > 0) {
                console.log(missingConfigs.server.join("\n") );
            }
            if (missingConfigs.db.length > 0) {
                console.log(missingConfigs.db.join("\n") );
            }
            throw Error('[CONFIG] Missing/Invalid Required Options');
        }
        const keyConfig: KeyConfig = {
            jwtConfig: {
                privKeyPath: files.server.jwtConfig.privKeyPath,
                algorithm: files.server.jwtConfig.algorithm,
                pubKeyPath: files.server.jwtConfig.pubKeyPath,
            },
            httpsCertOptions: {
                key: (files.server.httpsCertOptions && files.server.httpsCertOptions.key),
                cert: (files.server.httpsCertOptions && files.server.httpsCertOptions.cert),
                ca: (files.server.httpsCertOptions && files.server.httpsCertOptions.ca),
                requestCert: (files.server.httpsCertOptions && !!files.server.httpsCertOptions.requestCert),
            }
        }
        const coreConfig = {
            url: files.server.url,
            port: files.server.port,
            trustProxies: files.server.trustProxies || false,
            signups: files.server.signups,
            apiOnly: files.server.apiOnly || false,
        };
        const emailConfig: ActEmailConfig = {};
        const dbConfig = {
            url: files.db.url,
            dbName: files.db.dbName,
            protocol: files.db.protocol,
            extraConfig: files.db.extraConfig
        }
        if (files.email) {
            emailConfig.sendingEmail = files.email.sendingEmail;
            const hasAuth = !!files.email.mailerOptions?.auth && !!files.email.mailerOptions?.auth.password && !!files.email.mailerOptions?.auth.username
            if (files.email.mailerOptions && hasAuth) {
                emailConfig.mailerOptions = {
                    auth: {
                        user: files.email.mailerOptions.auth.username,
                        pass: files.email.mailerOptions.auth.password,
                    },
                    host: files.email.mailerOptions.host,
                    port: files.email.mailerOptions.port,
                    secure: files.email.mailerOptions.secure,
                    requireTLS: files.email.mailerOptions.requireTls,
                    ignoreTLS: files.email.mailerOptions.ignoreTls,
                };
            };
        };
        // Validate all files
        if (!existsSync(keyConfig.jwtConfig.privKeyPath) ) {
            missingFiles.push('auth/private key path');
        }
        if (!existsSync(keyConfig.jwtConfig.pubKeyPath) ) {
            missingFiles.push('jwtConfig/public key path');
        }
        if (keyConfig.httpsCertOptions?.key && !existsSync(keyConfig.httpsCertOptions?.key) ) {
            missingFiles.push('https certificate options/key')
        }
        if (keyConfig.httpsCertOptions?.cert && !existsSync(keyConfig.httpsCertOptions?.cert) ) {
            missingFiles.push('https certificate options/cert')
        }
        // Validate ports
        const maxPort = 65535;
        if (!coreConfig.port || coreConfig.port > maxPort || coreConfig.port < 1) {
            failedPort = true;
        }
        // Validate signups type
        if ( (!coreConfig.signups && coreConfig.signups !== 0) || 0 > coreConfig.signups || coreConfig.signups > 2) {
            failedSignups = 'Signup type invalid';
        }
        if (coreConfig.signups == 2 && (!emailConfig.sendingEmail || !emailConfig.mailerOptions?.auth.pass || !emailConfig.mailerOptions?.auth.user) ) {
            failedSignups = 'Signup Type Not Configured Properly (Emailer not configured)';
        }
        // Check if anything has failed
        if (failedSignups || failedPort) {
            let err = '[CONFIG - INVALID CONFIG]';
            if (failedPort) {
                err += '\nPort configuration invalid. Please be below 65535 and above 0';
            }
            if (failedSignups && typeof failedSignups === 'string') {
                err += `\n${failedSignups}`;
            }
            if (missingFiles.length > 0) {
                err += `\nThe following files were not found but in the config:\n${missingFiles.join('\n')}`;
            }
            console.log(err);
            wlogger.error(err);
            setTimeout( () => {
                process.exit(1);
            }, 500);
        }
        return { key: keyConfig, email: emailConfig, core: coreConfig, db: dbConfig };
    }
}
