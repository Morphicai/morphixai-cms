import submitModal from "../../../../shared/components/submitModal";
import Form from "./Form";

const defaultOptions = {
    width: "50vw",
};

export const create = ({ success, ...otherProps }) => {
    const options = Object.assign(
        {
            title: "新建文案中心",
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
            title: "编辑文案中心",
            type: "edit",
        },
        defaultOptions,
        otherProps,
    );
    submitModal(Form, options);
};
