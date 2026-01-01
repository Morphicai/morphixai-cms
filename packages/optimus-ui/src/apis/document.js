import { request } from "../shared/utils/axios";
/**
 * 添加文案
 * @param {*} param0
 * @returns
 */
export function addDocument({ docKey, source, description, type, content, showOnMenu }) {
  return request({
    type: "post",
    url: "/document",
    data: { docKey, source, type, content, description, showOnMenu },
  });
}

/**
 * 获取文案内容
 * @param {*} param0
 * @returns
 */
export function getAppLatestResource({ docKey, source, type }) {
  return request({
    type: "post",
    url: "/document/getAppLatestResource",
    data: { docKey, source, type },
  });
}

/**
 * 查询所有需要展示在菜单上的文案中心
 * @param {*} param0
 * @returns
 */
export function getMenusFromDocument() {
  return request({
    showTip: false,
    type: "get",
    url: "/document/getAllMenuDocuments",
  });
}

/**
 * 根据文案中心 ID 获取值
 * @param {id} param0 文案中心ID
 * @returns
 */
export function getResById({ id }) {
  return request({
    type: "post",
    url: "/document/getResById/" + id,
  });
}

/**
 * 获取文案列表
 * @param {*} param0
 * @returns
 */
export function getDocumentList({
  page,
  size = 10,
  docKey,
  source = "",
  type,
}) {
  return request({
    type: "get",
    url: "/document/list",
    data: { page: page - 1, size, docKey, source, type },
  });
}

/**
 * 更新文案
 * @param {*}
 * @returns
 */
export function updateDocument({ docKey, source, description, type, content, showOnMenu }) {
  return request({
    type: "post",
    url: "/document/update",
    data: { docKey, source, type, description, content, showOnMenu },
  });
}

/**
 * 更新文案
 * @param {*}
 * @returns
 */
export function updateDocumentById({
  id,
  docKey,
  source,
  description,
  type,
  content,
  showOnMenu,
}) {
  return request({
    type: "post",
    url: "/document/updateById/" + id,
    data: { docKey, source, type, description, content, showOnMenu },
  });
}

/**
 * 删除文案
 * @param {*} id
 * @returns
 */
export function deleteDocument(id) {
  return request({
    type: "delete", // 修改HTTP方法为DELETE
    url: "/document/" + id, // 修改为RESTful风格：DELETE /api/document/{id}
  });
}
