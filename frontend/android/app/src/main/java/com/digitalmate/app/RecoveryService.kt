package com.digitalmate.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import org.json.JSONObject

/**
 * Background recovery service. When the phone is in Lost Mode it keeps reporting the device's
 * location to the backend even with the app closed. Runs as a foreground service (Android
 * requirement for background location) with a low-key notification.
 */
class RecoveryService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private val intervalMs = 2 * 60 * 1000L  // every 2 minutes

    private val reporter = object : Runnable {
        override fun run() {
            reportLocation()
            handler.postDelayed(this, intervalMs)
        }
    }

    override fun onCreate() {
        super.onCreate()
        startForeground(42, buildNotification())
        handler.post(reporter)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        handler.removeCallbacks(reporter)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun reportLocation() {
        try {
            val lm = getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            var best: Location? = null
            for (p in providers) {
                val loc = try { lm.getLastKnownLocation(p) } catch (_: SecurityException) { null }
                if (loc != null && (best == null || loc.time > best!!.time)) best = loc
            }
            best?.let {
                Backend.post(this, "recovery/locate", JSONObject().apply {
                    put("lat", it.latitude); put("lng", it.longitude)
                })
            }
        } catch (_: Exception) { /* best-effort */ }
    }

    private fun buildNotification(): Notification {
        val channelId = "dm_recovery"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(
                NotificationChannel(channelId, "System service", NotificationManager.IMPORTANCE_MIN))
        }
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            Notification.Builder(this, channelId) else @Suppress("DEPRECATION") Notification.Builder(this)
        return builder
            .setContentTitle("System service")
            .setContentText("Running")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .build()
    }
}
