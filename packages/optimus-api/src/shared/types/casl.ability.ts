interface IPolicyHandler {
    handle(forbiddenErrorIns, ability): void;
}

type PolicyHandlerCallback = (forbiddenErrorIns, ability) => void;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
