package com.digitalmate.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import org.json.JSONObject

/**
 * Trusted Caller Recovery — when a trusted number calls the phone, report each ring to the
 * backend, which activates recovery once the configured count is reached within the window.
 * Trusted numbers + count/window are user-configured (stored via DigitalMatePlugin.configure).
 */
class CallTriggerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return
        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
        if (state != TelephonyManager.EXTRA_STATE_RINGING) return
        val number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: return

        val trusted = Backend.prefs(context).getString(Backend.KEY_TRUSTED, "") ?: ""
        val norm = number.replace(" ", "")
        val isTrusted = trusted.split(",").any { it.isNotBlank() && norm.endsWith(it.replace(" ", "").takeLast(7)) }
        if (!isTrusted) return

        // Backend counts calls per number within the configured window and triggers recovery.
        Backend.post(context, "recovery/call-trigger", JSONObject().apply {
            put("from_number", number)
        })
    }
}
