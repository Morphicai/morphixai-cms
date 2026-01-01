import submitModal from "../../../../shared/components/submitModal";
import Form from "./Form";

const defaultOptions = {
    width: "50vw",
};

export const edit = ({ success, ...otherProps }) => {
    const options = Object.assign(
        {
            title: "密码修改",
        },
        defaultOptions,
        otherProps,
    );
    submitModal(Form, options);
};
