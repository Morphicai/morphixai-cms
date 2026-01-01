import submitModal from "../../../../shared/components/submitModal";
import Form from "./Form";

const defaultOptions = {
    width: "50vw",
};

export const edit = ({ success, ...otherProps }) => {
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

export const create = ({ success, ...otherProps }) => {
    const options = Object.assign(
        {
            title: "管理收件人",
            type: "edit",
        },
        defaultOptions,
        otherProps,
    );
    submitModal(Form, options);
};
