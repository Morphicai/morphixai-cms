import React from "react";
import * as Icon from "@ant-design/icons";
import { menuType } from "../constants/routeType";
import parseJson from "../utils/parseJson";

export async function normalizeDynamicRoutes(data = [], routesMap = []) {
    return (Array.isArray(data) ? data : [])
        .reduce(
            (
                routes,
                {
                    name: page,
                    orderNum: sort = 0,
                    id,
                    parent_id: pid = 0,
                    code: key = "",
                    icon = "",
                    type,
                },
            ) => {
                if (type === menuType.MENU) {
                    let permCode;
                    try {
                        const permJson = parseJson(key);
                        permCode = permJson?.subject ? permJson.subject : key;
                    } catch (error) {
                        permCode = key;
                    }
                    const localRoute = routesMap.find((router) => {
                        return router.key === permCode;
                    });
                    const opts = {
                        page,
                        key,
                        id,
                        pid,
                        sort,
                        icon: icon ? React.createElement(Icon[icon]) : null,
                    };
                    routes.push(
                        Object.assign(opts, localRoute ? localRoute : {}),
                    );
                }
                return routes;
            },
            [],
        )
        .sort((a, b) => b.sort - a.sort);
}
