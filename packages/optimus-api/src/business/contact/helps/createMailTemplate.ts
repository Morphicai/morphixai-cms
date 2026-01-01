export interface ICreateMailTemplate {
    toEmails: string[];
    nickName: string;
    email: string;
    message: string;
}

export interface IMailTemplate {
    to: string[] | string;
    subject: string;
    html: string;
}

export default function (options: ICreateMailTemplate): IMailTemplate {
    const { toEmails, nickName, email, message } = options;
    return {
        to: toEmails,
        subject: `你好地球-${nickName}-向你提交了一条信息`,
        html: `
            <p>这是地球村</p>
            <p>${nickName} 的邮箱是： ${email}</p>
            <p>他说： ${message}</p>
            <p>地球人。收到请回复</p>
        `,
    };
}
