# Native apps

Mortar is coming to iPhone, iPad and Android as a SwiftUI package and a Jetpack Compose library, tracked in [#95](https://github.com/tonycodes/mortar/issues/95). This page covers what exists so far: the design tokens both libraries are built on, and the first SwiftUI and Jetpack Compose components.

The playground's **Native gallery** (`?page=native`) shows each component on the web beside its SwiftUI and Compose snapshot references, in light, dark and large text.

Agents: `get_guide native` (or `npx mortar guide native`) returns this page. Components that already have native ports declare them on their catalogue entry as `platforms` (see below); `search_components` and `get_component` surface that field.

## Tokens

SwiftUI and Compose cannot read `tokens.css`, so each library gets its tokens as literal values in a generated file:

| Platform | File                                                                      | Colours                                            |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| Apple    | `native/apple/Sources/Mortar/MortarTokens.swift`                          | `UInt32`, `0xRRGGBB`                               |
| Android  | `native/android/mortar/src/main/kotlin/codes/tony/mortar/MortarTokens.kt` | `Long`, `0xFFRRGGBB`, the form `Color(Long)` takes |

Each file holds:

- `MortarTokens.light` and `MortarTokens.dark`: a `MortarPalette` for each appearance. Its colours mirror the `--m-*` tokens: `paper`, `surface`, `sunken`, `line`, `lineStrong`, `ink`, `secondary`, `muted`, the four status colours and `onFeedback`, `primary` with `primaryHover`, `primaryActive` and `onPrimary`, `accent` and `onAccent`, `focus`, `link`, `selected`, and the code block colours.
- `MortarTokens.compact`, `comfortable` and `spacious`: a `MortarDensity` with the control height, padding, font size and row padding.
- The scales, named after their CSS properties: `space1` to `space12`, `radiusXs` to `radiusFull` (`radius` is `--m-radius`), `weightRegular` to `weightBold`, `trackingDisplay` to `trackingCaps` (in em), `leadingDisplay` to `leadingBody`, `icon`, `focusOffset`, `touchTarget` and `scrimOpacity`. Sizes are in points on Apple and dp on Android.

`touchTarget` is Mortar's 44. Material asks for 48dp on Android, so the Compose components will use the larger of the two.

## SwiftUI

Add the package in Xcode (File > Add Package Dependencies…) or in `Package.swift`, from this repository's URL and a release tag:

```swift
.package(url: "https://github.com/tonycodes/mortar", from: "0.17.0")
```

It needs iOS 17, iPadOS 17 or macOS 14. Theme the app once near its root, then use the components:

```swift
import Mortar

@main
struct HiveApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView().mortarTheme(.neutral)
        }
    }
}

MortarButton("Save", variant: .primary) { save() }
Button("Cancel", action: cancel).buttonStyle(.mortar(.ghost))
```

A brand is a `MortarTheme`: its light and dark `MortarPalette`s, font family names (registered by the app) and density. Every component reads the palette that matches the colour scheme, and scales its text with Dynamic Type.

| Component                                                  | Web equivalent | Notes                                                                                                                                                                                                  |
| ---------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MortarButton`, `.buttonStyle(.mortar(_:size:isLoading:))` | Button         | `primary` (the default, as on the web), `secondary`, `ghost`, `danger`, `accent`; `sm`, `md`, `lg`; loading; SF Symbol, icon-only with the title as its accessible name. Medium is at least 44pt tall. |
| `MortarBadge`                                              | Badge          | Tones `neutral`, `info`, `success`, `warning`, `danger`.                                                                                                                                               |
| `MortarCard`                                               | Card           | Title, description, header actions, footer, `compact` or `none` padding, `muted` tone.                                                                                                                 |
| `MortarTextField`                                          | Input          | Label, prompt, hint, error, required marker, secure entry. VoiceOver reads the label as its name, then "required", the error and the hint.                                                             |
| `MortarSwitch`, `.toggleStyle(.mortar)`                    | Switch         | The whole row toggles; VoiceOver sees a standard switch.                                                                                                                                               |
| `MortarAvatar`                                             | Avatar         | Image URL with initials while loading or on failure, five sizes, circle or square, online or offline status, decorative.                                                                               |
| `MortarNotice`                                             | Notice         | Tone, message, actions, dismiss button, VoiceOver announcement.                                                                                                                                        |
| `MortarEmptyState`                                         | EmptyState     | SF Symbol, description, action, dashed, centred or leading.                                                                                                                                            |

On both platforms the switch sits at the end of its row, after the label, as in iOS and Android settings; on the web it comes first.

### Manifest `platforms`

Web manifests for components that have a native counterpart name those ports:

```json
"platforms": {
  "swiftui": "MortarButton",
  "compose": "MortarButton"
}
```

Each key is `swiftui` or `compose`. The value is the public SwiftUI `struct` or Compose `@Composable fun` name. The web export and the native type can differ (Input → `MortarTextField`). Only components that ship native ports today set the field; the rest stay web-only. `npm run check` rejects a `platforms` entry whose type is missing from `native/apple` or `native/android`.

| Web export | SwiftUI / Compose  |
| ---------- | ------------------ |
| Button     | `MortarButton`     |
| Badge      | `MortarBadge`      |
| Card       | `MortarCard`       |
| Input      | `MortarTextField`  |
| Switch     | `MortarSwitch`     |
| Avatar     | `MortarAvatar`     |
| Notice     | `MortarNotice`     |
| EmptyState | `MortarEmptyState` |

More of the core set is tracked in [#95](https://github.com/tonycodes/mortar/issues/95); Maven hosting for Compose is still open.

### Snapshot tests

`native/apple/Tests/MortarTests` renders each component on an iPhone simulator in light, dark and a large accessibility text size, and a branded screen on iPad, with [swift-snapshot-testing](https://github.com/pointfreeco/swift-snapshot-testing). The **Mortar for SwiftUI** workflow runs them on macOS on every change to `Package.swift` or `native/apple`, and builds the package for Mac.

Rendering differs between iOS versions, so the reference images are recorded on CI's simulator, not on a developer's Mac. To add or update one, delete the old image (or add the test), push, and download the `mortar-swift-snapshots-<sha>` artifact from the failed run: it holds the newly recorded images and any failed comparisons. Review them, commit them under `__Snapshots__`, and push again.

## Jetpack Compose

The library is in `native/android` (module `mortar`, package `codes.tony.mortar`) for Android 7.0 (API 24) and later. Until its Maven repository is chosen ([#95](https://github.com/tonycodes/mortar/issues/95)), build it into your local Maven repository with Gradle 8.11 and JDK 17:

```sh
gradle -p native/android :mortar:publishToMavenLocal -Pversion=0.0.0-local
```

```kotlin
implementation("codes.tony:mortar:0.0.0-local")
```

Theme the app once near its root, then use the components:

```kotlin
setContent {
    MortarTheme(brand = MortarBrand.Neutral) {
        MortarButton("Save", onClick = ::save, variant = MortarButtonVariant.Primary)
    }
}
```

A brand is a `MortarBrand`: its light and dark `MortarPalette`s, `FontFamily`s and density. `MortarTheme` follows the system's dark theme unless you pass `darkTheme`; components read `Mortar.palette` and `Mortar.brand`. Text sizes are in sp, so they follow the font scale.

The components and their parameters match the SwiftUI table above, with Compose names: `MortarButton`, `MortarBadge`, `MortarCard`, `MortarTextField`, `MortarSwitch`, `MortarAvatar`, `MortarNotice` and `MortarEmptyState`. Differences:

- Medium controls and touch targets are 48dp, Material's minimum, instead of 44.
- `MortarAvatar` takes a `Painter`: load the picture with your image library (Coil, Glide) and pass null while it loads or when it fails, to show the initials.
- Icons are `ImageVector`s, such as `Icons.Filled.Share`.
- `MortarNotice(announce = true)` is a live region: polite, or assertive for `Danger`.

### Snapshot tests

`native/android/mortar/src/test` holds unit tests and [Paparazzi](https://github.com/cashapp/paparazzi) snapshots of each component on a Pixel 5 in light, dark and twice the font size, and a branded screen on a Pixel C tablet. Paparazzi renders on the JVM, without an emulator, so the references in `src/test/snapshots` match on any machine. The **Mortar for Compose** workflow runs `gradle :mortar:verifyPaparazziDebug` on every change to `native/android`. When it fails, it records what the code renders now and uploads the images as `mortar-compose-snapshots-<sha>` to review and commit. Locally, `gradle -p native/android :mortar:recordPaparazziDebug` does the same.

## Brands

`nativeTheme(brand)` in `src/native-theme.ts` resolves a `BrandDefinition` to literal light and dark palettes the way `tokens.css` resolves it: omitted values keep the defaults or derive from primary, and `color-mix(in oklab, …)` tints are computed in JS. Brand colours must be literal and opaque (hex, `white`, `black`, `rgb()`, `hsl()`, `oklab()` or `oklch()`). Accents use the flat `accent`, not the gradient. Fonts become family names plus a generic family; the app bundles the fonts itself.

It isn't a public entry point yet. The Swift and Kotlin libraries will load a resolved brand at runtime.

## Changing tokens

`src/native-theme.ts` holds the defaults and scales; `tests/native.test.mjs` fails when they differ from `tokens.css`, or when a brand resolves differently from the CSS. After changing either, regenerate the files:

```sh
npm run native:tokens
```

The test also fails while the generated files are out of date, and compiles them with `swiftc` (Swift 6 language mode) and `kotlinc` when those are installed. CI requires both compilers.
