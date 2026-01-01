import submitModal from "../../../submitModal";
import Form from "./Form";

const defaultOptions = {
    width: "50vw",
};

export const create = ({ success, ...otherProps }) => {
    const options = Object.assign(
        {
            title: "新建",
            type: "create",
        },
        defaultOptions,
        otherProps,
    );
    submitModal(Form, options);
};

export const edit = ({ success, ...otherProps }) => {
    const options = Object.assign(
        {
            title: "编辑",
            type: "edit",
        },
        defaultOptions,
        otherProps,
    );
    submitModal(Form, options);
};
