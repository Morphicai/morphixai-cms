import nodemailer from "nodemailer";

export interface INodemailerConfig {
    host: string;
    secure?: boolean;
    from: string;
    code: string;
}

export interface INodemailerOptions {
    to: string | string[];
    subject: string;
    html?: string;
}

export class Nodemailer {
    public config: INodemailerConfig;
    private transporter;
    private sendMailKeys: string[];

    constructor(config: INodemailerConfig) {
        this.config = config;
        this.iniitialize();
    }

    private iniitialize() {
        this.transporter = this.createTransport();
        this.sendMailKeys = ["from", "subject", "html"];
        // Example
        // this.sendMail(
        //     {
        //         to: "ivanzhou1@vip.qq.com",
        //         subject: "你好地球",
        //         html: `
        //         <p>这是地球村</p>
        //         <p>你好，地球人。收到请回复</p>
        //     `,
        //     },
        //     (err, data) => {
        //         console.log("fxxxk mail ", err, data);
        //     },
        // );
    }

    private createTransport() {
        return nodemailer.createTransport({
            host: this.config.host,
            secure: true,
            auth: {
                user: this.config.from,
                pass: this.config.code,
            },
        });
    }

    public sendMail(opts: INodemailerOptions | (() => void) | null, cb?: (error?: Error, info?: any) => void) {
        if (typeof opts === "function") {
            cb = opts;
            opts = {} as INodemailerOptions;
        }
        const option = this.sendMailKeys.reduce(
            (opt, key) => {
                opt[key] = opts[key] || this.config[key];
                return opt;
            },
            { ...opts },
        );
        this.transporter.sendMail(option, (err, data) => {
            cb && cb(err, data);
            this.transporter.close();
        });
    }
}
