"use strict";
/* METADATA
{
  "name": "bt_probe_tools",
  "display_name": { "zh": "蓝牙探测", "en": "Bluetooth Probe" },
  "description": { "zh": "探测 Operit 能否通过 Java Bridge 访问 Android 蓝牙；列出已配对设备，定位 PD01。", "en": "Probe Android Bluetooth via Java Bridge; list bonded devices, locate PD01." },
  "enabledByDefault": true,
  "category": "Integration",
  "tools": [
    {
      "name": "bt_probe",
      "description": { "zh": "探测 Android 蓝牙可达性：读 BluetoothAdapter 状态、列出已配对设备（含 PD01 识别）。", "en": "Probe Android Bluetooth reachability: read BluetoothAdapter state, list bonded devices (detect PD01)." },
      "parameters": [
        { "name": "mode", "description": { "zh": "bonded=只读已配对；all=都做", "en": "bonded=list bonded; all=both" }, "type": "string", "required": false },
        { "name": "target", "description": { "zh": "要匹配的目标设备名（默认 PD01）", "en": "Target device name (default PD01)" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "bt_scan",
      "description": { "zh": "BLE 扫描探测：看能不能拿到 LeScanner、能不能构造 PD01 设备句柄。", "en": "BLE scan probe: check LeScanner and PD01 device handle." },
      "parameters": [
        { "name": "target", "description": { "zh": "目标设备名（默认 PD01）", "en": "Target name" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "bt_mem",
      "description": { "zh": "内存测试：验证全局变量能否跳调用保留。", "en": "Memory test: check globals persist across calls." },
      "parameters": [
        { "name": "key", "description": { "zh": "键", "en": "key" }, "type": "string", "required": false },
        { "name": "val", "description": { "zh": "值", "en": "value" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "bt_connect",
      "description": { "zh": "connectGatt 连接设备并等待回调，末尾列出服务。", "en": "connectGatt + wait callback, list services." },
      "parameters": [
        { "name": "mac", "description": { "zh": "目标 MAC（默认 PD01）", "en": "Target MAC" }, "type": "string", "required": false },
        { "name": "waitMs", "description": { "zh": "等待毫秒", "en": "wait ms" }, "type": "number", "required": false }
      ]
    },
    {
      "name": "bt_perm",
      "description": { "zh": "检查蓝牙相关权限状态。", "en": "Check Bluetooth permissions." },
      "parameters": []
    },
    {
      "name": "bt_refl",
      "description": { "zh": "反射路径探测：Class.forName / getMethods 能不能拿到方法列表。", "en": "Reflection path probe." },
      "parameters": []
    },
    {
      "name": "bt_spp",
      "description": { "zh": "试经典蓝牙 SPP 同步 socket 连接（绕开回调）。", "en": "Try classic SPP sync socket connect." },
      "parameters": []
    },
    {
      "name": "bt_conn3",
      "description": { "zh": "connectGatt 多种 callback 传法尝试。", "en": "connectGatt multi callback-style trial." },
      "parameters": []
    },
    {
      "name": "bt_try",
      "description": { "zh": "参数匹配探测：试各种调用看报错。", "en": "Argument matching trials." },
      "parameters": []
    },
    {
      "name": "bt_meta",
      "description": { "zh": "反射列出 BluetoothDevice 的 connectGatt/Bond/Socket 等方法精确签名。", "en": "Reflect BluetoothDevice method signatures." },
      "parameters": []
    },
    {
      "name": "bt_connect2",
      "description": { "zh": "connectGatt 多重载尝试版，打印详细错误。", "en": "connectGatt multi-overload trial with detailed errors." },
      "parameters": [
        { "name": "mac", "description": { "zh": "MAC", "en": "mac" }, "type": "string", "required": false }
      ]
    }
    ,
    {
      "name": "bt_conn4",
      "description": {"zh": "connectGatt v0.6.7：new 接口代理等新写法", "en": "connectGatt v0.6.7 new interface proxy"},
      "parameters": []
    }
    ,
    {
      "name": "bt_iface",
      "description": {"zh": "探测接口 marker 真实类型与 instanceof", "en": "probe interface marker type"},
      "parameters": []
    }
    ,
    {
      "name": "bt_load",
      "description": {"zh": "loadDex 加载外部 dex 并调用", "en": "loadDex test"},
      "parameters": [{"name":"path","description":{"zh":"dex路径","en":"dex path"},"type":"string","required":false}]
    }
    ,
    {
      "name": "bt_go",
      "description": {"zh": "用自编 Java 类连 PD01（绕开桥限制）", "en": "connect PD01 via custom java"},
      "parameters": [{"name":"mac","description":{"zh":"MAC","en":"mac"},"type":"string","required":false}]
    }
    ,
    {
      "name": "bt_send",
      "description": {"zh": "连接PD01+开通知+发hex指令", "en": "connect+notify+writeHex"},
      "parameters": [{"name":"mac","description":{"zh":"MAC","en":"mac"},"type":"string","required":false},{"name":"hex","description":{"zh":"十六进制字节","en":"hex bytes"},"type":"string","required":false}]
    }
    ,
    {
      "name": "bt_print",
      "description": {"zh": "打印位图文件(第一张)", "en": "print bitmap file"},
      "parameters": [{"name":"mac","description":{"zh":"MAC","en":"mac"},"type":"string","required":false},{"name":"path","description":{"zh":"位图路径","en":"bitmap path"},"type":"string","required":false}]
    }
  ]
}
*/

