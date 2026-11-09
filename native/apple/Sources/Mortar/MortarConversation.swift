import SwiftUI

/// A message in a ``MortarConversation``.
public struct MortarChatMessage: Identifiable {
    public enum Role: Sendable { case user, assistant }

    public enum Status {
        case complete
        /// Arriving: dots until the first text, then the text so far.
        case streaming
        /// Not sent or not answered, with a reason and an optional retry.
        case failed(LocalizedStringKey, retry: (() -> Void)? = nil)
    }

    public var id: String
    public var role: Role
    /// Markdown: emphasis, code and links are styled; other blocks show as
    /// written.
    public var text: String
    public var status: Status
    /// Inline replies offered under an assistant message.
    public var choices: [MortarChatChoice]

    public init(
        id: String,
        role: Role,
        text: String,
        status: Status = .complete,
        choices: [MortarChatChoice] = []
    ) {
        self.id = id
        self.role = role
        self.text = text
        self.status = status
        self.choices = choices
    }
}

/// An inline reply under a message, such as a suggested answer.
public struct MortarChatChoice: Identifiable {
    public var id: String
    public var label: String
    public var action: () -> Void

    public init(_ label: String, id: String? = nil, action: @escaping () -> Void) {
        self.id = id ?? label
        self.label = label
        self.action = action
    }
}

/// A conversation, as the web ChatPreview but live: messages in a readable
/// column (centred on wide windows), the user's on the trailing side in the
/// brand's primary, and a composer pinned under them.
///
/// It scrolls to the newest message as messages arrive and grow, and a drag
/// dismisses the keyboard on iOS. Mortar draws the bubbles, type, spacing
/// and states; the app supplies the messages and the composer.
public struct MortarConversation<Composer: View, Empty: View>: View {
    private let messages: [MortarChatMessage]
    private let assistantName: Text
    private let userName: Text
    private let measure: Double
    private let composer: Composer
    private let empty: Empty
    private var mortar = MortarContext()

    /// - Parameters:
    ///   - assistantName: How VoiceOver introduces the assistant's messages.
    ///   - measure: The column's widest, in points.
    ///   - composer: Pinned under the messages, such as a ``MortarCommentComposer``.
    ///   - empty: Shown while there are no messages.
    public init(
        messages: [MortarChatMessage],
        assistantName: LocalizedStringKey = "Assistant",
        userName: LocalizedStringKey = "You",
        measure: Double = 720,
        @ViewBuilder composer: () -> Composer,
        @ViewBuilder empty: () -> Empty
    ) {
        self.messages = messages
        self.assistantName = Text(assistantName)
        self.userName = Text(userName)
        self.measure = measure
        self.composer = composer()
        self.empty = empty()
    }

    /// Changes whenever the newest message does, to keep it in view.
    private var tail: String {
        guard let last = messages.last else { return "" }
        let state: String
        switch last.status {
        case .complete: state = "c"
        case .streaming: state = "s"
        case .failed: state = "f"
        }
        return "\(last.id):\(last.text.count):\(state):\(messages.count)"
    }

    public var body: some View {
        let p = mortar.palette
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    ForEach(messages) { message in
                        MessageRow(message: message, speaker: message.role == .user ? userName : assistantName)
                    }
                    Color.clear.frame(height: 1).id(Self.bottom)
                }
                .padding(16)
                .frame(maxWidth: measure)
                .frame(maxWidth: .infinity)
            }
            .overlay {
                if messages.isEmpty {
                    empty
                        .padding(24)
                        .frame(maxWidth: measure)
                }
            }
            .defaultScrollAnchor(.bottom)
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: tail) {
                withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo(Self.bottom, anchor: .bottom) }
            }
        }
        .background(p[\.paper])
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if Composer.self != EmptyView.self {
                composer
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .padding(.bottom, 12)
                    .frame(maxWidth: measure)
                    .frame(maxWidth: .infinity)
                    .background(p[\.paper])
            }
        }
    }

    private static var bottom: String { "mortar-conversation-bottom" }
}

extension MortarConversation where Empty == EmptyView {
    public init(
        messages: [MortarChatMessage],
        assistantName: LocalizedStringKey = "Assistant",
        userName: LocalizedStringKey = "You",
        measure: Double = 720,
        @ViewBuilder composer: () -> Composer
    ) {
        self.init(messages: messages, assistantName: assistantName, userName: userName,
                  measure: measure, composer: composer) { EmptyView() }
    }
}

