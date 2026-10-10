# operit-bt-printer

> 用 Operit ToolPkg + `loadDex` 绕过 Java Bridge 回调限制，直接控制 **PD01 系热敏打印机**（猫机 / 喵喵机 / Paperang 系）。

## 这是什么

Operit 的 Java Bridge 有一个众所周知的限制：**不能把 JS 回调传给需要重载匹配的方法**（典型就是 `BluetoothDevice.connectGatt(ctx, false, callback)`，会报 `no method matched`）。

本项目给出一个彻底绕过的方案：**自编一个 Java 类，编译成 dex，用 `Java.loadDex` 加载，在 Java 内部完成 BLE 回调与协议发送**。

于是：**JS 侧只管调工具，蓝牙回调与打印机协议全在 Java 里跑。**

## 适用设备

| 项 | 值 |
|---|---|
| 机器 | AiM12 迷你热敏打印机 及 PD01 系同类 |
| 蓝牙名 | `PD01` |
| 类型 | 纯 BLE（无经典 SPP） |
| 协议系 | 猫机 / 喵喵机（Paperang）系 |

## 能力

- 连接 PD01，自动发现服务 / 特征
- 发送任意十六进制协议包（`bt_send`）
- 把 384 像素宽 1-bit 位图打印到热敏纸（`bt_print`）

## 目录结构

```
plugin/            Operit ToolPkg 插件
  manifest.json
  dist/main.js
  dist/packages/bt_probe_tools.js
  dex/btbridge.dex          自编 Java 类编译产物
src/
  com/shadow/bt/BtBridge.java   核心 Java 类
 tools/
  render.py          文字 -> 384宽1bit位图 渲染器
 docs/
  PROTOCOL.md        PD01 协议速查
```

## 快速开始

### 1. 安装插件
在 Operit 中用「➕ 导入 .toolpkg」导入打包好的插件。

### 2. 准备位图（Ubuntu / Linux 侧）

```bash
pip install pillow
apt install fonts-wqy-microhei
python3 tools/render.py <输出.bin> <字号> <行高> <文字文件.txt>
```

### 3. 打印

用 `bt_probe_tools:bt_print` 工具，传入 `mac` 与位图路径即可。

## 编译 Java 类（换版本时用）

```bash
# 1) 装 JDK21
apt install default-jdk-headless

# 2) 拖 d8（r8.jar）与 android.jar
curl -sL -o /tmp/r8.jar https://maven.google.com/com/android/tools/r8/8.3.37/r8-8.3.37.jar
curl -sL -o /tmp/android.jar https://raw.githubusercontent.com/Sable/android-platforms/master/android-34/android.jar

# 3) 编译
javac -source 8 -target 8 -bootclasspath /tmp/android.jar -d out src/com/shadow/bt/BtBridge.java

# 4)转 dex（输出目录必须先存在！）
mkdir -p dexout
java -cp /tmp/r8.jar com.android.tools.r8.D8 --min-api 24 --output dexout out/com/shadow/bt/*.class
```

## 关键坑（踩过的）

1. **CRC8 只算数据段**，不含 CMD / 长度——算错会“连上但不响应”。
2. Java Bridge 传回调 marker 给重载方法 → `no method matched`。反射也死（`Class.forName` 只返回字符串）。
3. Debian 的 `android-sdk-build-tools` **不带 d8/dx**，必须从 google maven 拖 r8.jar。
4. d8 的 `--output` 目录 **必须先存在**，否则报错。
5. 插件安装**走 Operit UI 的 ➕ 导入**，别手改 cache（会被判包损坏并清配置）。

## 致谢

- PD01 协议参考自开源项目 **PyCatPrint**（https://github.com/De-pitcher/PyCatPrint）。本项目只是借鉴其逆向出的协议文档与包格式，代码为独立实现。
- Operit 平台：https://github.com/AAswordman/Operit

## 许可

**GPL-3.0** —— 可自由使用 / 修改 / 分发，但**必须保留原作者署名（shadow / https://github.com/Shadow-0531），且衍生作品必须以同样许可开源**。

---

· shadow
