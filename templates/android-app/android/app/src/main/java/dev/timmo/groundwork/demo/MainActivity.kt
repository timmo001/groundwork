/**
 * The demo's activity: the shell, plus the app's own requests beside the
 * shell's. `battery` reads the charge, and `ongoing` counts a pretend
 * download down as ongoing work, a Live Update on Android 16.
 */
package dev.timmo.groundwork.demo

import android.os.BatteryManager
import android.os.Handler
import android.os.Looper
import dev.timmo.groundwork.shell.Bridge
import dev.timmo.groundwork.shell.ShellActivity
import org.json.JSONObject

class MainActivity : ShellActivity() {
  private val main = Handler(Looper.getMainLooper())

  override fun onBridgeReady(bridge: Bridge) {
    bridge.handle("battery") { _, reply ->
      reply.ok(
        getSystemService(BatteryManager::class.java)
          .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
      )
    }

    bridge.handle("ongoing") { request, reply ->
      val id = request.paramsObject.optString("id", "download")
      val steps = request.paramsObject.optInt("steps", 10)

      fun step(done: Int) {
        val ongoing =
          JSONObject()
            .put("id", id)
            .put("status", if (done == steps) "Done" else "${done * 100 / steps}%")
            .put("progress", JSONObject().put("value", done).put("max", steps))
            .put("done", done == steps)

        notifications.showOngoing("Downloading firmware 1.21", ongoing, "groundwork-demo://#phone")

        if (done < steps) main.postDelayed({ step(done + 1) }, 1_000)
      }

      withNotificationPermission { granted ->
        if (granted) step(0)
        reply.ok(granted)
      }
    }
  }
}