var L = function (x) {
  try {
    if (x === null || x === undefined) return String(x);
    if (typeof x === "string") return x;
    return JSON.stringify(x);
  } catch (e) {
    try { return String(x); } catch (e2) { return "<unprintable>"; }
  }
};

exports.bt_probe = function (args) {
  args = args || {};
  var mode = args.mode || "all";
  var target = args.target || "PD01";
  var lines = [];
  var p = function (s) { lines.push(s); };

  var g = (typeof Java !== "undefined" && Java) ? Java : ((typeof Kotlin !== "undefined" && Kotlin) ? Kotlin : null);
  if (!g) {
    return "=== 蓝牙探测报告 ===\n[!] Java Bridge 不可用\n=== 结束 ===";
  }

  p("=== 蓝牙探测报告 v3 ===");
  p("mode: " + mode + " | target: " + target);
  p("");

  p("[1] 类可达性:");
  var classes = [
    "android.bluetooth.BluetoothAdapter",
    "android.bluetooth.BluetoothManager",
    "android.bluetooth.BluetoothDevice",
    "android.bluetooth.BluetoothGatt",
    "android.bluetooth.le.BluetoothLeScanner"
  ];
  var i;
  for (i = 0; i < classes.length; i++) {
    try {
      var ex = g.classExists(classes[i]);
      p("  " + (ex ? "OK" : "NO") + " " + classes[i]);
    } catch (e) {
      p("  ERR " + classes[i] + " -> " + L(e));
    }
  }
  p("");

  var adapter = null;
  try {
    var ctx = g.getApplicationContext();
    p("[2] Context: " + L(ctx));
  } catch (e) {
    p("[2] Context FAIL: " + L(e));
  }

  try {
    var AdapterCls = g.type("android.bluetooth.BluetoothAdapter");
    adapter = AdapterCls.callStatic("getDefaultAdapter");
    p("[3] BluetoothAdapter: " + L(adapter));
  } catch (e) {
    p("[3] getDefaultAdapter FAIL: " + L(e));
  }

  if (!adapter) {
    p("[!] 没有 BluetoothAdapter");
    p("=== 结束 ===");
    return lines.join("\n");
  }

  try {
    var en = adapter.call("isEnabled");
    p("[4] isEnabled: " + L(en));
  } catch (e) {
    p("[4] isEnabled FAIL: " + L(e));
  }

  if (mode === "bonded" || mode === "all") {
    p("");
    p("[5] 已配对设备:");
    try {
      var bonded = adapter.call("getBondedDevices");
      if (!bonded) {
        p("  返回 null");
      } else {
        var n = -1;
        try { n = bonded.length; } catch (e) { n = -1; }
        if (typeof n !== "number" || isNaN(n)) { n = 0; }
        p("  已配对数量: " + L(n));
        for (var j = 0; j < n; j++) {
          var d = bonded[j];
          var nm = "?";
          var ad = "?";
          try { nm = d.call("getName"); } catch (e) { nm = "<err>"; }
          try { ad = d.call("getAddress"); } catch (e) { ad = "<err>"; }
          var mark = (nm === target) ? "  <<<< 找到目标!" : "";
          p("  [" + j + "] name=" + L(nm) + "  addr=" + L(ad) + mark);
        }
      }
    } catch (e) {
      p("  getBondedDevices FAIL: " + L(e));
    }
  }

  p("");
  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_scan = function (args) {
  args = args || {};
  var target = args.target || "PD01";
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== BLE 扫描探测 v4 ===");
  var adapter = null;
  try {
    adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
  } catch (e) { p("getDefaultAdapter FAIL: " + L(e)); }
  if (!adapter) { return p.join ? lines.join("\n") : "no adapter"; }

  // 看能不能拿到 LeScanner
  var scanner = null;
  try {
    scanner = adapter.call("getBluetoothLeScanner");
    p("[1] LeScanner: " + L(scanner));
  } catch (e) { p("[1] getBluetoothLeScanner FAIL: " + L(e)); }

  // 看当前监听器状态
  try {
    var st = adapter.call("getState");
    p("[2] adapter state: " + L(st));
  } catch (e) { p("[2] getState FAIL: " + L(e)); }

  // 尝试直接获取已配对里的 BluetoothDevice by MAC（看能不能构造）
  try {
    var dev = adapter.call("getRemoteDevice", "AA:BB:CC:DD:EE:FF");
    p("[3] getRemoteDevice(PD01 MAC): " + L(dev));
    if (dev) {
      try { p("    name=" + L(dev.call("getName"))); } catch (e) { p("    getName FAIL: " + L(e)); }
      try { p("    bondState=" + L(dev.call("getBondState"))); } catch (e) { p("    getBondState FAIL: " + L(e)); }
      try { p("    type=" + L(dev.call("getType"))); } catch (e) { p("    getType FAIL: " + L(e)); }
    }
  } catch (e) { p("[3] getRemoteDevice FAIL: " + L(e)); }

  p("");
  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_mem = function (args) {
  args = args || {};
  var key = args.key || "k";
  var val = args.val;
  var lines = [];
  var g = globalThis;
  if (!g.__BTPKG_MEM) { g.__BTPKG_MEM = {}; }
  if (typeof val !== "undefined") {
    g.__BTPKG_MEM[key] = val;
    lines.push("SET " + key + " = " + JSON.stringify(val));
  }
  lines.push("MEM keys: " + JSON.stringify(Object.keys(g.__BTPKG_MEM)));
  lines.push("GET " + key + " = " + JSON.stringify(g.__BTPKG_MEM[key]));
  return lines.join("\n");
};

exports.bt_connect = function (args) {
  args = args || {};
  var mac = args.mac || "AA:BB:CC:DD:EE:FF";
  var waitMs = args.waitMs || 8000;
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }

  // 全局事件箱
  var EV = (typeof globalThis !== "undefined") ? globalThis : this;
  if (!EV.__btEv) { EV.__btEv = []; }
  EV.__btEv.length = 0;
  var pushEv = function (s) { EV.__btEv.push(s); };

  p("=== connectGatt 探测 v0.4 ===");
  p("mac=" + mac + " waitMs=" + waitMs);

  var ctx = null;
  try { ctx = g.getApplicationContext(); } catch (e) { p("ctx FAIL: " + L(e)); }

  var adapter = null;
  try { adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter"); }
  catch (e) { p("adapter FAIL: " + L(e)); }
  if (!adapter) { p("no adapter"); return lines.join("\n"); }

  var dev = null;
  try { dev = adapter.call("getRemoteDevice", mac); p("device: " + L(dev)); }
  catch (e) { p("getRemoteDevice FAIL: " + L(e)); }
  if (!dev) { return lines.join("\n"); }

  // 构造 BluetoothGattCallback 对象
  var cbImpl = {
    onConnectionStateChange: function (gatt, status, newState) {
      pushEv("onConnectionStateChange status=" + status + " newState=" + newState);
    },
    onServicesDiscovered: function (gatt, status) {
      pushEv("onServicesDiscovered status=" + status);
    },
    onCharacteristicWrite: function (gatt, ch, status) {
      pushEv("onCharacteristicWrite status=" + status);
    },
    onCharacteristicChanged: function (gatt, ch) {
      pushEv("onCharacteristicChanged");
    },
    onMtuChanged: function (gatt, mtu, status) {
      pushEv("onMtuChanged mtu=" + mtu + " status=" + status);
    },
    onReadRemoteRssi: function (gatt, rssi, status) {
      pushEv("onReadRemoteRssi rssi=" + rssi);
    }
  };

  var cb = null;
  try {
    cb = g.implement("android.bluetooth.BluetoothGattCallback", cbImpl);
    p("callback marker: " + L(cb));
  } catch (e) { p("implement FAIL: " + L(e)); }

  var gatt = null;
  try {
    gatt = dev.call("connectGatt", ctx, false, cb);
    p("connectGatt returned: " + L(gatt));
  } catch (e) { p("connectGatt FAIL: " + L(e)); }

  // 等待回调：使用 Thread.sleep 分段睡，让 QuickJS 有机会处理回调
  var step = 500;
  var waited = 0;
  try {
    var Thread = g.type("java.lang.Thread");
    while (waited < waitMs) {
      Thread.callStatic("sleep", step);
      waited += step;
      if (EV.__btEv.length > 0) { break; }
    }
  } catch (e) { p("sleep FAIL: " + L(e)); }

  p("等待: " + waited + "ms");
  p("[回调事件] 共 " + EV.__btEv.length + " 条:");
  for (var i = 0; i < EV.__btEv.length; i++) { p("  " + EV.__btEv[i]); }

  // 尝试列服务
  if (gatt) {
    try {
      var svcs = gatt.call("getServices");
      p("getServices: " + L(svcs));
      if (svcs) {
        var n = -1; try { n = svcs.length; } catch (e) {}
        p("服务数: " + L(n));
        for (var j = 0; j < (n||0); j++) {
          var s = svcs[j];
          var u = "?"; try { u = s.call("getUuid"); } catch (e) {}
          p("  svc[" + j + "] uuid=" + L(u));
        }
      }
    } catch (e) { p("getServices FAIL: " + L(e)); }
  }

  p("");
  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_perm = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== 蓝牙权限检查 ===");
  var ctx = null;
  try { ctx = g.getApplicationContext(); } catch (e) { p("ctx FAIL: " + L(e)); }
  if (!ctx) { return lines.join("\n"); }
  var perms = [
    "android.permission.BLUETOOTH",
    "android.permission.BLUETOOTH_ADMIN",
    "android.permission.BLUETOOTH_CONNECT",
    "android.permission.BLUETOOTH_SCAN",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION"
  ];
  for (var i = 0; i < perms.length; i++) {
    var r = "?";
    try {
      r = ctx.call("checkSelfPermission", perms[i]);
    } catch (e) { r = "ERR:" + L(e); }
    // 0=GRANTED, -1=DENIED
    var txt = (r === 0) ? "GRANTED" : ((r === -1) ? "DENIED" : L(r));
    p("  " + perms[i] + " -> " + r + " (" + txt + ")");
  }
  // SDK 版本
  try {
    var b = g.type("android.os.Build$VERSION");
    p("SDK_INT: " + L(b.getStatic("SDK_INT")));
  } catch (e) { p("SDK FAIL: " + L(e)); }
  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_connect2 = function (args) {
  args = args || {};
  var mac = args.mac || "AA:BB:CC:DD:EE:FF";
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }

  var EV = (typeof globalThis !== "undefined") ? globalThis : this;
  if (!EV.__btEv2) { EV.__btEv2 = []; }
  EV.__btEv2.length = 0;
  var push = function (s) { EV.__btEv2.push(s); };

  p("=== connectGatt v0.6 (多重载) ===");
  var ctx = g.getApplicationContext();

  var adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
  var dev = adapter.call("getRemoteDevice", mac);
  p("dev: " + L(dev));

  // 看 BluetoothDevice 有哪些 connectGatt 重载
  try {
    var cls = g.type("android.bluetooth.BluetoothDevice");
    var methods = cls.callStatic("class") ? null : null;
  } catch (e) {}
  try {
    var c = dev.get("class");
    p("dev.class: " + L(c));
    if (c && c.call) {
      var ms = c.call("getMethods");
      if (ms) {
        for (var i = 0; i < ms.length; i++) {
          var nm = "?"; try { nm = ms[i].call("getName"); } catch (e) {}
          if (nm && nm.indexOf("connectGatt") >= 0) {
            var pt = ""; try { pt = L(ms[i].call("getParameterTypes")); } catch (e) {}
            p("  重载: " + nm + " (" + pt + ")");
          }
        }
      }
    }
  } catch (e) { p("列重载 FAIL: " + L(e)); }

  var cbImpl = {
    onConnectionStateChange: function (gatt, status, newState) { push("connChange st=" + status + " ns=" + newState); },
    onServicesDiscovered: function (gatt, status) { push("servicesDiscovered st=" + status); },
    onCharacteristicWrite: function (gatt, ch, status) { push("chrWrite st=" + status); },
    onMtuChanged: function (gatt, mtu, status) { push("mtuChanged " + mtu + " st=" + status); }
  };
  var cb = null;
  try { cb = g.implement("android.bluetooth.BluetoothGattCallback", cbImpl); p("cb: " + L(cb)); }
  catch (e) { p("implement FAIL: " + L(e)); }

  var gatt = null;
  // 3 参（ctx, autoConnect, cb）
  try {
    gatt = dev.call("connectGatt", ctx, false, cb);
    p("[3参] -> " + L(gatt));
  } catch (e) {
    p("[3参] FAIL: " + (e && e.message ? e.message : L(e)));
  }
  // 4 参（ctx, autoConnect, cb, transport=2 即 LE）
  if (!gatt) {
    try {
      gatt = dev.call("connectGatt", ctx, false, cb, 2);
      p("[4参] -> " + L(gatt));
    } catch (e) {
      p("[4参] FAIL: " + (e && e.message ? e.message : L(e)));
    }
  }

  // 等待回调
  var Thread = g.type("java.lang.Thread");
  var waited = 0;
  while (waited < 8000) {
    try { Thread.callStatic("sleep", 500); } catch (e) { break; }
    waited += 500;
    if (EV.__btEv2.length > 0) break;
  }
  p("等待 " + waited + "ms, 回调 " + EV.__btEv2.length + " 条");
  for (var i = 0; i < EV.__btEv2.length; i++) p("  " + EV.__btEv2[i]);

  if (gatt) {
    try {
      var svcs = gatt.call("getServices");
      var n = (svcs && typeof svcs.length === "number") ? svcs.length : 0;
      p("服务数: " + n);
      for (var j = 0; j < n; j++) {
        var u = "?"; try { u = svcs[j].call("getUuid"); } catch (e) {}
        p("  svc[" + j + "] " + L(u));
      }
    } catch (e) { p("getServices FAIL: " + L(e)); }
  }

  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_meta = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== 反射探索 BluetoothDevice ===");

  var adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
  var dev = adapter.call("getRemoteDevice", "AA:BB:CC:DD:EE:FF");

  // 拿 Class 对象：getClass()
  var klass = null;
  try { klass = dev.call("getClass"); p("getClass(): " + L(klass)); }
  catch (e) { p("getClass FAIL: " + L(e)); }

  if (klass) {
    try {
      var ms = klass.call("getMethods");
      var n = ms ? ms.length : 0;
      p("方法总数: " + n);
      for (var i = 0; i < n; i++) {
        var nm = "?";
        try { nm = ms[i].call("getName"); } catch (e) {}
        if (nm && (nm.indexOf("connectGatt") >= 0 || nm.indexOf("Bond") >= 0 || nm.indexOf("Socket") >= 0 || nm.indexOf("create") >= 0)) {
          var sig = nm;
          try {
            var pts = ms[i].call("getParameterTypes");
            var pn = pts ? pts.length : 0;
            var parts = [];
            for (var k = 0; k < pn; k++) {
              var cn = "?";
              try { cn = pts[k].call("getName"); } catch (e) {}
              parts.push(cn);
            }
            sig += "(" + parts.join(", ") + ")";
          } catch (e) { sig += "(?) "; }
          p("  " + sig);
        }
      }
    } catch (e) { p("getMethods FAIL: " + L(e)); }
  }

  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_try = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== 参数匹配探测 ===");
  var adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
  var dev = adapter.call("getRemoteDevice", "AA:BB:CC:DD:EE:FF");
  var ctx = g.getApplicationContext();
  p("dev=" + L(dev));
  p("ctx=" + L(ctx));

  // 1. 无参方法：getBondState
  try { p("[1] getBondState() -> " + L(dev.call("getBondState"))); }
  catch (e) { p("[1] getBondState FAIL: " + (e&&e.message||L(e))); }

  // 2. 单参：getType
  try { p("[2] getType() -> " + L(dev.call("getType"))); }
  catch (e) { p("[2] getType FAIL: " + (e&&e.message||L(e))); }

  // 3. 带回调无参：getUuids
  var cbImpl = {
    onUuid: function () {},
    onConnectionStateChange: function () {},
    onServicesDiscovered: function () {}
  };

  // 4. 直接试：createBond()（无参，但会触发配对）
  try { p("[4] createBond() -> " + L(dev.call("createBond"))); }
  catch (e) { p("[4] createBond FAIL: " + (e&&e.message||L(e))); }

  // 5. 试 connectGatt 传 nullptr 当 callback
  try { p("[5] connectGatt(ctx,false,null) -> " + L(dev.call("connectGatt", ctx, false, null))); }
  catch (e) { p("[5] connectGatt(ctx,false,null) FAIL: " + (e&&e.message||L(e))); }

  // 6. 试 connectGatt 仅传 ctx，看错误提示参数
  try { p("[6] connectGatt(ctx) -> " + L(dev.call("connectGatt", ctx))); }
  catch (e) { p("[6] connectGatt(ctx) FAIL: " + (e&&e.message||L(e))); }

  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_conn3 = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== connectGatt v0.6.4 (多种 callback 传法) ===");

  var EV = (typeof globalThis !== "undefined") ? globalThis : this;
  if (!EV.__ev3) { EV.__ev3 = []; }
  EV.__ev3.length = 0;
  var push = function (s) { EV.__ev3.push(s); };

  var adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
  var dev = adapter.call("getRemoteDevice", "AA:BB:CC:DD:EE:FF");
  var ctx = g.getApplicationContext();
  p("dev=" + L(dev));
  p("bondState=" + L(dev.call("getBondState")));

  var implObj = {
    onConnectionStateChange: function (gatt, status, newState) { push("connState st=" + status + " ns=" + newState); },
    onServicesDiscovered: function (gatt, status) { push("svcDisc st=" + status); },
    onCharacteristicWrite: function (gatt, ch, status) { push("chrWrite st=" + status); },
    onMtuChanged: function (gatt, mtu, status) { push("mtu " + mtu + " st=" + status); }
  };

  var cb = null;
  var how = "";
  // 方法1: implement(全名字符串, obj)
  try {
    cb = g.implement("android.bluetooth.BluetoothGattCallback", implObj);
    how = "implement(string,obj)";
    p("[A] " + how + " -> " + L(cb));
  } catch (e) { p("[A] FAIL: " + (e&&e.message||L(e))); }

  var gatt = null;
  if (cb) {
    try {
      gatt = dev.call("connectGatt", ctx, false, cb);
      p("[A-conn] -> " + L(gatt));
    } catch (e) { p("[A-conn] FAIL: " + (e&&e.message||L(e))); }
  }

  // 如果失败，方法2：先拿 type 再 implement
  if (!gatt) {
    var cb2 = null;
    try {
      var T = g.type("android.bluetooth.BluetoothGattCallback");
      p("[B] type ref = " + L(T));
      cb2 = g.implement(T, implObj);
      p("[B] implement(T,obj) -> " + L(cb2));
    } catch (e) { p("[B] FAIL: " + (e&&e.message||L(e))); }
    if (cb2) {
      try {
        gatt = dev.call("connectGatt", ctx, false, cb2);
        p("[B-conn] -> " + L(gatt));
      } catch (e) { p("[B-conn] FAIL: " + (e&&e.message||L(e))); }
    }
  }

  // 方法3：直接传 function (SAM)
  if (!gatt) {
    try {
      var fn = function (gatt2, status, newState) { push("sam connState " + status + "/" + newState); };
      var cb3 = g.implement("android.bluetooth.BluetoothGattCallback", fn);
      p("[C] implement(string,fn) -> " + L(cb3));
      gatt = dev.call("connectGatt", ctx, false, cb3);
      p("[C-conn] -> " + L(gatt));
    } catch (e) { p("[C] FAIL: " + (e&&e.message||L(e))); }
  }

  // 等待
  var Thread = g.type("java.lang.Thread");
  var w = 0;
  while (w < 10000) {
    try { Thread.callStatic("sleep", 500); } catch (e) { break; }
    w += 500;
    if (EV.__ev3.length > 0) break;
  }
  p("等待 " + w + "ms, 回调 " + EV.__ev3.length + " 条");
  for (var i = 0; i < EV.__ev3.length; i++) p("  " + EV.__ev3[i]);

  if (gatt) {
    try {
      var svcs = gatt.call("getServices");
      var n = (svcs && typeof svcs.length === "number") ? svcs.length : 0;
      p("服务数: " + n);
      for (var j = 0; j < n; j++) {
        var u = "?"; try { u = svcs[j].call("getUuid"); } catch (e) {}
        p("  svc[" + j + "] " + L(u));
      }
    } catch (e) { p("getServices FAIL: " + (e&&e.message||L(e))); }
  }

  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_spp = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== SPP 经典蓝牙探测 v0.6.5 ===");

  var adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
  var dev = adapter.call("getRemoteDevice", "AA:BB:CC:DD:EE:FF");
  p("dev=" + L(dev));
  p("bondState=" + L(dev.call("getBondState")));
  p("type=" + L(dev.call("getType")));  // 1=BR/EDR(经典) 2=LE 3=DUAL 0=UNKNOWN

  // 列出设备支持的 UUID（经典部分）：先 createBond 已完成，试 fetchUuidsWithSdp
  try {
    var u = dev.call("getUuids");
    p("getUuids: " + L(u));
  } catch (e) { p("getUuids FAIL: " + (e&&e.message||L(e))); }

  // 创建 SPP socket（标准 SPP UUID 00001101-0000-1000-8000-00805F9B34FB）
  var sock = null;
  try {
    var UUID = g.type("java.util.UUID").callStatic("fromString", "00001101-0000-1000-8000-00805F9B34FB");
    p("UUID: " + L(UUID));
    sock = dev.call("createRfcommSocketToServiceRecord", UUID);
    p("socket: " + L(sock));
  } catch (e) { p("createRfcommSocket FAIL: " + (e&&e.message||L(e))); }

  if (sock) {
    // 同步 connect()
    try {
      sock.call("connect");
      p("connect() OK!");
      try { p("isConnected=" + L(sock.call("isConnected"))); } catch (e) {}
    } catch (e) { p("connect() FAIL: " + (e&&e.message||L(e))); }
  }

  p("=== 结束 ===");
  return lines.join("\n");
};

exports.bt_refl = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== 反射调用探测 v0.6.6 ===");

  // 拿 context
  var ctx = null;
  try { ctx = g.getApplicationContext ? g.getApplicationContext() : null; }
  catch (e) { try { ctx = g.callStatic("com.ai.assistance.operit.OperitApplication", "getContext"); } catch (e2) {} }
  p("[0] ctx=" + L(ctx));

  // 拿 device
  var dev = null;
  try {
    var adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
    dev = adapter.call("getRemoteDevice", "AA:BB:CC:DD:EE:FF");
    p("[1] dev=" + L(dev));
  } catch (e) { p("[1] FAIL: " + (e&&e.message||L(e))); return lines.join("\n"); }

  // 拿 Class 对象
  var D = null;
  try { D = g.callStatic("java.lang.Class", "forName", "android.bluetooth.BluetoothDevice"); p("[2] Class.forName -> " + L(D)); }
  catch (e) { p("[2] FAIL: " + (e&&e.message||L(e))); }

  // 试 D.getMethods()
  if (D && D.call) {
    try { var ms = D.call("getMethods"); p("[3] getMethods -> " + L(ms)); }
    catch (e) { p("[3] getMethods FAIL: " + (e&&e.message||L(e))); }
  }

  // 试直接反射 getMethod("connectGatt", ...) 然后 invoke
  var CbCls = null, Ctx2 = null, BoolCls = null;
  try { CbCls = g.callStatic("java.lang.Class", "forName", "android.bluetooth.BluetoothGattCallback"); p("[4] Callback class -> " + L(CbCls)); }
  catch (e) { p("[4] FAIL: " + (e&&e.message||L(e))); }
  try { Ctx2 = g.callStatic("java.lang.Class", "forName", "android.content.Context"); }
  catch (e) {}

  // 枚举 connectGatt 的方法签名（用 getMethods 拿到后遍历）
  var sig = [];
  try {
    var msAll = D.call("getMethods");
    if (msAll && msAll.length) {
      for (var i = 0; i < msAll.length; i++) {
        var nm = ""; try { nm = msAll[i].call("getName"); } catch (e) {}
        if (nm && nm.indexOf("connectGatt") >= 0) {
          var pts = null; try { pts = msAll[i].call("getParameterTypes"); } catch (e) {}
          var ps = [];
          if (pts && pts.length) { for (var j = 0; j < pts.length; j++) { try { ps.push("" + pts[j].call("getName")); } catch (e) { ps.push("?"); } } }
          sig.push(nm + "(" + ps.join(", ") + ")");
        }
      }
    }
  } catch (e) { p("[5] enumerate FAIL: " + (e&&e.message||L(e))); }
  p("[5] connectGatt 签名: " + (sig.length ? sig.join(" | ") : "(没枚举到)"));

  p("=== 结束 ===");
  return lines.join("\n");
};


exports.bt_conn4 = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== connectGatt v0.6.7 (new interface proxy) ===");
  var EV = (typeof globalThis !== "undefined") ? globalThis : this;
  if (!EV.__ev4) { EV.__ev4 = []; }
  EV.__ev4.length = 0;
  var push = function (s) { EV.__ev4.push(s); };
  var adapter = g.type("android.bluetooth.BluetoothAdapter").callStatic("getDefaultAdapter");
  var dev = adapter.call("getRemoteDevice", "AA:BB:CC:DD:EE:FF");
  var ctx = g.getApplicationContext();
  p("dev=" + L(dev) + " bond=" + L(dev.call("getBondState")));
  var implObj = {
    onConnectionStateChange: function (gatt, status, newState) { push("connState st=" + status + " ns=" + newState); },
    onServicesDiscovered: function (gatt, status) { push("svcDisc st=" + status); },
    onCharacteristicWrite: function (gatt, ch, status) { push("chrWrite st=" + status); },
    onMtuChanged: function (gatt, mtu, status) { push("mtu " + mtu + " st=" + status); }
  };
  var CB = "android.bluetooth.BluetoothGattCallback";
  var gatt = null;
  try {
    var T = g.type(CB);
    var cbD = new T(implObj);
    p("[D] new T(obj) -> " + L(cbD));
    gatt = dev.call("connectGatt", ctx, false, cbD);
    p("[D-conn] -> " + L(gatt));
  } catch (e) { p("[D] FAIL: " + (e && e.message || L(e))); }
  if (!gatt) {
    try {
      var T2 = g.type(CB);
      var cbE = T2.newInstance(implObj);
      p("[E] T.newInstance(obj) -> " + L(cbE));
      gatt = dev.call("connectGatt", ctx, false, cbE);
      p("[E-conn] -> " + L(gatt));
    } catch (e) { p("[E] FAIL: " + (e && e.message || L(e))); }
  }
  if (!gatt) {
    try {
      var cbF = g.implement(CB, implObj);
      var objArr = g.newInstance("java.util.ArrayList");
      objArr.call("add", ctx); objArr.call("add", false); objArr.call("add", cbF);
      p("[F] list size -> " + L(objArr.call("size")));
      var cbF2 = objArr.call("get", 2);
      p("[F] get(2) -> " + L(cbF2));
      gatt = dev.call("connectGatt", ctx, false, cbF2);
      p("[F-conn] -> " + L(gatt));
    } catch (e) { p("[F] FAIL: " + (e && e.message || L(e))); }
  }
  if (!gatt) {
    try {
      var act = g.getCurrentActivity ? g.getCurrentActivity() : null;
      p("[G] activity=" + L(act));
      if (act) {
        var cbG = g.implement(CB, implObj);
        gatt = dev.call("connectGatt", act, false, cbG);
        p("[G-conn] -> " + L(gatt));
      }
    } catch (e) { p("[G] FAIL: " + (e && e.message || L(e))); }
  }
  var Thread = g.type("java.lang.Thread");
  var w = 0;
  while (w < 12000) {
    try { Thread.callStatic("sleep", 500); } catch (e) { break; }
    w += 500;
    if (EV.__ev4.length > 0) break;
  }
  p("wait " + w + "ms, cb " + EV.__ev4.length);
  for (var i = 0; i < EV.__ev4.length; i++) p("  " + EV.__ev4[i]);
  if (gatt) {
    try {
      var svcs = gatt.call("getServices");
      var n = (svcs && typeof svcs.length === "number") ? svcs.length : 0;
      p("svc count: " + n);
      for (var j = 0; j < n; j++) {
        var u = "?"; try { u = svcs[j].call("getUuid"); } catch (e) {}
        p("  svc[" + j + "] " + L(u));
      }
    } catch (e) { p("getServices FAIL: " + (e && e.message || L(e))); }
  }
  p("=== end ===");
  return lines.join("\n");
};


