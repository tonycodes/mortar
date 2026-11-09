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
