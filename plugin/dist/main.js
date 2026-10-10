"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToolPkg = registerToolPkg;
function registerToolPkg() {
  try {
    console.log("[bt_probe] registerToolPkg start");
    // 本插件无独立 UI 面板，工具均由子包 bt_probe_tools 提供
    console.log("[bt_probe] registerToolPkg done");
    return true;
  } catch (e) {
    console.log("[bt_probe] registerToolPkg error:", (e && e.message) || String(e));
    return false;
  }
}
