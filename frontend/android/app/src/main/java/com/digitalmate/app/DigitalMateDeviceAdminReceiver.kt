package com.digitalmate.app

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONObject

/** Device Admin receiver — enables remote lock / wipe and detects admin-disable attempts. */
class DigitalMateDeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        // Warn (and log) when someone tries to remove Digital Mate's protection.
        Backend.post(context, "events", JSONObject().apply {
            put("type", "device_change")
            put("severity", "critical")
            put("title", "Device-admin removal attempted")
            put("detail", "Someone tried to disable Digital Mate's device administrator rights.")
        })
        return "Disabling Digital Mate removes theft protection. Are you sure?"
    }
}
