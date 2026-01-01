export interface IGetFeedbackAddresseeParams {
    value: any;
    isExists: boolean;
}

export default function (docs: IGetFeedbackAddresseeParams): string[] {
    const { value } = docs;
    try {
        const emails = JSON.parse(value?.content);
        if (Array.isArray(emails?.tags)) {
            return emails.tags;
        }
    } catch (error) {}
    return [];
}
