plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.paparazzi)
    `maven-publish`
}

android {
    namespace = "codes.tony.mortar"
    // Paparazzi 1.3 renders with Android 14's layoutlib.
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        consumerProguardFiles("consumer-rules.pro")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

// Every public declaration says so; tests are exempt.
kotlin {
    explicitApi()
}

dependencies {
    implementation(platform(libs.compose.bom))
    api(libs.compose.foundation)
    api(libs.compose.ui)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    testImplementation(libs.junit)
}

// Released to GitHub Packages by .github/workflows/publish-android.yml, at the
// version of the npm release (-Pversion), with the run's GITHUB_TOKEN.
// `publishToMavenLocal` builds the artefact locally without credentials.
publishing {
    publications {
        register<MavenPublication>("release") {
            groupId = "codes.tony"
            artifactId = "mortar"
            version = (findProperty("version") as String?)?.takeUnless { it == "unspecified" } ?: "0.0.0-local"
            afterEvaluate { from(components["release"]) }
            pom {
                name.set("Mortar for Jetpack Compose")
                description.set("Mortar's design tokens and core components for Android.")
                url.set("https://github.com/tonycodes/mortar")
                licenses {
                    license {
                        name.set("MIT")
                        url.set("https://github.com/tonycodes/mortar/blob/main/LICENSE")
                    }
                }
            }
        }
    }
    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/tonycodes/mortar")
            credentials {
                username = System.getenv("GITHUB_ACTOR")
                password = System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
