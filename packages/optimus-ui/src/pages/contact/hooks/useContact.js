import { useEffect, useState } from "react";
import { message } from "antd";

import useTable from "../../../shared/hooks/useTable";
import { getContactFeedback } from "../../../apis/contact";
import { getAppLatestResource, updateDocument } from "../../../apis/document";

import * as modal from "../components/FormModal";

const docParams = { docKey: "addressee", source: "contact", type: "array" };

export default function useContact() {
    const [allAddresses, setAddresses] = useState([]);
    const fetchFeedback = async (params = {}, pageNo, pageSize) => {
        const {
            code,
            data = {},
            msg = "",
        } = await getContactFeedback({ size: pageSize, page: pageNo });

        if (code === 200) {
            return {
                success: true,
                data: data.list,
                total: data.total,
            };
        }

        return {
            success: false,
            data: [],
            total: 0,
            message: msg,
        };
    };

    const fetchAddressee = async () => {
        const { code, data = {} } = await getAppLatestResource(docParams);
        if (isSuccess(code)) {
            try {
                const content = JSON.parse(data.content);
                Array.isArray(content.tags) && setAddresses(content.tags);
            } catch (error) {
                console.log("fetch all addresses is error", error);
            }
        }
        return data;
    };

    const updateAddressee = async (values = []) => {
        console.log("values", values);
        const { code } = await updateDocument({
            ...docParams,
            content: JSON.stringify(values),
        });
        const success = isSuccess(code);
        const config = {
            type: success ? "success" : "error",
            msg: success ? "更新成功" : "更新失败",
        };
        message[config.type](config.msg);
        return fetchAddressee();
    };

    const manageAddresses = () => {
        modal.create({
            initialValues: allAddresses,
            submit: (v) => updateAddressee(v),
        });
    };

    const { search, tableProps } = useTable({
        pageSize: 10,
        request: fetchFeedback,
    });

    useEffect(() => {
        search();
        fetchAddressee();
        // eslint-disable-next-line
    }, []);

    return { manageAddresses, tableProps };
}

function isSuccess(code) {
    return code === 200;
}
