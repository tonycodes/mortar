#if canImport(UIKit)
import SnapshotTesting
import SwiftUI
import UIKit
import XCTest
@testable import Mortar

/// Each component's states on iPhone in light, dark and the largest
/// non-accessibility text size, and a composed screen on iPad. Reference
/// images live in __Snapshots__ and are recorded on CI's simulator (see
/// docs/native.md); rendering differs between iOS versions, so they are only
/// compared on the runtime CI pins.
@MainActor
final class MortarSnapshotTests: XCTestCase {
    private let phone: [(String, UITraitCollection)] = [
        ("light", UITraitCollection(userInterfaceStyle: .light)),
        ("dark", UITraitCollection(userInterfaceStyle: .dark)),
        ("large-text", UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(preferredContentSizeCategory: .accessibilityLarge),
        ])),
    ]

    private func check<V: View>(
        _ view: V,
        device: ViewImageConfig = .iPhone13,
        variants: [(String, UITraitCollection)]? = nil,
        file: StaticString = #filePath,
        testName: String = #function,
        line: UInt = #line
    ) {
        let screen = Screen { view }
        for (name, traits) in variants ?? phone {
            assertSnapshot(
                of: screen,
                as: .image(perceptualPrecision: 0.98, layout: .device(config: device), traits: traits),
                named: name,
                file: file,
                testName: testName,
                line: line
            )
        }
    }

    func testButton() {
        check(VStack(alignment: .leading, spacing: 12) {
            ForEach(MortarButtonVariant.allCases, id: \.self) { variant in
                MortarButton("\(String(describing: variant).capitalized) action", variant: variant) {}
            }
            HStack {
                MortarButton("Small", variant: .primary, size: .sm) {}
                MortarButton("Large", variant: .primary, size: .lg) {}
            }
            MortarButton("Saving", variant: .primary, isLoading: true) {}
            MortarButton("Disabled", variant: .primary) {}.disabled(true)
            HStack {
                MortarButton("Share", systemImage: "square.and.arrow.up") {}
                MortarButton("Delete", systemImage: "trash", variant: .danger, iconOnly: true) {}
            }
        })
    }

    func testBadge() {
        check(VStack(alignment: .leading, spacing: 12) {
            ForEach(MortarTone.allCases, id: \.self) { tone in
                MortarBadge(verbatim: String(describing: tone).capitalized, tone: tone)
            }
        })
    }

    func testCard() {
        check(VStack(spacing: 16) {
            MortarCard("Billing", description: "Your plan renews on 1 December.") {
                Text("Team plan, 12 seats")
            } actions: {
                MortarButton("Change", size: .sm) {}
            } footer: {
                Text(verbatim: "Invoices go to billing@example.com")
            }
            MortarCard(padding: .compact, tone: .muted) {
                Text("A compact, muted card without a header.")
            }
        })
    }

    func testTextField() {
        check(VStack(spacing: 20) {
            MortarTextField("Email", text: .constant(""), prompt: "you@example.com",
                            hint: "We'll send a confirmation link.", isRequired: true)
            MortarTextField("Workspace name", text: .constant("Hive"),
                            error: "That name is taken. Try another.")
            MortarTextField("Password", text: .constant("hunter22"), isSecure: true)
            MortarTextField("Invite code", text: .constant("MORTAR"))
                .disabled(true)
        })
    }

    func testSwitch() {
        check(VStack(spacing: 8) {
            MortarSwitch("Email notifications", isOn: .constant(true),
                         description: "A summary of activity each morning.")
            MortarSwitch("Product updates", isOn: .constant(false))
            MortarSwitch("Two-step sign-in", isOn: .constant(true)).disabled(true)
        })
    }

    func testAvatar() {
        check(VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 12) {
                ForEach(MortarAvatar.Size.allCases, id: \.self) { size in
                    MortarAvatar(name: "Ada Lovelace", size: size)
                }
            }
            HStack(spacing: 12) {
                MortarAvatar(name: "Grace Hopper", size: .lg, status: .online)
                MortarAvatar(name: "Alan Turing", size: .lg, shape: .square, status: .offline)
            }
        })
    }

    func testNotice() {
        check(VStack(spacing: 12) {
            ForEach(MortarTone.allCases, id: \.self) { tone in
                MortarNotice("\(String(describing: tone).capitalized) notice",
                             message: "Something happened that you should know about.",
                             tone: tone)
            }
            MortarNotice("Export ready", message: "Your file is ready to download.",
                         tone: .success, onDismiss: {}) {
                Button("Download") {}
            }
        })
    }

    func testEmptyState() {
        check(VStack(spacing: 16) {
            MortarEmptyState("No projects yet", description: "Projects you create or join appear here.",
                             systemImage: "folder") {
                MortarButton("New project", variant: .primary) {}
            }
            MortarEmptyState("No results", description: "Try a different search.", dashed: true)
        })
    }

    func testCheckbox() {
        check(VStack(alignment: .leading, spacing: 4) {
            MortarCheckbox("Email me a weekly summary", isOn: .constant(true), description: "Every Monday morning.")
            MortarCheckbox("I agree to the terms", isOn: .constant(false),
                           error: "Agree to the terms to continue.", isRequired: true)
            MortarCheckbox("Beta features", isOn: .constant(false)).disabled(true)
        })
    }

    func testRadioGroup() {
        check(MortarRadioGroup("Plan", selection: .constant("team"), options: [
            MortarRadioOption("Personal", value: "personal", description: "One seat."),
            MortarRadioOption("Team", value: "team", description: "Up to 20 seats."),
            MortarRadioOption("Enterprise", value: "enterprise", isDisabled: true),
        ], hint: "You can change plan at any time."))
    }

    func testSegmentedControl() {
        check(VStack(alignment: .leading, spacing: 16) {
            MortarSegmentedControl("Range", selection: .constant("week"),
                                   options: [("day", "Day"), ("week", "Week"), ("month", "Month")])
            MortarSegmentedControl("View", selection: .constant("list"),
                                   options: [("list", "List"), ("board", "Board")])
        })
    }

    func testProgressBar() {
        check(VStack(spacing: 20) {
            MortarProgressBar("Storage", value: 62)
            MortarProgressBar("Onboarding", value: 3, total: 5, valueLabel: "3 of 5 steps", tone: .success)
            MortarProgressBar("Quota", value: 96, tone: .danger)
        })
    }

    func testDivider() {
        check(VStack(alignment: .leading, spacing: 0) {
            Text(verbatim: "Above")
            MortarDivider()
            Text(verbatim: "Between")
            MortarDivider("or")
            Text(verbatim: "Below")
            MortarDivider(soft: true, spacing: .sm)
        })
    }

    func testStackedList() {
        check(MortarStackedList("Team", groups: [
            (label: "Owners", items: [
                MortarListItem(id: "1", title: "Ada Lovelace", description: "ada@example.com",
                               leading: .avatar(name: "Ada Lovelace"), trailing: "Owner", action: {}),
            ]),
            (label: "Files", items: [
                MortarListItem(id: "2", title: "Quarterly report.pdf", description: "2.4 MB",
                               leading: .systemImage("doc"), trailing: "Today", action: {}),
                MortarListItem(id: "3", title: "Roadmap.key", description: "18 MB",
                               leading: .systemImage("doc.richtext"), trailing: "Monday"),
            ]),
        ], chevrons: true))
    }

    func testAppShell() {
        let shell = AppShellSample()
        for (name, device) in [("iphone", ViewImageConfig.iPhone13), ("ipad", ViewImageConfig.iPadPro11)] {
            assertSnapshot(
                of: shell,
                as: .image(perceptualPrecision: 0.98, layout: .device(config: device),
                           traits: UITraitCollection(userInterfaceStyle: .light)),
                named: name
            )
        }
    }

    func testAppShellSections() {
        let large = UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(preferredContentSizeCategory: .accessibilityLarge),
        ])
        let variants: [(String, ViewImageConfig, UITraitCollection)] = [
            ("ipad", .iPadPro11, UITraitCollection(userInterfaceStyle: .light)),
            ("ipad-dark", .iPadPro11, UITraitCollection(userInterfaceStyle: .dark)),
            ("ipad-large-text", .iPadPro11, large),
            ("iphone", .iPhone13, UITraitCollection(userInterfaceStyle: .light)),
        ]
        for (name, device, traits) in variants {
            // A tab bar can't show a long name; the sidebar variants cover it.
            // Only the selected tab's icon shows in the image: see
            // testTabBarItemsHaveIcons.
            assertSnapshot(
                of: AppShellSectionsSample(longName: device.size?.width ?? 0 > 600),
                as: .image(perceptualPrecision: 0.98, layout: .device(config: device), traits: traits),
                named: name
            )
        }
    }

    func testCommentComposer() {
        check(ComposerStatesSample())
    }

    func testConversation() {
        for (name, traits) in phone {
            assertSnapshot(
                of: ConversationSample(),
                as: .image(perceptualPrecision: 0.98, layout: .device(config: .iPhone13), traits: traits),
                named: name
            )
        }
        assertSnapshot(
            of: ConversationSample(),
            as: .image(perceptualPrecision: 0.98, layout: .device(config: .iPadPro11),
                       traits: UITraitCollection(userInterfaceStyle: .light)),
            named: "ipad"
        )
        assertSnapshot(
            of: ConversationSample(isEmpty: true),
            as: .image(perceptualPrecision: 0.98, layout: .device(config: .iPhone13),
                       traits: UITraitCollection(userInterfaceStyle: .light)),
            named: "empty"
        )
    }

    func testForm() {
        for (name, traits) in phone {
            assertSnapshot(
                of: SettingsFormSample(),
                as: .image(perceptualPrecision: 0.98, layout: .device(config: .iPhone13), traits: traits),
                named: name
            )
        }
        assertSnapshot(
            of: SettingsFormSample(),
            as: .image(perceptualPrecision: 0.98, layout: .device(config: .iPadPro11),
                       traits: UITraitCollection(userInterfaceStyle: .light)),
            named: "ipad"
        )
    }

    /// The bubble's spoken name is the prose, not the Markdown source.
    /// The simulator host does not publish SwiftUI's accessibility elements to
    /// this unit-test process (the walk came back empty), so this checks the
    /// function the label uses. A person still has to hear it with VoiceOver.
    func testConversationVoiceOverReadsProse() {
        let spoken = MortarChatSpeech.prose(
            "Invoices include **tax lines** and `billing-2026-11.csv`. "
                + "See [the notes](https://example.com)."
        )
        XCTAssertEqual(spoken, "Invoices include tax lines and billing-2026-11.csv. See the notes.")
        XCTAssertFalse(spoken.contains("**"))
        XCTAssertFalse(spoken.contains("`"))
        XCTAssertFalse(spoken.contains("https://"))
    }

    /// Text past maxLength is cut off. The same behaviour is in MortarMacTests;
    /// this runs on the iOS job. The "characters left" name is in the checklist.
    func testComposerMaxLengthCutsAndCounts() {
        let model = ComposerDraft()
        let controller = UIHostingController(
            rootView: ComposerCountHarness(model: model).mortarTheme(.neutral)
        )
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 200))
        window.rootViewController = controller
        window.isHidden = false
        controller.view.layoutIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.3))
        model.text = "Hello, world"
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.4))
        XCTAssertEqual(model.text, "Hello")
    }

    /// Every tab on iPhone carries its icon. The snapshot rendering drops
    /// the tint UIKit gives unselected tab icons, so the image shows only
    /// the selected tab's; this checks the tab bar itself.
    func testTabBarItemsHaveIcons() {
        let controller = UIHostingController(rootView: AppShellSectionsSample(longName: false))
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.traitOverrides.horizontalSizeClass = .compact
        window.rootViewController = controller
        window.isHidden = false
        controller.view.layoutIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.3))
        guard let tabBar = Self.find(UITabBar.self, in: controller.view) else {
            return XCTFail("No tab bar in the iPhone shell")
        }
        let items = tabBar.items ?? []
        XCTAssertEqual(items.map(\.title), ["Inbox", "Drafts", "Sent", "Planning", "Design"])
        for item in items {
            XCTAssertNotNil(item.image, "\(item.title ?? "?") has no icon")
        }
        XCTAssertEqual(items.map(\.badgeValue), ["12", nil, nil, "3", nil])
    }

    private static func find<T: UIView>(_ type: T.Type, in view: UIView) -> T? {
        if let match = view as? T { return match }
        for child in view.subviews {
            if let match = find(type, in: child) { return match }
        }
        return nil
    }

    func testBrandOnIPad() {
        let brand = MortarTheme(
            light: { var p = MortarTokens.light; p.primary = 0x1D4ED8; p.primaryActive = 0x1E40AF; p.focus = 0x1D4ED8; return p }(),
            dark: { var p = MortarTokens.dark; p.primary = 0x93C5FD; p.onPrimary = 0x0B1F4D; p.focus = 0x93C5FD; return p }()
        )
        check(
            HStack(alignment: .top, spacing: 24) {
                MortarCard("Profile", description: "Shown to your team.") {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(spacing: 12) {
                            MortarAvatar(name: "Ada Lovelace", size: .lg, status: .online)
                            MortarBadge("Admin", tone: .info)
                        }
                        MortarTextField("Display name", text: .constant("Ada"))
                        MortarSwitch("Show my status", isOn: .constant(true))
                    }
                } footer: {
                    HStack { Spacer(); MortarButton("Save", variant: .primary) {} }
                }
                MortarEmptyState("No activity", description: "Changes to your profile appear here.",
                                 systemImage: "clock", dashed: true)
            }
            .mortarTheme(brand),
            device: .iPadPro11,
            variants: Array(phone.prefix(2))
        )
    }
}

private struct AppShellSample: View {
    @State private var selection = "inbox"

    var body: some View {
        MortarAppShell("Hive", selection: $selection, items: [
            MortarNavigationItem("Inbox", systemImage: "tray", value: "inbox"),
            MortarNavigationItem("Projects", systemImage: "folder", value: "projects"),
            MortarNavigationItem("Settings", systemImage: "gearshape", value: "settings"),
        ]) { value in
            MortarEmptyState("Inbox zero", description: "New messages appear here.", systemImage: "tray")
                .navigationTitle(value.capitalized)
        }
    }
}

@MainActor
@Observable
private final class ComposerDraft {
    var text = ""
}

private struct ComposerCountHarness: View {
    @Bindable var model: ComposerDraft

    var body: some View {
        MortarCommentComposer(text: $model.text, maxLength: 5, showsCount: true) { _ in }
            .padding(20)
    }
}

/// A component gallery on the screen's paper, as an app would show it.
private struct Screen<Content: View>: View {
    @ViewBuilder let content: Content
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        ScrollView {
            content
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .background(Color(mortar: MortarTheme.neutral.palette(for: scheme).paper))
    }
}
#endif
