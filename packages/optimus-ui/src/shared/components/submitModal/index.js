import React from "react";
import ReactDOM from "react-dom";
import HOC from "./HOC";

const formItemLayout = {
    labelCol: {
        sm: { span: 4 },
    },
    wrapperCol: {
        sm: { span: 20 },
    },
};

const submitModal = {};

submitModal.start = function (FormComponent, props) {
    const SubmitModal = HOC(FormComponent);

    if (!props.submit) {
        throw new Error(
            "submitModal.start(FormComponent, props); props.submit should not be undefined",
        );
    }

    return submitModal.build(SubmitModal, {
        visible: true,
        formItemLayout,
        ...props,
    });
};

submitModal.build = function (Component, properties) {
    const { getContainer, ...props } = properties || {};
    let div;
    if (getContainer) {
        div = getContainer();
    } else {
        div = document.createElement("div");
        document.body.appendChild(div);
    }

    const onClose = () => {
        ReactDOM.unmountComponentAtNode(div);
        document.body.removeChild(div);
    };
    const submit = props.submit;
    return new Promise((resolve, reject) => {
        props.submit = (...args) => {
            return submit(...args)
                .then((data) => {
                    resolve(data);
                    return data;
                })
                .catch((e) => {
                    reject(e);
                    throw e;
                });
        };

        ReactDOM.render(
            <Component
                {...props}
                maskClosable={!!("maskClosable" in props)}
                onClose={onClose}
            />,
            div,
        );
    });
};

export default submitModal.start;