exports.bt_iface = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== 接口 marker 类型探测 v0.6.8 ===");
  var CB = "android.bluetooth.BluetoothGattCallback";
  var implObj = { onConnectionStateChange: function (a,b,c) {} };
  var mk = null;
  try { mk = g.implement(CB, implObj); p("[1] marker=" + L(mk)); }
  catch (e) { p("[1] FAIL: " + (e && e.message || L(e))); return lines.join("\n"); }
  // 拿 marker 的真实类
  try {
    var cls = mk.call("getClass");
    p("[2] marker.getClass() -> " + L(cls));
    try { p("[2a] class.name -> " + L(mk.call("getClass").call("getName"))); } catch (e) { p("[2a] FAIL " + L(e)); }
  } catch (e) { p("[2] FAIL: " + (e && e.message || L(e))); }
  // 检查它是不是 instanceof BluetoothGattCallback
  try {
    var CBIface = g.type(CB);
    p("[3] CBIface=" + L(CBIface));
    var isInst = CBIface.call("isInstance", mk);
    p("[3a] CBIface.isInstance(marker) -> " + L(isInst));
  } catch (e) { p("[3] FAIL: " + (e && e.message || L(e))); }
  // 用 Class.forName + isAssignableFrom
  try {
    var c1 = mk.call("getClass");
    var nm = c1.call("getName");
    p("[4] marker 真实类名: " + nm);
    // 看这个类的接口列表
    var ifaces = c1.call("getInterfaces");
    var nn = (ifaces && typeof ifaces.length === "number") ? ifaces.length : 0;
    p("[4a] 实现的接口数: " + nn);
    for (var i = 0; i < nn; i++) {
      var in2 = "?"; try { in2 = ifaces[i].call("getName"); } catch (e) {}
      p("     iface[" + i + "] " + in2);
    }
  } catch (e) { p("[4] FAIL: " + (e && e.message || L(e))); }
  p("=== end ===");
  return lines.join("\n");
};


