package com.digitalmate.app

import android.app.admin.DevicePolicyManager
import android.bluetooth.BluetoothManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * DigitalMateNative — bridges the React UI to real Android security capabilities.
 * On-device only; methods no-op / report unavailable on web.
 */
@CapacitorPlugin(name = "DigitalMateNative")
class DigitalMatePlugin : Plugin() {

    private fun adminComponent() = ComponentName(context, DigitalMateDeviceAdminReceiver::class.java)
    private fun dpm() = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    /** Store backend URL + device id + trusted-call pattern so background receivers can report. */
    @PluginMethod
    fun configure(call: PluginCall) {
        val p = Backend.prefs(context).edit()
        call.getString("backendUrl")?.let { p.putString(Backend.KEY_BASE_URL, it) }
        call.getString("deviceId")?.let { p.putString(Backend.KEY_DEVICE_ID, it) }
        call.getString("trustedNumbers")?.let { p.putString(Backend.KEY_TRUSTED, it) }
        p.putInt(Backend.KEY_CALL_COUNT, call.getInt("callCount", 3) ?: 3)
        p.putInt(Backend.KEY_CALL_WINDOW, call.getInt("callWindowSec", 300) ?: 300)
        p.apply()
        call.resolve(JSObject().put("ok", true))
    }

    @PluginMethod
    fun isAdminActive(call: PluginCall) {
        call.resolve(JSObject().put("active", dpm().isAdminActive(adminComponent())))
    }

    @PluginMethod
    fun requestDeviceAdmin(call: PluginCall) {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent())
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "Digital Mate needs device-admin rights to remotely lock or wipe your phone if it's stolen.")
        }
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        call.resolve(JSObject().put("requested", true))
    }

    /** Remotely lock the whole device (requires active device admin). */
    @PluginMethod
    fun lockNow(call: PluginCall) {
        val mgr = dpm()
        if (!mgr.isAdminActive(adminComponent())) {
            call.reject("Device admin not active")
            return
        }
        mgr.lockNow()
        call.resolve(JSObject().put("locked", true))
    }

    /** Factory-reset wipe (requires active device admin). Owner-confirmed in the UI before calling. */
    @PluginMethod
    fun wipeDevice(call: PluginCall) {
        val mgr = dpm()
        if (!mgr.isAdminActive(adminComponent())) {
            call.reject("Device admin not active")
            return
        }
        mgr.wipeData(0)
        call.resolve(JSObject().put("wiped", true))
    }

    /** SIM serial (returns null on Android 10+ for non-privileged apps — SIM-change is detected via broadcast). */
    @PluginMethod
    fun getSimSerial(call: PluginCall) {
        val serial = try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            @Suppress("DEPRECATION", "HardwareIds") tm.simSerialNumber
        } catch (_: Exception) { null }
        call.resolve(JSObject().put("serial", serial))
    }

    /** Bonded Bluetooth devices (owner's watch/car/earbuds) for owner-recognition. */
    @PluginMethod
    fun getBondedDevices(call: PluginCall) {
        val names = JSObject()
        val arr = mutableListOf<String>()
        try {
            val bm = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
            bm.adapter?.bondedDevices?.forEach { arr.add(it.name ?: it.address) }
        } catch (_: Exception) { /* needs BLUETOOTH_CONNECT permission */ }
        val res = JSObject()
        res.put("devices", com.getcapacitor.JSArray(arr))
        call.resolve(res)
    }

    @PluginMethod
    fun startRecoveryService(call: PluginCall) {
        val i = Intent(context, RecoveryService::class.java)
        context.startForegroundService(i)
        call.resolve(JSObject().put("started", true))
    }

    @PluginMethod
    fun stopRecoveryService(call: PluginCall) {
        context.stopService(Intent(context, RecoveryService::class.java))
        call.resolve(JSObject().put("stopped", true))
    }
}
