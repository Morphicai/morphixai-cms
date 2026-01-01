import { request } from "../shared/utils/axios";

class DictionaryService {
    // ==================== 集合管理 ====================

    /**
     * 获取集合列表
     */
    async listCollections(params) {
        return request({
            type: "get",
            url: "/system/dictionary-collection",
            data: params,
        });
    }

    /**
     * 创建集合
     */
    async createCollection(data) {
        return request({
            type: "post",
            url: "/system/dictionary-collection",
            data,
        });
    }

    /**
     * 更新集合
     */
    async updateCollection(id, data) {
        return request({
            type: "put",
            url: `/system/dictionary-collection/${id}`,
            data,
        });
    }

    /**
     * 删除集合
     */
    async deleteCollection(id) {
        return request({
            type: "delete",
            url: `/system/dictionary-collection/${id}`,
        });
    }

    /**
     * 根据名称获取集合
     */
    async getCollectionByName(name) {
        return request({
            type: "get",
            url: `/system/dictionary-collection/${name}`,
        });
    }

    // ==================== 字典数据管理 ====================

    /**
     * 获取字典列表
     */
    async list(params) {
        return request({
            type: "get",
            url: "/system/dictionary",
            data: params,
        });
    }

    /**
     * 创建字典
     */
    async create(data) {
        return request({
            type: "post",
            url: "/system/dictionary",
            data,
        });
    }

    /**
     * 更新字典
     */
    async update(id, data) {
        return request({
            type: "put",
            url: `/system/dictionary/${id}`,
            data,
        });
    }

    /**
     * 删除字典
     */
    async delete(id) {
        return request({
            type: "delete",
            url: `/system/dictionary/${id}`,
        });
    }

    /**
     * 按集合获取字典
     */
    async getByCollection(collection) {
        return request({
            type: "get",
            url: `/system/dictionary/collection/${collection}`,
        });
    }

    /**
     * 获取字典值
     */
    async getValue(collection, key) {
        return request({
            type: "get",
            url: `/system/dictionary/${collection}/${key}`,
        });
    }
}

const dictionaryService = new DictionaryService();
export default dictionaryService;