exports.bt_load = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== loadDex 测试 v0.7.0 ===");
  var path = (args && args.path) ? args.path : "/sdcard/Download/Operit/plugins/com.operit.bt_probe/dex/btbridge.dex";
  p("path=" + path);
  var loaded = null;
  try {
    loaded = g.loadDex(path);
    p("[1] loadDex -> " + L(loaded));
  } catch (e) { p("[1] loadDex FAIL: " + (e && e.message || L(e))); }
  // 调 hello
  try {
    var r = g.callStatic("com.shadow.bt.BtBridge", "hello");
    p("[2] BtBridge.hello() -> " + L(r));
  } catch (e) { p("[2] hello FAIL: " + (e && e.message || L(e))); }
  // 调 log/getLog
  try {
    g.callStatic("com.shadow.bt.BtBridge", "log", "from JS test");
    var lg = g.callStatic("com.shadow.bt.BtBridge", "getLog");
    p("[3] LOG -> " + L(lg));
  } catch (e) { p("[3] FAIL: " + (e && e.message || L(e))); }
  p("=== end ===");
  return lines.join("\n");
};


exports.bt_go = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== BtBridge 连接 PD01 v0.7.1 ===");
  var path = "/sdcard/Download/Operit/plugins/com.operit.bt_probe/dex/btbridge.dex";
  try { var lo = g.loadDex(path); p("[0] loaded: " + L(lo)); }
  catch (e) { p("[0] loadDex FAIL: " + (e && e.message || L(e))); return lines.join("\n"); }
  var ctx = g.getApplicationContext();
  p("[1] ctx=" + L(ctx));
  var mac = (args && args.mac) ? args.mac : "AA:BB:CC:DD:EE:FF";
  try {
    var st = g.callStatic("com.shadow.bt.BtBridge", "connect", ctx, mac);
    p("[2] connect() -> " + L(st));
  } catch (e) { p("[2] connect FAIL: " + (e && e.message || L(e))); }
  // 轮询读日志
  var Thread = g.type("java.lang.Thread");
  var all = "";
  for (var k = 0; k < 24; k++) {
    try { Thread.callStatic("sleep", 500); } catch (e) { break; }
    try {
      var lg = g.callStatic("com.shadow.bt.BtBridge", "getLog");
      if (lg) all += lg;
      var st2 = g.callStatic("com.shadow.bt.BtBridge", "status");
      if (k % 4 === 0) p("[t=" + ((k+1)*500) + "ms] " + L(st2));
    } catch (e) { p("poll FAIL: " + (e && e.message || L(e))); break; }
  }
  p("--- LOG 汇总 ---");
  var parts = all.split("|");
  for (var i = 0; i < parts.length; i++) { if (parts[i]) p("  " + parts[i]); }
  p("=== end ===");
  return lines.join("\n");
};


