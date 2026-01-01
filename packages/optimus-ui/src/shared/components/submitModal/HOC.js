import React from "react";
import { Modal } from "antd";

export default function SubmitModal(FormComponent) {
    return class Wrap extends React.Component {
        state = {
            loading: false,
        };

        formRef = React.createRef();

        handleOk = (e) => {
            const { onClose, form, noModal = false, submit } = this.props;
            const _form = form || this.formRef.current?.form;
            if (!_form) {
                throw new Error("form 实际不能为空");
            }
            _form
                .validateFields()
                .then((values) => {
                    this.setState({ loading: true });
                    const promise = submit({ ...values });
                    if (promise instanceof Promise) {
                        promise
                            .then((data) => {
                                !noModal && onClose();
                            })
                            .catch((err) => {
                                this.setState({ loading: false });
                            });
                    }
                })
                .catch((err) => {
                    this.setState({ loading: false });
                });
        };

        handleCancel = (e) => {
            this.props.onClose();
        };

        render() {
            const {
                form,
                visible,
                formItemLayout,
                title,
                width,
                style = {},
                maskClosable,
                noModal = false,
                renderFooter = () => {},
                ...rest
            } = this.props;

            if (noModal) {
                return (
                    <>
                        <FormComponent
                            ref={this.formRef}
                            formItemProps={{ form, ...formItemLayout }}
                            {...rest}
                        />
                        {renderFooter({
                            onOk: this.handleOk,
                        })}
                    </>
                );
            }

            return (
                <div>
                    <Modal
                        width={width}
                        style={style}
                        maskClosable={maskClosable}
                        destroyOnClose={true}
                        title={title}
                        open={visible}
                        onOk={this.handleOk}
                        onCancel={this.handleCancel}
                        confirmLoading={this.state.loading}
                    >
                        <FormComponent
                            ref={this.formRef}
                            formItemProps={{ form, ...formItemLayout }}
                            {...rest}
                        />
                    </Modal>
                </div>
            );
        }
    };
}
