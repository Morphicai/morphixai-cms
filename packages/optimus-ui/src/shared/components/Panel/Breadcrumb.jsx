import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";

export default function Bread({ style, className, routes = [] }) {
  const [Breads, setBreads] = useState([]);
  const location = useLocation();

  useEffect(() => {
    setBreads(createBreadcrumbName(routes, location.pathname));
  }, [routes, location.pathname]);

  if (Breads.length === 0) {
    return null;
  }

  return (
    <Breadcrumb style={{ ...style }} className={className}>
      <Breadcrumb.Item href="/">
        <HomeOutlined />
      </Breadcrumb.Item>
      {Breads}
    </Breadcrumb>
  );
}

function createBreadcrumbName(tree = [], pathname = "/sys/role") {
  // 确保 tree 是数组
  const safeTree = Array.isArray(tree) ? tree : [];
  let result = [];
  const paths = [];

  function getNode(t) {
    for (let index = 0; index < t.length; index++) {
      const node = t[index];
      if (!node) continue; // 跳过空节点

      paths.push(node);
      if (node.path === pathname) {
        result = JSON.parse(JSON.stringify(paths));
        return;
      }
      const childNodes = Array.isArray(node?.children)
        ? node.children
        : [];
      getNode(childNodes);
      paths.pop();
    }
  }

  getNode(safeTree);

  return result.map((item, index) => {
    return (
      <Breadcrumb.Item key={item.path || item.key || item.id || `breadcrumb-${index}`}>
        {item.page || item.name || '未命名'}
      </Breadcrumb.Item>
    );
  });
}