exports.bt_send = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== PD01 发送测试 v0.7.3 ===");
  var mac = (args && args.mac) ? args.mac : "AA:BB:CC:DD:EE:FF";
  var hex = (args && args.hex) ? args.hex : "5178a3000000";
  var path = "/sdcard/Download/Operit/plugins/com.operit.bt_probe/dex/btbridge.dex";
  try { g.loadDex(path); } catch (e) { p("loadDex FAIL: " + (e && e.message || L(e))); return lines.join("\n"); }
  var ctx = g.getApplicationContext();
  var Thread = g.type("java.lang.Thread");
  var drain = function (tag) {
    try {
      var lg = g.callStatic("com.shadow.bt.BtBridge", "getLog");
      var parts = (lg || "").split("|");
      for (var i = 0; i < parts.length; i++) if (parts[i]) p("[" + tag + "] " + parts[i]);
    } catch (e) { p(tag + " drain FAIL: " + (e && e.message || L(e))); }
  };
  // 1. 连接
  try { g.callStatic("com.shadow.bt.BtBridge", "connect", ctx, mac); } catch (e) { p("connect FAIL: " + L(e)); }
  for (var k = 0; k < 8; k++) {
    try { Thread.callStatic("sleep", 500); } catch (e) { break; }
    var st = g.callStatic("com.shadow.bt.BtBridge", "status");
    if (String(st).indexOf("svcReady=true") >= 0) break;
  }
  drain("1conn");
  p("status: " + L(g.callStatic("com.shadow.bt.BtBridge", "status")));
  // 2. 开通知
  try { g.callStatic("com.shadow.bt.BtBridge", "enableNotify"); } catch (e) { p("enableNotify FAIL: " + L(e)); }
  try { Thread.callStatic("sleep", 800); } catch (e) {}
  drain("2notify");
  // 3. 发 hex
  try { g.callStatic("com.shadow.bt.BtBridge", "writeHex", hex); } catch (e) { p("writeHex FAIL: " + L(e)); }
  try { Thread.callStatic("sleep", 800); } catch (e) {}
  drain("3write");
  p("最终 status: " + L(g.callStatic("com.shadow.bt.BtBridge", "status")));
  p("=== end ===");
  return lines.join("\n");
};


