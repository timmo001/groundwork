/**
 * Builds the Android shell module on its own, to check it here. Apps take
 * only `shell/` through the sync and include it from their own settings.
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

rootProject.name = "groundwork-mobile"

include(":shell")
