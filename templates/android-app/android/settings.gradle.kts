/**
 * The demo's Gradle build: the app module, and the shell module from
 * `packages/mobile/android/shell`. An app made from the template takes the
 * shell through the sync into `shell/` and points `projectDir` there.
 */
pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
  }
}

rootProject.name = "android-app"

include(":app", ":shell")

project(":shell").projectDir = file("../../../packages/mobile/android/shell")
