import { useCallback } from "react";
import usePagination from "./usePagination";

// EXAMPLE
// const { search, tableProps } = useTable({
//     pageSize: 10,
//     request: async (params = {}, pageNo, pageSize) => {
//         const { success, ...res } = await fetchApi();
//         if (success) {
//             return {
//                 success: true,
//                 data: res.dataSource,
//                 total: res.count,
//                 current: pageNo,
//             };
//         }
//         return {
//             success: false,
//             data: [],
//             total: 0,
//             message: res.errorMsg,
//         };
//     },
// });

// <Search onSearch={search} />
// <Table
//     {...tableProps}
//     columns={[
//         { title: "PDD订单号", dataIndex: "outOrderId" },
//         { title: "TC订单号", dataIndex: "tradeId" }
//     ]}
// />;

function useTable({
    rowKey,
    tableOtherProps = {},
    request = (noop) => noop,
    autoLoadLastPage = true,
    showSizeChanger = false,
    ...otherOptions
}) {
    const { data, loading, pagination, fetch, ...paginationRes } =
        usePagination({
            request,
            autoLoadLastPage,
            showSizeChanger,
            ...otherOptions,
        });
    // query api
    const search = useCallback((values = {}) => fetch(values), [fetch]);
    const tableProps = {
        dataSource: data,
        loading,
        pagination,
        ...tableOtherProps,
    };

    rowKey && (tableProps.rowKey = rowKey);

    return {
        search,
        tableProps,
        ...paginationRes,
    };
}

export default useTable;
