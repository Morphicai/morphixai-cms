import { request } from "../shared/utils/axios";

// 数据集合 = 字典模块的集合与行,这里只是薄封装,不另起后端
export const dataCollectionApi = {
  // 集合
  listCollections: () =>
    request({ type: "get", url: "/system/dictionary-collection", data: { page: 1, pageSize: 100 } }),
  createCollection: (data) => request({ type: "post", url: "/system/dictionary-collection", data }),
  updateCollection: (id, data) => request({ type: "put", url: `/system/dictionary-collection/${id}`, data }),
  removeCollection: (id) => request({ type: "delete", url: `/system/dictionary-collection/${id}` }),
  // 行
  listRows: (collection, page = 1, pageSize = 50) =>
    request({ type: "get", url: "/system/dictionary", data: { collection, page, pageSize } }),
  createRow: (collection, key, value) =>
    request({ type: "post", url: "/system/dictionary", data: { collection, key, value }, showTip: false }),
  updateRow: (id, value) =>
    request({ type: "put", url: `/system/dictionary/${id}`, data: { value }, showTip: false }),
  removeRow: (id) => request({ type: "delete", url: `/system/dictionary/${id}` }),
};
