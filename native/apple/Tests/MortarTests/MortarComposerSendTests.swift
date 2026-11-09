import XCTest
@testable import Mortar

/// Send and clear, with no window. Runs on the iOS simulator job and the Mac
/// job. `testComposerSendsAndClears` is the accessibility press, and it skips
/// when the runner cannot make the window key.
final class MortarComposerSendTests: XCTestCase {
    func testSendTrimsFiresOnceAndClears() {
        var sent: [String] = []
        var draft = MortarComposerDraft(text: "  Hello  ")
        draft.send { sent.append($0) }
        XCTAssertEqual(sent, ["Hello"])
        XCTAssertEqual(draft.text, "")

        var blank = MortarComposerDraft(text: " \n\t ")
        blank.send { sent.append($0) }
        XCTAssertEqual(blank.text, " \n\t ")
        XCTAssertEqual(sent, ["Hello"], "whitespace-only does not send")

        var streaming = MortarComposerDraft(text: "Wait", isStreaming: true)
        streaming.send { sent.append($0) }
        XCTAssertEqual(streaming.text, "Wait")
        XCTAssertEqual(sent, ["Hello"], "a streaming reply does not send")
    }
}
