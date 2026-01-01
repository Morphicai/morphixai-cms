import { forwardRef } from "react";
import MenuManagement from "./views/MenuManagement";

export function PermissionPage() {
  return <MenuManagement />;
}

export default forwardRef(PermissionPage);