private struct MessageRow: View {
    let message: MortarChatMessage
    let speaker: Text
    private var mortar = MortarContext()

    init(message: MortarChatMessage, speaker: Text) {
        self.message = message
        self.speaker = speaker
    }

    private var isUser: Bool { message.role == .user }
    private var isStreaming: Bool {
        if case .streaming = message.status { return true }
        return false
    }

    private var content: AttributedString {
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        return (try? AttributedString(markdown: message.text, options: options)) ?? AttributedString(message.text)
    }

    var body: some View {
        let p = mortar.palette
        let big = MortarTokens.radiusXl
        let small = MortarTokens.radiusSm
        let shape = UnevenRoundedRectangle(
            topLeadingRadius: big,
            bottomLeadingRadius: isUser ? big : small,
            bottomTrailingRadius: isUser ? small : big,
            topTrailingRadius: big
        )
        VStack(alignment: isUser ? .trailing : .leading, spacing: 8) {
            Group {
                if isStreaming && message.text.isEmpty {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(p[\.muted])
                        .symbolEffect(.variableColor.iterative, options: .repeating)
                        .frame(minWidth: 32, minHeight: 20)
                } else {
                    Text(content)
                        .font(mortar.font(15))
                        .lineSpacing(3)
                        .foregroundStyle(isUser ? p[\.onPrimary] : p[\.ink])
                        .tint(isUser ? p[\.onPrimary] : p[\.link])
                        .textSelection(.enabled)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(shape.fill(isUser ? p[\.primary] : p[\.sunken]))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(speaker + Text(verbatim: ": ") + Text(message.text))
            .accessibilityValue(isStreaming ? Text("Responding") : Text(verbatim: ""))

            if case let .failed(reason, retry) = message.status {
                HStack(spacing: 8) {
                    Label { Text(reason) } icon: { Image(systemName: "exclamationmark.circle") }
                        .foregroundStyle(p[\.danger])
                    if let retry {
                        Button("Retry", action: retry)
                            .buttonStyle(.mortar(.ghost, size: .sm))
                    }
                }
                .font(mortar.font(13))
                .accessibilityElement(children: .contain)
            }

            if !message.choices.isEmpty {
                ChoiceFlow(spacing: 8) {
                    ForEach(message.choices) { choice in
                        Button(choice.label, action: choice.action)
                            .buttonStyle(ChoiceStyle())
                    }
                }
            }
        }
        .padding(isUser ? .leading : .trailing, 48)
        .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)
    }
}

/// A suggested reply: a pill with a hairline border, as the web suggestions.
private struct ChoiceStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        ChoicePill(label: configuration.label, isPressed: configuration.isPressed)
    }
}

private struct ChoicePill<Label: View>: View {
    let label: Label
    let isPressed: Bool
    private var mortar = MortarContext()
    @Environment(\.isFocused) private var isFocused

    init(label: Label, isPressed: Bool) {
        self.label = label
        self.isPressed = isPressed
    }

    var body: some View {
        let p = mortar.palette
        let shape = Capsule()
        label
            .font(mortar.font(13, .medium))
            .foregroundStyle(isPressed ? p[\.ink] : p[\.secondary])
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .frame(minHeight: 32)
            .background(shape.fill(isPressed ? p[\.sunken] : p[\.surface]))
            .overlay(shape.strokeBorder(isFocused ? p[\.focus] : p[\.line], lineWidth: isFocused ? 2 : 1))
            .contentShape(shape)
            .focusEffectDisabled()
    }
}

/// Lays its children out in rows, wrapping when a row is full.
private struct ChoiceFlow: Layout {
    var spacing: Double

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x = 0.0, y = 0.0, rowHeight = 0.0, widest = 0.0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0 && x + size.width > width {
                y += rowHeight + spacing
                x = 0
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
            widest = max(widest, x - spacing)
        }
        return CGSize(width: min(widest, width), height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight = 0.0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > bounds.minX && x + size.width > bounds.maxX {
                y += rowHeight + spacing
                x = bounds.minX
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
