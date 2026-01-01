import React, { useEffect, useCallback } from "react";
import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { Uploader } from "./SocketUpload";
const uploader = Uploader.getInstance();
const { Dragger } = Upload;
const settings = {
    name: "file",
    multiple: false,
    maxCount: 1,
    openFileDialogOnClick: true,
    onDrop(e) {
        console.log("Dropped files", e.dataTransfer.files);
    },
};

export default function LargeUploadFile({
    name = "largeFile",
    onChange = (v) => {
        console.log(v);
    },
    multiple = false,
    showList = true,
    onProgress = () => {},
    onError = () => {},
    value,
    ...props
}) {
    // 监听服务端完成回调
    const onUpload = useCallback(
        async ({ file, onProgress, onError, onSuccess }) => {
            file &&
                uploader.upload({
                    file,
                    onProgress: (percent) => {
                        onProgress({ percent: percent * 100 });
                    },
                    onEnd: (fileInfo) => {
                        if (fileInfo) {
                            onChange(fileInfo.hash);
                            onSuccess("文件上传成功");
                        } else {
                            onChange(null);
                        }
                    },
                    onError: onError,
                });
        },
        [onChange],
    );

    useEffect(() => {
        return () => {
            uploader?.disconnect();
        };
        // eslint-disable-next-line
    }, []);
    const handlerRemove = async (file) => {
        console.log(file);
        uploader.destroy();
    };

    return (
        <>
            <Dragger
                {...props}
                {...settings}
                onRemove={handlerRemove}
                customRequest={onUpload}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                    Support for a single or bulk upload. Strictly prohibit from
                    uploading company data or other band files
                </p>
            </Dragger>
            {/* <Button
                type="primary"
                onClick={onUploadFiles}
                style={{ marginTop: 16 }}
            >
                Start Upload
            </Button> */}
        </>
    );
}
