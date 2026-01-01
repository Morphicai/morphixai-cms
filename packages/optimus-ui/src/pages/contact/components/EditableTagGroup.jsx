import React from "react";
import { Tag, Input, Tooltip, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import validator from "validator";

export default class EditableTagGroup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tags: [...props.value],
            inputVisible: false,
            inputValue: "",
            editInputIndex: -1,
            editInputValue: "",
        };
    }

    handleClose = (removedTag) => {
        const tags = this.state.tags.filter((tag) => tag !== removedTag);
        this.setState({ tags });
        this.props?.onChange(tags);
    };

    showInput = () => {
        this.setState({ inputVisible: true }, () => this.input.focus());
    };

    handleInputChange = (e) => {
        this.setState({ inputValue: e.target.value });
    };

    handleInputConfirm = () => {
        let { inputValue, tags } = this.state;

        if (validator.isEmail(inputValue)) {
            if (inputValue && tags.indexOf(inputValue) === -1) {
                tags = [...tags, inputValue];
            }
            this.props?.onChange(tags);
        } else {
            message.error("请输入正确的邮箱地址");
        }

        this.setState({
            tags,
            inputVisible: false,
            inputValue: "",
        });
    };

    handleEditInputChange = (e) => {
        this.setState({ editInputValue: e.target.value });
    };

    handleEditInputConfirm = () => {
        this.setState(({ tags, editInputIndex, editInputValue }) => {
            const newTags = [...tags];
            newTags[editInputIndex] = editInputValue;
            return {
                tags: newTags,
                editInputIndex: -1,
                editInputValue: "",
            };
        });
    };

    saveInputRef = (input) => {
        this.input = input;
    };

    saveEditInputRef = (input) => {
        this.editInput = input;
    };

    render() {
        const {
            tags,
            inputVisible,
            inputValue,
            editInputIndex,
            editInputValue,
        } = this.state;
        return (
            <>
                {tags.map((tag, index) => {
                    if (editInputIndex === index) {
                        return (
                            <Input
                                ref={this.saveEditInputRef}
                                key={tag}
                                size="small"
                                style={{
                                    minWidth: 150,
                                    marginRight: 8,
                                    verticalAlign: "top",
                                }}
                                value={editInputValue}
                                onChange={this.handleEditInputChange}
                                onBlur={this.handleEditInputConfirm}
                                onPressEnter={this.handleEditInputConfirm}
                            />
                        );
                    }

                    const isLongTag = tag.length > 20;

                    const tagElem = (
                        <Tag
                            style={{ userSelect: "none" }}
                            key={tag}
                            closable
                            onClose={() => this.handleClose(tag)}
                        >
                            <span
                                onDoubleClick={(e) => {
                                    if (index !== 0) {
                                        this.setState(
                                            {
                                                editInputIndex: index,
                                                editInputValue: tag,
                                            },
                                            () => {
                                                this.editInput.focus();
                                            },
                                        );
                                        e.preventDefault();
                                    }
                                }}
                            >
                                {isLongTag ? `${tag.slice(0, 20)}...` : tag}
                            </span>
                        </Tag>
                    );
                    return isLongTag ? (
                        <Tooltip title={tag} key={tag}>
                            {tagElem}
                        </Tooltip>
                    ) : (
                        tagElem
                    );
                })}
                {inputVisible && (
                    <Input
                        ref={this.saveInputRef}
                        type="text"
                        size="small"
                        style={{
                            minWidth: 150,
                            marginRight: 8,
                            verticalAlign: "top",
                        }}
                        value={inputValue}
                        onChange={this.handleInputChange}
                        onBlur={this.handleInputConfirm}
                        onPressEnter={this.handleInputConfirm}
                    />
                )}
                {!inputVisible && (
                    <Tag
                        style={{ borderStyle: "dashed" }}
                        onClick={this.showInput}
                    >
                        <PlusOutlined /> 添加邮箱
                    </Tag>
                )}
            </>
        );
    }
}
