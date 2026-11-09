#if os(macOS)
import AppKit
import SnapshotTesting
import SwiftUI
import XCTest
@testable import Mortar

/// Mortar on the Mac itself, not iPad compatibility: each screen is hosted in
/// a real window, as an app hosts it, in light and dark and at more than one
/// window size. The references are recorded on CI's Mac (see docs/native.md).
@MainActor
final class MortarMacTests: XCTestCase {
    func testAppShellWide() {
        for dark in [false, true] {
            let window = MacWindow.host(AppShellSectionsSample(), size: CGSize(width: 980, height: 620), dark: dark)
            defer { window.close() }
            snapshot(window, named: dark ? "dark" : "light")
        }
    }

    func testAppShellNarrow() {
        let window = MacWindow.host(AppShellSectionsSample(), size: CGSize(width: 640, height: 480))
        defer { window.close() }
        snapshot(window, named: "light")
    }

    /// Resizing between narrow and wide relays the shell out without a loop.
    func testAppShellResizes() {
        let window = MacWindow.host(AppShellSectionsSample(), size: CGSize(width: 980, height: 620))
        defer { window.close() }
        for width in [520.0, 1200, 700, 980] {
            window.setContentSize(CGSize(width: width, height: 620))
            MacWindow.settle(window)
        }
        XCTAssertEqual(window.contentView?.frame.width, 980)
    }

    /// A conversation in a narrow and a wide window: the column stays at a
    /// readable measure, centred, however wide the window.
    func testConversation() {
        for (name, width) in [("narrow", 480.0), ("wide", 1280)] {
            let window = MacWindow.host(ConversationSample(), size: CGSize(width: width, height: 640))
            defer { window.close() }
            snapshot(window, named: name)
        }
        let dark = MacWindow.host(ConversationSample(), size: CGSize(width: 900, height: 640), dark: true)
        defer { dark.close() }
        snapshot(dark, named: "dark")
    }

    func testCommentComposer() {
        let window = MacWindow.host(
            ComposerStatesSample().padding(20).frame(maxHeight: .infinity, alignment: .top),
            size: CGSize(width: 560, height: 620)
        )
        defer { window.close() }
        snapshot(window, named: "light")
    }

    /// The composer sends on Command-Return, follows an external focus
    /// binding, trims what it sends and clears afterwards.
    /// A runner that cannot make the window key has an empty accessibility
    /// tree, so the press is skipped there. `testComposerMaxLength` still runs.
    func testComposerSendsAndClears() throws {
        let model = ComposerModel()
        let window = MacWindow.host(ComposerHarness(model: model), size: CGSize(width: 480, height: 160))
        defer { window.close() }
        try XCTSkipUnless(window.isKeyWindow, "Runner did not make the window key (visible: \(window.isVisible)), so the accessibility press cannot run.")
        model.isFocused = true
        MacWindow.settle(window)
        XCTAssertTrue(model.isFocused)
        model.text = "  Hello  "
        MacWindow.settle(window)
        guard let send = MacWindow.element(labelled: "Send", in: window) else {
            return XCTFail("No Send button; accessibility labels: \(MacWindow.labels(in: window))")
        }
        XCTAssertTrue(MacWindow.press(send))
        MacWindow.settle(window)
        XCTAssertEqual(model.sent, ["Hello"])
        XCTAssertEqual(model.text, "")
    }

    /// Text past maxLength is cut off.
    func testComposerMaxLength() {
        let model = ComposerModel()
        let window = MacWindow.host(ComposerHarness(model: model, maxLength: 5), size: CGSize(width: 480, height: 160))
        defer { window.close() }
        model.text = "Hello, world"
        MacWindow.settle(window)
        XCTAssertEqual(model.text, "Hello")
    }

    /// The settings page in a narrow and a wide window and in dark: sections
    /// stack below 560 points and sit beside their titles above it, in a
    /// readable column.
    func testForm() {
        for (name, width, dark) in [("narrow", 520.0, false), ("wide", 1100, false), ("dark", 1100, true)] {
            let window = MacWindow.host(SettingsFormSample(isSaving: false),
                                        size: CGSize(width: width, height: 900), dark: dark)
            defer { window.close() }
            snapshot(window, named: name)
        }
    }

    /// The integration reported on macOS 26.2: a connector form with a text
    /// and a secure field, in a split view's detail, opened and closed and
    /// resized. AppKit stops a layout loop with an exception, so a loop fails
    /// this test; each step must also settle quickly.
    func testConnectorFormOpensAndClosesWithoutLayoutLoop() {
        let model = ConnectorModel()
        let window = MacWindow.host(ConnectorSplitSample(model: model), size: CGSize(width: 1000, height: 700))
        defer { window.close() }
        for round in 0..<20 {
            model.showsForm = true
            assertSettles(window, "open \(round)")
            if round.isMultiple(of: 5) {
                model.password = round.isMultiple(of: 10) ? "" : "app-password"
                assertSettles(window, "type \(round)")
            }
            model.showsForm = false
            assertSettles(window, "close \(round)")
        }
        model.showsForm = true
        for width in [700.0, 1400, 820, 1000] {
            window.setContentSize(CGSize(width: width, height: 700))
            assertSettles(window, "resize \(width)")
        }
    }

    /// The same form as a fixed 680x650 sheet, presented and dismissed.
    func testConnectorSheetPresentsAndDismissesWithoutLayoutLoop() {
        let model = ConnectorModel()
        let window = MacWindow.host(ConnectorSplitSample(model: model), size: CGSize(width: 1000, height: 760))
        defer { window.close() }
        for round in 0..<10 {
            model.showsSheet = true
            assertSettles(window, "present \(round)")
            XCTAssertNotNil(window.attachedSheet, "sheet \(round)")
            model.showsSheet = false
            assertSettles(window, "dismiss \(round)")
        }
    }

