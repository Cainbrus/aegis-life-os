package com.digitalmate.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONObject

/**
 * Hidden dial-code access. Dialing a secret code (e.g. *#*#2468#*#*) fires the Android
 * SECRET_CODE broadcast. We trigger recovery via the backend's recovery-phrase path.
 * The host (digits) is configured in the manifest <data android:host="..."/>.
 */
class SecretCodeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val host = intent.data?.host ?: return
        Backend.post(context, "recovery/trigger", JSONObject().apply {
            put("secret", host)   // backend matches against the owner's recovery phrase/pattern/code
        })
    }
}