exports.bt_print = function (args) {
  var lines = [];
  var p = function (s) { lines.push(s); };
  var g = (typeof Java !== "undefined" && Java) ? Java : null;
  if (!g) { return "Java Bridge 不可用"; }
  p("=== 打第一张 v0.8.0 ===");
  var mac = (args && args.mac) ? args.mac : "AA:BB:CC:DD:EE:FF";
  var path = (args && args.path) ? args.path : "/sdcard/Download/Operit/plugins/com.operit.bt_probe/dex/first.bin";
  var dpath = "/sdcard/Download/Operit/plugins/com.operit.bt_probe/dex/btbridge.dex";
  try { g.loadDex(dpath); } catch (e) { p("loadDex FAIL: " + (e && e.message || L(e))); return lines.join("\n"); }
  var ctx = g.getApplicationContext();
  var Thread = g.type("java.lang.Thread");
  var drain = function (tag) {
    try {
      var lg = g.callStatic("com.shadow.bt.BtBridge", "getLog");
      var parts = (lg || "").split("|");
      for (var i = 0; i < parts.length; i++) if (parts[i]) p("[" + tag + "] " + parts[i]);
    } catch (e) {}
  };
  try {
    g.callStatic("com.shadow.bt.BtBridge", "printBitmap", ctx, mac, path);
  } catch (e) { p("printBitmap FAIL: " + (e && e.message || L(e))); }
  p("status: " + L(g.callStatic("com.shadow.bt.BtBridge", "status")));
  drain("P");
  p("=== end ===");
  return lines.join("\n");
};
