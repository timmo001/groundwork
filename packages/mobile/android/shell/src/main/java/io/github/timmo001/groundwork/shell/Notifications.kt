/**
 * The shell's notification channels and the `notify` request: a Notice from
 * the view becomes a system notification that opens its link on a tap.
 */
package io.github.timmo001.groundwork.shell

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject

class Notifications(private val context: Context, private val config: ShellConfig) {
  /** Creates the channels; the system keeps the person's settings for each. */
  fun createChannels() {
    val manager = context.getSystemService(NotificationManager::class.java)

    manager.createNotificationChannels(
      listOf(
        NotificationChannel(
          CHANNEL_NOTICES,
          config.labels.notifications,
          NotificationManager.IMPORTANCE_DEFAULT,
        ),
        NotificationChannel(CHANNEL_ONGOING, config.labels.ongoing, NotificationManager.IMPORTANCE_LOW),
      )
    )
  }

  /** Whether a notification can show now. */
  val allowed: Boolean
    get() =
      config.notifications &&
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
          PackageManager.PERMISSION_GRANTED &&
        NotificationManagerCompat.from(context).areNotificationsEnabled()

  /**
   * Shows a Notice (`heading`, `body`, `tag`, `link`), or returns false when
   * notifications are off or not allowed, for the view to show it itself.
   */
  fun show(notice: JSONObject, activity: Class<*>): Boolean {
    if (!allowed) return false

    val heading = notice.optString("heading").ifEmpty { return false }
    val tag = notice.optString("tag").ifEmpty { null }
    val open =
      Intent(context, activity).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        notice.optString("link").ifEmpty { null }?.let { data = Uri.parse(it) }
        action = Intent.ACTION_VIEW
      }
    val tap =
      PendingIntent.getActivity(
        context,
        (tag ?: heading).hashCode(),
        open,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )
    val notification =
      NotificationCompat.Builder(context, CHANNEL_NOTICES)
        .setSmallIcon(context.applicationInfo.icon)
        .setContentTitle(heading)
        .apply { notice.optString("body").ifEmpty { null }?.let(::setContentText) }
        .setContentIntent(tap)
        .setAutoCancel(true)
        .build()

    @Suppress("MissingPermission")
    NotificationManagerCompat.from(context).notify(tag, if (tag == null) nextId++ else 0, notification)

    return true
  }

  companion object {
    const val CHANNEL_NOTICES = "groundwork.notices"
    const val CHANNEL_ONGOING = "groundwork.ongoing"

    private var nextId = 1
  }
}
