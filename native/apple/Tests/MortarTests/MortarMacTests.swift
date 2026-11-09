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
    func testComposerSendsAndClears() {
        let model = ComposerModel()
        let window = MacWindow.host(ComposerHarness(model: model), size: CGSize(width: 480, height: 160))
        defer { window.close() }
        model.isFocused = true
        MacWindow.settle(window)
        XCTAssertTrue(model.isFocused)
        model.text = "  Hello  "
        MacWindow.settle(window)
        guard let send = MacWindow.element(labelled: "Send", in: window) else {
            return XCTFail("No Send button; accessibility labels: \(MacWindow.labels(in: window))")
        }
        XCTAssertTrue(send.accessibilityPerformPress?() ?? false)
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

    private func snapshot(
        _ window: NSWindow,
        named name: String,
        file: StaticString = #filePath,
        testName: String = #function,
        line: UInt = #line
    ) {
        guard let view = window.contentView else { return XCTFail("No content view", line: line) }
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
        window.orderFrontRegardless()
        settle(window)
        return window
    }

    /// The first accessibility element with this label, as VoiceOver finds it.
    static func element(labelled label: String, in window: NSWindow) -> (any NSAccessibilityProtocol)? {
        all(in: window).first { $0.accessibilityLabel?() == label }
    }

    /// Every accessibility label in the window, to explain a failed lookup.
    static func labels(in window: NSWindow) -> [String] {
        all(in: window).compactMap { $0.accessibilityLabel?() }.filter { !$0.isEmpty }
    }

    private static func all(in window: NSWindow) -> [any NSAccessibilityProtocol] {
        var found: [any NSAccessibilityProtocol] = []
        var queue: [Any] = window.contentView.map { [$0] } ?? []
        while !queue.isEmpty, found.count < 2000 {
            let next = queue.removeFirst()
            guard let element = next as? any NSAccessibilityProtocol else { continue }
            found.append(element)
            queue += element.accessibilityChildren?() ?? []
        }
        return found
    }

    /// Lays the window out and lets SwiftUI apply pending updates.
    static func settle(_ window: NSWindow, for seconds: TimeInterval = 0.3) {
        window.layoutIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(seconds))
        window.layoutIfNeeded()
    }
}
#endif
