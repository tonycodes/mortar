# Native apps

Mortar is coming to iPhone, iPad and Android as a SwiftUI package and a Jetpack Compose library, tracked in [#95](https://github.com/tonycodes/mortar/issues/95). This page covers what exists so far: the design tokens both libraries are built on, and the first SwiftUI and Jetpack Compose components.

The playground's **Native gallery** (`?page=native`) shows each component on the web beside its SwiftUI and Compose snapshot references, in light, dark and large text.

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

| Component                                                  | Web equivalent   | Notes                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MortarButton`, `.buttonStyle(.mortar(_:size:isLoading:))` | Button           | `primary` (the default, as on the web), `secondary`, `ghost`, `danger`, `accent`; `sm`, `md`, `lg`; loading; SF Symbol, icon-only with the title as its accessible name. Medium is at least 44pt tall.                                     |
| `MortarBadge`                                              | Badge            | Tones `neutral`, `info`, `success`, `warning`, `danger`.                                                                                                                                                                                   |
| `MortarCard`                                               | Card             | Title, description, header actions, footer, `compact` or `none` padding, `muted` tone.                                                                                                                                                     |
| `MortarTextField`                                          | Input            | Label, prompt, hint, error, required marker, secure entry. VoiceOver reads the label as its name, then "required", the error and the hint.                                                                                                 |
| `MortarSwitch`, `.toggleStyle(.mortar)`                    | Switch           | The whole row toggles; VoiceOver sees a standard switch.                                                                                                                                                                                   |
| `MortarAvatar`                                             | Avatar           | Image URL with initials while loading or on failure, five sizes, circle or square, online or offline status, decorative.                                                                                                                   |
| `MortarNotice`                                             | Notice           | Tone, message, actions, dismiss button, VoiceOver announcement.                                                                                                                                                                            |
| `MortarEmptyState`                                         | EmptyState       | SF Symbol, description, action, dashed, centred or leading.                                                                                                                                                                                |
| `MortarCheckbox`                                           | Checkbox         | Label, description, error, required marker. The whole row toggles; VoiceOver reads a checkbox.                                                                                                                                             |
| `MortarRadioGroup`                                         | RadioGroup       | Label, hint, error, options with descriptions and disabled options.                                                                                                                                                                        |
| `MortarSegmentedControl`                                   | SegmentedControl | A labelled set of segments; scrolls sideways when they don't fit.                                                                                                                                                                          |
| `MortarProgressBar`                                        | ProgressBar      | Label, value and total, a value label (a percentage by default), a status tone.                                                                                                                                                            |
| `MortarDivider`                                            | Divider          | Optional label, soft line, spacing `none`, `sm`, `md` or `lg`.                                                                                                                                                                             |
| `MortarStackedList`                                        | StackedList      | Rows with an avatar or SF Symbol, description, trailing text and an action; grouped under headings; chevrons.                                                                                                                              |
| `MortarAppShell`                                           | AppShell         | Top-level destinations: a tab bar on iPhone, a sidebar on iPad and Mac. Labelled `sections` and per-item counts; an optional brand title; a sidebar `footer` for the app's account menu. Each destination starts its own navigation stack. |
| `MortarCommentComposer`                                    | CommentComposer  | A one-row composer that grows to six lines: attachment button, Send, or Stop while a reply streams; optional character count; Command-Return sends; an external focus binding. SwiftUI only so far.                                        |
| `MortarConversation`                                       | ChatPreview      | Messages in a readable column with Markdown, roles, inline choices, failed and streaming states, an empty state and a pinned composer. SwiftUI only so far.                                                                                |
| `MortarFormSection`                                        | SettingsSection  | A titled group of fields: title and description beside the fields from 560 points wide, above them below that, with a rule underneath. SwiftUI only so far.                                                                                |
| `MortarTextEditor`                                         | TextArea         | Label, prompt, hint, error, required marker; grows from `minLines` to `maxLines`. SwiftUI only so far.                                                                                                                                     |
| `MortarPicker`                                             | Select           | One option from a menu, in Mortar's field box; placeholder, hint, error, required marker. SwiftUI only so far.                                                                                                                             |

### App shell

`MortarAppShell` takes the destinations and their screens; Mortar draws the sidebar's surface, selection, spacing and keyboard focus ring, so an app doesn't restyle it.

```swift
MortarAppShell(selection: $destination, items: [
    MortarNavigationItem("Inbox", systemImage: "tray", value: .inbox, count: unread),
    MortarNavigationItem("Sent", systemImage: "paperplane", value: .sent),
], sections: [
    MortarNavigationGroup("Projects", items: projects.map {
        MortarNavigationItem(LocalizedStringKey($0.name), systemImage: "folder", value: .project($0.id))
    }),
]) { destination in
    screen(for: destination)
} footer: {
    AccountMenu()  // the app's own Menu: avatar, name, settings, sign out
}
```

- `sections` are the web AppShell's labelled groups. On iPhone they join the tab bar after `items`, and iOS moves tabs past the fifth into More.
- `count` shows beside the label, and as the tab's badge on iPhone; VoiceOver reads it as the item's value. A count of 0 shows nothing.
- Without a brand, the sidebar keeps a compact bar for its toggle on iPad instead of an empty large title.
- The footer is pinned under the sidebar's list on iPad and Mac. iPhone has no sidebar, so give account actions a destination there.
- Changing destination starts it at its root, so Back never leads to a screen pushed under another destination.

### Conversations

`MortarConversation` and `MortarCommentComposer` are the chat pattern for an assistant or a mail thread: the app supplies messages and actions, and Mortar draws the rest.

```swift
MortarConversation(messages: messages) {
    MortarCommentComposer(
        text: $draft,
        placeholder: "Ask anything",
        maxLength: 4000,
        isStreaming: reply.isStreaming,
        isFocused: $composerFocused,
        onAttach: { showsFilePicker = true },
        onStop: { reply.cancel() }
    ) { text in
        send(text)  // the composer then clears the draft
    }
} empty: {
    MortarEmptyState("Ask about your account", systemImage: "bubble.left.and.bubble.right")
}
```

- The composer is one row that grows to six lines. Return adds a line, Command-Return sends (on a Mac or a hardware keyboard), and Command-. stops.
- While `isStreaming`, Stop replaces Send and the text stays editable. The composer disables nothing else, so the app's navigation keeps working during a reply.
- `maxLength` cuts text off at that length; `showsCount` also shows the count, which isn't shown by default.
- `isFocused` moves focus to the field (after correcting a message, say) or away, which dismisses the keyboard on iOS. Dragging the conversation also dismisses it.
- Messages are Markdown. Emphasis, code and links are styled; lists and headings show as written.
- VoiceOver reads each bubble as one element: the speaker, then the prose. Emphasis, code and link titles are spoken; the Markdown source and the link URL are not. Each link is an action on that element. A streaming bubble's value is "Responding".
- A message's `status` is `.complete`, `.streaming` (dots until the first text, and VoiceOver reads "Responding") or `.failed(reason, retry:)`. `choices` are pills under a message that wrap onto more rows when there are more than fit.
- The column is at most 720 points wide (`measure`) and centred, so lines stay readable in a wide Mac window.

### Settings and editors

Build settings screens and editors from `MortarForm` and `MortarFormSection`, not `Form` or `List`, whose grouped grey surfaces don't match Mortar's paper.

```swift
MortarForm("Connect mail") {
    MortarFormSection("Server", description: "From your mail provider.") {
        MortarTextField("IMAP host", text: $host, isRequired: true)
        MortarTextField("Password", text: $password, error: passwordError, isRequired: true, isSecure: true)
        MortarPicker("Security", selection: $security, options: [
            MortarPickerOption("SSL/TLS", value: .tls),
            MortarPickerOption("STARTTLS", value: .startTLS),
        ])
    }
    MortarFormSection("Sync") {
        MortarField("Check from", hint: "Mail before this time isn't fetched.") {
            DatePicker("", selection: $since, displayedComponents: .date).labelsHidden()
        }
    }
} actions: {
    MortarButton("Cancel", variant: .ghost) { dismiss() }
    MortarButton("Connect", variant: .primary, isLoading: isConnecting) { connect() }
}
```

- `MortarForm` scrolls a column at most 760 points wide (`measure`) on the paper, with an optional title and description, and pins `actions` at the bottom, trailing. Use the same view in a navigation destination or a sheet. On a Mac it gives a sheet a sensible size of its own.
- `MortarFormSection` is the web SettingsSection: title and description in a third, fields in two thirds, from 560 points wide.
- `MortarField` puts Mortar's label, required marker, hint and error around any other control, such as a `DatePicker`, a `Stepper` or a control of your own, and gives VoiceOver the same name and hint as the other fields.
- Disable a field, or a whole section, with `.disabled(_:)`. While saving, give the primary action `isLoading`.
- `MortarForm` and `MortarField` are layout pieces with no web component, so no manifest names them.

On both platforms the switch sits at the end of its row, after the label, as in iOS and Android settings; on the web it comes first.

### Snapshot tests

`native/apple/Tests/MortarTests` renders each component on an iPhone simulator in light, dark and a large accessibility text size, and a branded screen on iPad, with [swift-snapshot-testing](https://github.com/pointfreeco/swift-snapshot-testing). The **Mortar for SwiftUI** workflow runs those snapshots on macOS 15, and runs `MortarMacTests` in a real Mac window on macOS 26, on every change to `Package.swift`, `native/apple` or that workflow.

`MortarMacTests` runs on the Mac itself, not as an iPad app: each screen is hosted in a real window, in light and dark, at more than one size, and resized. It also opens and closes a form with text and secure fields in a split view's detail and in a sheet, many times, and fails if layout doesn't settle. Its references are recorded on CI's Mac in the same way.

The layout-loop tests run in the **Mortar for SwiftUI** workflow on `macos-15` (Xcode 16.4) and `macos-26` (the image's Xcode 26). They open and close the connector form, present its sheet, and resize the actions at the largest text size. GitHub's `macos-26` image is the current macOS 26 release, not the 26.2 machine that first reported the loop. Snapshot comparison stays on the pinned macOS 15 simulator job. Whether the actions sit on one row or stack is recorded in the iOS form snapshots.

Rendering differs between iOS versions, so the reference images are recorded on CI's simulator, not on a developer's Mac. To add or update one, delete the old image (or add the test), push, and download the `mortar-swift-snapshots-<sha>` artifact from the failed run: it holds the newly recorded images and any failed comparisons. Review them, commit them under `__Snapshots__`, and push again. Mac references are in the separate `mortar-mac-snapshots-<pull-request-head-sha>` artifact from the Mac job. Review those before committing: a dark sidebar that is a blank white panel is macOS 26's sidebar glass drawn offscreen, and is not a usable reference.

## Jetpack Compose

The library is in `native/android` (module `mortar`, package `codes.tony.mortar`) for Android 7.0 (API 24) and later. Each Mortar release publishes it to [GitHub Packages](https://github.com/tonycodes/mortar/packages) at the npm package's version. GitHub's Maven registry asks for a token even for public packages, so add the repository in `settings.gradle.kts` with a GitHub username and a personal access token that has `read:packages`, kept out of source control (here in `~/.gradle/gradle.properties`):

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven("https://maven.pkg.github.com/tonycodes/mortar") {
            credentials {
                username = providers.gradleProperty("gpr.user").get()
                password = providers.gradleProperty("gpr.key").get()
            }
        }
    }
}
```

Then the dependency, at the same version as `@tonycodes-ui/mortar`:

```kotlin
// 0.22.0 is the first version in GitHub Packages.
implementation("codes.tony:mortar:0.22.0")
```

To try unreleased changes, build the library into your local Maven repository with Gradle 8.11 and JDK 17 and depend on `0.0.0-local`:

```sh
gradle -p native/android :mortar:publishToMavenLocal -Pversion=0.0.0-local
```

### Publishing

`.github/workflows/publish-android.yml` runs after each successful **Release package** run on main. It finds the release tag on the released commit (a run that released nothing leaves none), skips a version GitHub Packages already has, and publishes `codes.tony:mortar:<version>` with `gradle :mortar:publishReleasePublicationToGitHubPackagesRepository`. It publishes with the run's own `GITHUB_TOKEN` and `packages: write`, so no secret is stored, and it has no manual trigger, so a version is only published from its release. The release policy test (R-AR-17) keeps it that way: read-only contents, no ref writes, no secrets.

Theme the app once near its root, then use the components:

```kotlin
setContent {
    MortarTheme(brand = MortarBrand.Neutral) {
        MortarButton("Save", onClick = ::save, variant = MortarButtonVariant.Primary)
    }
}
```

A brand is a `MortarBrand`: its light and dark `MortarPalette`s, `FontFamily`s and density. `MortarTheme` follows the system's dark theme unless you pass `darkTheme`; components read `Mortar.palette` and `Mortar.brand`. Text sizes are in sp, so they follow the font scale.

The components and their parameters match the SwiftUI table above, with Compose names: `MortarButton`, `MortarBadge`, `MortarCard`, `MortarTextField`, `MortarSwitch`, `MortarAvatar`, `MortarNotice`, `MortarEmptyState`, `MortarCheckbox`, `MortarRadioGroup`, `MortarSegmentedControl`, `MortarProgressBar`, `MortarDivider`, `MortarStackedList` and `MortarAppShell`. Differences:

- Medium controls and touch targets are 48dp, Material's minimum, instead of 44.
- `MortarAvatar` takes a `Painter`: load the picture with your image library (Coil, Glide) and pass null while it loads or when it fails, to show the initials.
- Icons are `ImageVector`s, such as `Icons.Filled.Share`; a `MortarStackedList` row leads with `MortarListLeading.Avatar` or `MortarListLeading.Icon`.
- `MortarAppShell` follows Android's window size classes: a bottom navigation bar under 600dp, a navigation rail to 840dp, and a sidebar with the brand name from 840dp.
- `MortarNotice(announce = true)` is a live region: polite, or assertive for `Danger`.

### Snapshot tests

`native/android/mortar/src/test` holds unit tests and [Paparazzi](https://github.com/cashapp/paparazzi) snapshots of each component on a Pixel 5 in light, dark and twice the font size, and a branded screen on a Pixel C tablet. Paparazzi renders on the JVM, without an emulator, so the references in `src/test/snapshots` match on any machine. The **Mortar for Compose** workflow runs `gradle :mortar:verifyPaparazziDebug` on every change to `native/android`. When it fails, it records what the code renders now and uploads the images as `mortar-compose-snapshots-<sha>` to review and commit. Locally, `gradle -p native/android :mortar:recordPaparazziDebug` does the same.

## For agents

A component with a native version names it in its manifest:

```json
"platforms": { "swiftui": "MortarTextField", "compose": "MortarTextField" }
```

`get_component` shows it as `native`, with each import, and a build packet for a brief about an iOS, iPadOS or Android app adds this guide and a `native` section listing every component the libraries have. `tests/native.test.mjs` checks that each named view or composable exists, and that every public one is named by a manifest. `npm run check` also rejects a malformed `platforms` entry, or one naming a type the native sources do not define (rule M011).

## Brands

`nativeTheme(brand)` in `src/native-theme.ts` resolves a `BrandDefinition` to literal light and dark palettes the way `tokens.css` resolves it: omitted values keep the defaults or derive from primary, and `color-mix(in oklab, …)` tints are computed in JS. Brand colours must be literal and opaque (hex, `white`, `black`, `rgb()`, `hsl()`, `oklab()` or `oklch()`). Accents use the flat `accent`, not the gradient. Fonts become family names plus a generic family; the app bundles the fonts itself.

It isn't a public entry point yet. The Swift and Kotlin libraries will load a resolved brand at runtime.

## Changing tokens

`src/native-theme.ts` holds the defaults and scales; `tests/native.test.mjs` fails when they differ from `tokens.css`, or when a brand resolves differently from the CSS. After changing either, regenerate the files:

```sh
npm run native:tokens
```

The test also fails while the generated files are out of date, and compiles them with `swiftc` (Swift 6 language mode) and `kotlinc` when those are installed. CI requires both compilers.
