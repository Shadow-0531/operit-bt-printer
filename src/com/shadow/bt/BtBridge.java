
package com.shadow.bt;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import java.util.List;
import java.util.UUID;

public class BtBridge {
    public static final StringBuilder LOG = new StringBuilder();
    public static volatile int connState = -1;
    public static volatile int lastStatus = -1;
    public static volatile boolean servicesReady = false;
    public static volatile BluetoothGatt gatt = null;
    public static volatile BluetoothGattCharacteristic wChr = null;
    public static volatile BluetoothGattCharacteristic nChr = null;
    public static volatile int writesOk = 0;

    public static final UUID SVC = UUID.fromString("0000ae30-0000-1000-8000-00805f9b34fb");
    public static final UUID CH_W = UUID.fromString("0000ae01-0000-1000-8000-00805f9b34fb");
    public static final UUID CH_N = UUID.fromString("0000ae02-0000-1000-8000-00805f9b34fb");
    public static final UUID CCCD = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    public static void log(String s) { LOG.append(s).append("|"); }
    public static String getLog() { String s = LOG.toString(); LOG.setLength(0); return s; }
    public static String status() { return "connState=" + connState + " svcReady=" + servicesReady + " writes=" + writesOk; }

    public static String connect(Context ctx, String mac) {
        log("connect:start " + mac);
        try {
            BluetoothAdapter ad = BluetoothAdapter.getDefaultAdapter();
            BluetoothDevice dev = ad.getRemoteDevice(mac);
            connState = -1; servicesReady = false; writesOk = 0;
            gatt = dev.connectGatt(ctx, false, new Cb());
            log("connectGatt=" + (gatt != null));
        } catch (Throwable t) { log("EX:" + t.toString()); }
        return status();
    }

    public static String enableNotify() {
        try {
            if (gatt == null || nChr == null) { log("notify: not ready"); return status(); }
            gatt.setCharacteristicNotification(nChr, true);
            BluetoothGattDescriptor d = nChr.getDescriptor(CCCD);
            if (d != null) {
                d.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                boolean ok = gatt.writeDescriptor(d);
                log("enableNotify desc write=" + ok);
            } else {
                log("enableNotify: no CCCD");
            }
        } catch (Throwable t) { log("enableNotify EX:" + t); }
        return status();
    }

