package com.digitalmate.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import org.json.JSONObject

/**
 * SIM change detection. SIM_STATE_CHANGED fires when a SIM is removed or a new one is inserted.
 * (The SIM serial itself isn't readable by non-privileged apps on Android 10+, so we key off the
 * state transition, which is a strong theft signal.) Reports to the backend, which escalates to
 * recovery + owner alert.
 */
class SimChangeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (!action.contains("SIM_STATE_CHANGED", true) && action != Intent.ACTION_BOOT_COMPLETED) return

        val state = try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            tm.simState
        } catch (_: Exception) { TelephonyManager.SIM_STATE_UNKNOWN }

        val prefs = Backend.prefs(context)
        val last = prefs.getInt("last_sim_state", -1)
        if (state == last) return
        prefs.edit().putInt("last_sim_state", state).apply()

        // Only report meaningful transitions (absent or freshly loaded), not the first boot read.
        if (last != -1 && (state == TelephonyManager.SIM_STATE_ABSENT || state == TelephonyManager.SIM_STATE_READY)) {
            val desc = if (state == TelephonyManager.SIM_STATE_ABSENT) "SIM removed" else "New SIM inserted"
            Backend.post(context, "device-change", JSONObject().apply {
                put("kind", "sim")
                put("detail", desc)
            })
        }
    }
}
