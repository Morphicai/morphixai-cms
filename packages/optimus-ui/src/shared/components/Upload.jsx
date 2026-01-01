import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Upload, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { refreshToken } from "../../apis/user";
import useAuth from "../hooks/useAuth";
import { getBase64 } from "../utils/images";
import fileService from "../../services/FileService";
import { getFullFileUrl } from "../utils/fileUtils";

export default function UploadComponent({
    onChange,
    fileType = ["image/jpeg", "image/png"],
    limit = 5,
    value = {},
    business = "common",
    thumbnail = { width: 1000, quality: 70 },
    beforeUpload: customBeforeUpload,
    disabled = false,
}) {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const { accessToken } = useAuth();
    useEffect(() => {
        const { url = "" } = value || {};
        setImageUrl(getFullFileUrl(url));
    }, [value]);

    async function beforeUpload(file) {
        if (loading) {
            message.warning("正在上传中，请勿重复操作");
            throw new Error("正在上传中，请勿重复操作");
        }
        const isInType = fileType.includes(file.type);

        if (!isInType) {
            message.error("请上传" + fileType.toString() + "格式的文件");
        }
        const isOverLimit = file.size / 1024 / 1024 > limit;
        if (isOverLimit) {
            message.error("文件大小超过" + limit + "M");
        }
        if (!isInType || isOverLimit) {
            throw new Error("文件不符合要求");
        }

        // 执行自定义验证
        if (customBeforeUpload) {
            const result = await customBeforeUpload(file);
            if (result === false) {
                throw new Error("自定义验证失败");
            }
        }
    }

    const uploadButton = (
        <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>
    );
    const handleChange = useCallback(
        (info) => {
            const _upload = async (info) => {
                const { file } = info;
                const { status, response = {} } = file;
                if (status === "uploading") {
                    setLoading(true);
                    onChange("");
                    return;
                }
                if (status === "done") {
                    getBase64(file.originFileObj, (imageUrl) => {
                        setImageUrl(imageUrl);
                        setLoading(false);
                    });
                }
                if (status === "error") {
                    setLoading(false);
                    message.error(response.error || "上传失败，请重试");
                }
                if (response.code) {
                    if (response.code === 401) {
                        const res = await refreshToken();
                        if (res.code === 200) {
                            message.warning("");
                        } else {
                            message.error(res?.msg || "上传失败，请重试");
                        }
                    }
                    if (response.code !== 200) {
                        if (response.error) {
                            message.error(response.error || "上传失败");
                        }
                        onChange(null);
                    } else {
                        onChange(response?.data[0]);
                    }

                    setLoading(false);
                }
            };
            return _upload(info);
        },
        [onChange],
    );
    return (
        <div>
            <Upload
                name="file"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action={fileService.getUploadUrl()}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                disabled={disabled || loading}
                data={{
                    needThumbnail: !!thumbnail,
                    ...thumbnail,
                    business: typeof business === 'string' ? business : JSON.stringify(business),
                }}
                headers={{
                    Authorization: accessToken,
                }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    uploadButton
                )}
            </Upload>
        </div>
    );
}
