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
    // TEMPORARY: see SnapshotLog.
    nonisolated override class func setUp() { super.setUp(); SnapshotLog.start() }
    nonisolated override class func tearDown() { SnapshotLog.finish(); super.tearDown() }

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

    /// Lays the window out and lets SwiftUI apply pending updates.
    static func settle(_ window: NSWindow, for seconds: TimeInterval = 0.3) {
        window.layoutIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(seconds))
        window.layoutIfNeeded()
    }
}
#endif