    public static String writeHex(String hex) {
        try {
            if (gatt == null || wChr == null) { log("write: not ready"); return status(); }
            String h = hex.replaceAll("\\s+", "");
            int n = h.length() / 2;
            byte[] b = new byte[n];
            for (int i = 0; i < n; i++) {
                b[i] = (byte) Integer.parseInt(h.substring(i*2, i*2+2), 16);
            }
            wChr.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE);
            wChr.setValue(b);
            boolean ok = gatt.writeCharacteristic(wChr);
            if (ok) writesOk++;
            log("writeHex len=" + n + " sent=" + ok);
        } catch (Throwable t) { log("writeHex EX:" + t); }
        return status();
    }

    static class Cb extends BluetoothGattCallback {
        @Override
        public void onConnectionStateChange(BluetoothGatt g, int status, int newState) {
            lastStatus = status; connState = newState;
            log("cb:conn st=" + status + " ns=" + newState);
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                log("discover...");
                g.discoverServices();
            }
        }
        @Override
        public void onServicesDiscovered(BluetoothGatt g, int status) {
            log("cb:svcDisc st=" + status);
            try {
                BluetoothGattService s = g.getService(SVC);
                if (s == null) { log("NO ae30 service!"); return; }
                wChr = s.getCharacteristic(CH_W);
                nChr = s.getCharacteristic(CH_N);
                log("wChr=" + (wChr != null) + " nChr=" + (nChr != null));
                servicesReady = true;
            } catch (Throwable t) { log("cb:svcEX " + t); }
        }
        @Override
        public void onDescriptorWrite(BluetoothGatt g, BluetoothGattDescriptor d, int status) {
            log("cb:descWrite " + d.getUuid() + " st=" + status);
        }
        @Override
        public void onCharacteristicWrite(BluetoothGatt g, BluetoothGattCharacteristic c, int status) {
            log("cb:chrWrite " + c.getUuid() + " st=" + status);
        }
        @Override
        public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) {
            byte[] v = c.getValue();
            StringBuilder sb = new StringBuilder();
            if (v != null) for (byte x : v) sb.append(String.format("%02x", x));
            log("cb:NOTIFY " + c.getUuid() + " = " + sb.toString());
        }
    }


    // ===== 打印相关 =====
    public static final int CMD_BITMAP = 0xA2;
    public static final int CMD_FEED = 0xA1;
    public static final int CMD_LATTICE = 0xA6;
    public static final int CMD_STATE = 0xA3;
    public static volatile int printRows = 0;

    static int crc8(byte[] data) {
        int c = 0;
        for (byte b : data) {
            c ^= (b & 0xFF);
            for (int i = 0; i < 8; i++) {
                if ((c & 0x80) != 0) c = ((c << 1) ^ 0x07) & 0xFF;
                else c = (c << 1) & 0xFF;
            }
        }
        return c;
    }

    static byte[] pkt(int cmd, byte[] data) {
        int n = data == null ? 0 : data.length;
        byte[] p = new byte[2 + 4 + n + 2];
        p[0] = 0x51; p[1] = 0x78;
        p[2] = (byte) cmd; p[3] = 0x00;
        p[4] = (byte)(n & 0xFF); p[5] = (byte)((n >> 8) & 0xFF);
        if (n > 0) System.arraycopy(data, 0, p, 6, n);
        p[6 + n] = (byte) crc8(data == null ? new byte[0] : data);
        p[7 + n] = (byte) 0xFF;
        return p;
    }

    static boolean sendBlocking(byte[] p, int delayMs) {
        try {
            wChr.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE);
            wChr.setValue(p);
            boolean ok = gatt.writeCharacteristic(wChr);
            if (ok) writesOk++;
            if (delayMs > 0) { try { Thread.sleep(delayMs); } catch (InterruptedException e) {} }
            return ok;
        } catch (Throwable t) { log("sendBlocking EX:" + t); return false; }
    }

    public static String printBitmap(Context ctx, String mac, String path) {
        log("print:start " + path);
        try {
            // 连接
            if (gatt == null || connState != 2) {
                connect(ctx, mac);
                for (int i = 0; i < 20; i++) { Thread.sleep(300); if (servicesReady) break; }
            }
            if (!servicesReady) { log("print: no services"); return status(); }
            // 读文件
            java.io.File f = new java.io.File(path);
            byte[] img = new byte[(int) f.length()];
            java.io.FileInputStream fis = new java.io.FileInputStream(f);
            int rd = 0; while (rd < img.length) { int r = fis.read(img, rd, img.length - rd); if (r < 0) break; rd += r; }
            fis.close();
            int rows = img.length / 48;
            printRows = rows;
            log("img bytes=" + img.length + " rows=" + rows);

            // 1. 质量
            sendBlocking(pkt(CMD_BITMAP, new byte[]{0x32}), 30);
            // 2. lattice init
            sendBlocking(pkt(CMD_LATTICE, new byte[]{(byte)0xAA,0x55,0x17,0x38,0x44,0x5F,0x5F,0x5F,0x44,0x38,0x2C}), 30);
            // 3. 逐行位图
            byte[] row = new byte[48];
            for (int i = 0; i < rows; i++) {
                System.arraycopy(img, i*48, row, 0, 48);
                sendBlocking(pkt(CMD_BITMAP, row), 12);
            }
            log("rows sent=" + rows);
            // 4. 走纸
            sendBlocking(pkt(CMD_FEED, new byte[]{0x30, 0x00}), 30);
            // 5. finish lattice
            sendBlocking(pkt(CMD_LATTICE, new byte[]{(byte)0xAA,0x55,0x17,0,0,0,0,0,0,0,0x17}), 30);
            // 6. 查状态
            sendBlocking(pkt(CMD_STATE, new byte[]{0x00}), 30);
            log("print:DONE");
        } catch (Throwable t) { log("print EX:" + t.toString()); }
        return status();
    }

}