    /// Lays the window (and any sheet) out; fails if it takes more than a
    /// second, which a layout loop would.
    private func assertSettles(_ window: NSWindow, _ step: String, line: UInt = #line) {
        let start = Date()
        MacWindow.settle(window, for: 0.15)
        window.attachedSheet?.layoutIfNeeded()
        XCTAssertLessThan(Date().timeIntervalSince(start), 1.0, "\(step) took too long to lay out", line: line)
    }

    private func snapshot(
        _ window: NSWindow,
        named name: String,
        file: StaticString = #filePath,
        testName: String = #function,
        line: UInt = #line
    ) {
        guard let view = window.contentView else { return XCTFail("No content view", line: line) }
        MacWindow.revealGlassContent(in: view)
        MacWindow.settle(window, for: 0.25, passes: 1)
        assertSnapshot(
            of: view,
            as: .image(perceptualPrecision: 0.98),
            named: name,
            file: file,
            testName: testName,
            line: line
        )
    }
}

@MainActor
@Observable
final class ComposerModel {
    var text = ""
    var isFocused = false
    var sent: [String] = []
}

private struct ComposerHarness: View {
    @Bindable var model: ComposerModel
    var maxLength: Int?

    var body: some View {
        MortarCommentComposer(text: $model.text, maxLength: maxLength, isFocused: $model.isFocused) {
            model.sent.append($0)
        }
        .padding(20)
    }
}

/// A window hosting SwiftUI the way an app does.
@MainActor
enum MacWindow {
    static func host<V: View>(_ view: V, size: CGSize, dark: Bool = false) -> NSWindow {
        let window = NSWindow(
            contentRect: CGRect(origin: .zero, size: size),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        window.contentView = NSHostingView(rootView: view.mortarTheme(.neutral))
        window.setContentSize(size)
        // A test bundle's process starts as a background app: make it a
        // regular, active one so the window can become key as an app's does.
        _ = NSApplication.shared.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
        window.orderFrontRegardless()
        window.makeKeyAndOrderFront(nil)
        settle(window)
        // Not asserted: a CI runner may not let a test process take key.
        if !window.isKeyWindow {
            print("MacWindow: window is not key (visible: \(window.isVisible))")
        }
        return window
    }

    /// The first accessibility element with this label, as VoiceOver finds it.
    static func element(labelled label: String, in window: NSWindow) -> (any NSAccessibilityProtocol)? {
        all(in: window).first { text(of: $0) == label }
    }

    /// Every accessibility label in the window, to explain a failed lookup.
    static func labels(in window: NSWindow) -> [String] {
        all(in: window).compactMap(text(of:)).filter { !$0.isEmpty }
    }

    /// Presses a control. The Swift overlay is an optional method on the
    /// snapshot toolchain and a plain method on the macOS 26 toolchain.
    static func press(_ element: any NSAccessibilityProtocol) -> Bool {
        #if compiler(>=6.2)
        element.accessibilityPerformPress()
        #else
        element.accessibilityPerformPress?() ?? false
        #endif
    }

    private static func text(of element: any NSAccessibilityProtocol) -> String? {
        #if compiler(>=6.2)
        element.accessibilityLabel()
        #else
        element.accessibilityLabel?()
        #endif
    }

    private static func children(of element: any NSAccessibilityProtocol) -> [Any] {
        #if compiler(>=6.2)
        element.accessibilityChildren() ?? []
        #else
        element.accessibilityChildren?() ?? []
        #endif
    }

    private static func all(in window: NSWindow) -> [any NSAccessibilityProtocol] {
        var found: [any NSAccessibilityProtocol] = []
        var queue: [Any] = window.contentView.map { [$0] } ?? []
        while !queue.isEmpty, found.count < 2000 {
            let next = queue.removeFirst()
            guard let element = next as? any NSAccessibilityProtocol else { continue }
            found.append(element)
            queue += children(of: element)
        }
        return found
    }

    /// Hides the glass that macOS 26 draws behind a sidebar, and the
    /// backdrops beside it. Drawn offscreen, as a snapshot draws the view, the
    /// glass is an opaque white panel over the sidebar's content (which a live
    /// window composites behind it) and a backdrop is a black strip. The
    /// glass's content holder stays; only its own drawing goes.
    static func revealGlassContent(in view: NSView) {
        if let layer = view.layer, String(describing: type(of: layer)) == "CABackdropLayer" {
            view.isHidden = true
        }
        if String(describing: type(of: view)).contains("GlassEffectView") {
            for subview in view.subviews
            where !String(describing: type(of: subview)).contains("ContentHolder") {
                subview.isHidden = true
            }
        }
        view.subviews.forEach(revealGlassContent(in:))
    }

    /// Lays the window out and lets SwiftUI apply pending updates, over
    /// several passes: a NavigationSplitView fills its sidebar column a run
    /// loop turn or more after the first layout, so one pass can catch it
    /// blank.
    static func settle(_ window: NSWindow, for seconds: TimeInterval = 1.0, passes: Int = 4) {
        let slice = seconds / TimeInterval(max(passes, 1))
        for _ in 0..<max(passes, 1) {
            window.contentView?.needsLayout = true
            window.layoutIfNeeded()
            RunLoop.main.run(until: Date().addingTimeInterval(slice))
        }
        window.layoutIfNeeded()
    }
}
#endif
