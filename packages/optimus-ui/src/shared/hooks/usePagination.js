import { useState, useCallback } from "react";

// interface IUsePaginationParams<RequestParams, Item> {
//     request: (
//         params: RequestParams,
//         pageNo: number,
//         pageSize: number
//     ) => Promise<{
//         total: number;
//         data: Item[];
//     }>;
//     autoLoadLastPage?: boolean;
//     current?: number;
//     pageSize?: number;
//     onPageChange?: (pageNo?: number) => void;
// }

// Example
// const { loading, data, pagination, fetch, reload } = usePagination({
//     pageSize: DEDUCTION_PAGE_SIZE,
//     request: deductionRequest,
// });

export default function usePagination(params) {
    const {
        request,
        autoLoadLastPage = true,
        showSizeChanger = false,
    } = params;
    const [current, setCurrent] = useState(params.current || 1);
    const [pageSize] = useState(params.pageSize || 10);
    const [total, setTotal] = useState(0);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paramsCache, setParamsCache] = useState();
    const fetch = useCallback(
        async (params, pageNo = 1) => {
            setLoading(true);
            setParamsCache(params);
            try {
                const { total, data } = await request(params, pageNo, pageSize);
                setLoading(false);
                setCurrent(pageNo);
                setTotal(total);
                setData(data);
                // 如果传入页码pageNo = 4 超出查询数据总量范围了，如此时total =30，pageSize=10  则按照pageSize=3取最后一页的数据
                const isOverstep =
                    autoLoadLastPage &&
                    data.length === 0 &&
                    total > 0 &&
                    total <= (pageNo - 1) * pageSize &&
                    pageNo > 1;
                if (isOverstep) {
                    const lastPageNo = Math.floor((total - 1) / pageSize) + 1;
                    fetch(params, lastPageNo);
                }
            } catch (e) {
                setLoading(false);
            }
        },
        [pageSize, request, autoLoadLastPage],
    );
    const reload = useCallback(
        () => fetch(paramsCache, current),
        [paramsCache, current, fetch],
    );
    const onPageChange = useCallback(
        (pageNo) => {
            if (params.onPageChange) {
                params.onPageChange();
            }
            fetch(paramsCache, pageNo);
        },
        [paramsCache, fetch, params],
    );

    return {
        data,
        current,
        pageSize,
        total,
        loading,
        fetch,
        reload,
        pagination: {
            current,
            pageSize,
            total,
            onChange: onPageChange,
            showSizeChanger,
        },
    };
}
