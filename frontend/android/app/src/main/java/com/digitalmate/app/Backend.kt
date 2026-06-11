package com.digitalmate.app

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Small helper that lets the native receivers/services talk to the Digital Mate backend.
 * The JS layer calls DigitalMatePlugin.configure() once to store the backend URL + device id
 * (and the user-defined trusted numbers / call-trigger pattern) in SharedPreferences.
 */
object Backend {
    const val PREFS = "digital_mate"
    const val KEY_BASE_URL = "backend_url"
    const val KEY_DEVICE_ID = "device_id"
    const val KEY_TRUSTED = "trusted_numbers"      // comma separated
    const val KEY_CALL_COUNT = "call_count"
    const val KEY_CALL_WINDOW = "call_window_sec"

    fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun baseUrl(ctx: Context): String? = prefs(ctx).getString(KEY_BASE_URL, null)
    fun deviceId(ctx: Context): String? = prefs(ctx).getString(KEY_DEVICE_ID, null)

    /** Fire-and-forget POST of JSON to /api/security/<path>. */
    fun post(ctx: Context, path: String, body: JSONObject) {
        val base = baseUrl(ctx) ?: return
        val devId = deviceId(ctx) ?: return
        body.put("device_id", devId)
        thread {
            try {
                val url = URL("$base/api/security/$path")
                (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                    connectTimeout = 10000
                    readTimeout = 10000
                    outputStream.use { it.write(body.toString().toByteArray()) }
                    inputStream.use { it.readBytes() }
                    disconnect()
                }
            } catch (_: Exception) { /* best-effort; receivers must never crash */ }
        }
    }
}
