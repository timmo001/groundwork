/**
 * The app module: the demo's activity, manifest and icon on the shell.
 * `GROUNDWORK_DEV_URL` points debug builds at a dev server instead of the
 * bundled page, such as http://localhost:7370/ through `adb reverse`.
 */
plugins { id("com.android.application") }

android {
  namespace = "io.github.timmo001.groundwork.demo"
  compileSdk { version = release(37) { minorApiLevel = 2 } }
  buildToolsVersion = "37.0.0"

  defaultConfig {
    applicationId = "io.github.timmo001.groundwork.demo"
    minSdk = 34
    targetSdk = 37
    versionCode = 1
    versionName = "0.1.0"
    manifestPlaceholders["devUrl"] = ""
  }

  buildTypes {
    debug { manifestPlaceholders["devUrl"] = System.getenv("GROUNDWORK_DEV_URL") ?: "" }
    release {
      isMinifyEnabled = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
}

dependencies { implementation(project(":shell")) }
