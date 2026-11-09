import SwiftUI

/// Send rules for ``MortarCommentComposer``, without a window. The view
/// writes `text` back after ``send(_:)``.
struct MortarComposerDraft: Equatable {
    var text: String
    var isStreaming = false

    /// Calls `onSend` with the trimmed draft, then clears it. Whitespace-only
    /// text and a streaming reply do not send, and they leave `text` as it is.
    mutating func send(_ onSend: (String) -> Void) {
        let message = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, !isStreaming else { return }
        onSend(message)
    }
}

/// A compact message composer, as the web CommentComposer: one row that
/// grows with its text, an optional attachment action at the leading edge
/// and Send (or Stop, while a reply streams) at the trailing edge.
///
/// Mortar draws the field, its surface, radius, spacing and focus ring; the
/// app supplies the text, the actions and what Send does. Sending is
/// Command-Return on a Mac or a hardware keyboard. Return adds a line.
/// While `isStreaming`, the text stays editable and Stop replaces Send;
/// nothing outside the composer is disabled.
public struct MortarCommentComposer: View {
    private let label: Text
    @Binding private var text: String
    private let placeholder: String
    private let maxLength: Int?
    private let showsCount: Bool
    private let hint: Text?
    private let error: Text?
    private let isStreaming: Bool
    private let isFocused: Binding<Bool>?
    private let onAttach: (() -> Void)?
    private let attachLabel: Text
    private let sendLabel: Text
    private let stopLabel: Text
    private let onStop: (() -> Void)?
    private let onSend: (String) -> Void
    private var mortar = MortarContext()
    @FocusState private var fieldFocused: Bool
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - label: The field's accessible name; not shown.
    ///   - maxLength: Text past it is cut off.
    ///   - showsCount: Shows the characters used out of `maxLength`.
    ///   - isStreaming: A reply is arriving: Stop replaces Send.
    ///   - isFocused: Moves focus to the field, or away to dismiss the
    ///     keyboard, and follows it.
    ///   - onAttach: Adds an attachment button at the leading edge.
    ///   - onSend: Called with the trimmed text; the composer then clears it.
    public init(
        text: Binding<String>,
        label: LocalizedStringKey = "Message",
        placeholder: LocalizedStringResource = "Message",
        maxLength: Int? = nil,
        showsCount: Bool = false,
        hint: LocalizedStringKey? = nil,
        error: LocalizedStringKey? = nil,
        isStreaming: Bool = false,
        isFocused: Binding<Bool>? = nil,
        onAttach: (() -> Void)? = nil,
        attachLabel: LocalizedStringKey = "Add attachment",
        sendLabel: LocalizedStringKey = "Send",
        stopLabel: LocalizedStringKey = "Stop",
        onStop: (() -> Void)? = nil,
        onSend: @escaping (String) -> Void
    ) {
        self.label = Text(label)
        self._text = text
        self.placeholder = String(localized: placeholder)
        self.maxLength = maxLength
        self.showsCount = showsCount && maxLength != nil
        self.hint = hint.map { Text($0) }
        self.error = error.map { Text($0) }
        self.isStreaming = isStreaming
        self.isFocused = isFocused
        self.onAttach = onAttach
        self.attachLabel = Text(attachLabel)
        self.sendLabel = Text(sendLabel)
        self.stopLabel = Text(stopLabel)
        self.onStop = onStop
        self.onSend = onSend
    }

    private var trimmed: String { text.trimmingCharacters(in: .whitespacesAndNewlines) }

    public var body: some View {
        let p = mortar.palette
        let shape = RoundedRectangle(cornerRadius: MortarTokens.radiusXl)
        let border = error != nil ? p[\.danger] : fieldFocused ? p[\.focus] : p[\.lineStrong]
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .bottom, spacing: 4) {
                if let onAttach {
                    Button(action: onAttach) {
                        Image(systemName: "paperclip")
                    }
                    .buttonStyle(ComposerIconStyle(kind: .plain))
                    .accessibilityLabel(attachLabel)
                    .focusEffectDisabled()
                }

                TextField(text: $text, prompt: Text(verbatim: placeholder).foregroundStyle(p[\.muted]), axis: .vertical) {
                    label
                }
                .lineLimit(1...6)
                .font(mortar.font(mortar.theme.density.fontSize))
                .foregroundStyle(isEnabled ? p[\.ink] : p[\.muted])
                .tint(p[\.primary])
                .textFieldStyle(.plain)
                .focused($fieldFocused)
                .padding(.vertical, 10)
                .padding(.leading, onAttach == nil ? 12 : 0)
                .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                .accessibilityHint(accessibilityHint)

                if showsCount, let maxLength {
                    Text(verbatim: "\(text.count)/\(maxLength)")
                        .monospacedDigit()
                        .font(mortar.font(12))
                        .foregroundStyle(text.count >= maxLength ? p[\.danger] : p[\.muted])
                        .padding(.bottom, 14)
                        .accessibilityLabel(Text("\(maxLength - text.count) characters left"))
                }

                if isStreaming {
                    Button { onStop?() } label: {
                        Image(systemName: "stop.fill")
                    }
                    .buttonStyle(ComposerIconStyle(kind: .filled))
                    .accessibilityLabel(stopLabel)
                    .focusEffectDisabled()
                    .keyboardShortcut(".", modifiers: .command)
                } else {
                    Button(action: send) {
                        Image(systemName: "arrow.up")
                    }
                    .buttonStyle(ComposerIconStyle(kind: .filled))
                    .disabled(trimmed.isEmpty)
                    .accessibilityLabel(sendLabel)
                    .focusEffectDisabled()
                    .keyboardShortcut(.return, modifiers: .command)
                }
            }
            .padding(4)
            .background(shape.fill(isEnabled ? p[\.surface] : p[\.sunken]))
            .overlay(shape.strokeBorder(border, lineWidth: fieldFocused || error != nil ? 2 : 1))

            if let error {
                Label { error } icon: { Image(systemName: "exclamationmark.circle") }
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.danger])
                    .accessibilityHidden(true)
            } else if let hint {
                hint
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.muted])
                    .accessibilityHidden(true)
            }
        }
        .onChange(of: text) { _, new in
            if let maxLength, new.count > maxLength { text = String(new.prefix(maxLength)) }
        }
        .onChange(of: fieldFocused) { _, new in
            if let isFocused, isFocused.wrappedValue != new { isFocused.wrappedValue = new }
        }
        .onChange(of: isFocused?.wrappedValue) { _, new in
            if let new, new != fieldFocused { fieldFocused = new }
        }
        .onAppear {
            if let isFocused, isFocused.wrappedValue { fieldFocused = true }
        }
    }

    private func send() {
        var draft = MortarComposerDraft(text: text, isStreaming: isStreaming)
        draft.send(onSend)
        text = draft.text
    }

    private var accessibilityHint: Text {
        let parts = [error, hint].compactMap { $0 }
        guard var joined = parts.first else { return Text(verbatim: "") }
        for part in parts.dropFirst() { joined = joined + Text(verbatim: ". ") + part }
        return joined
    }
}

/// The composer's round icon buttons: 32-point marks in a 44-point target.
private struct ComposerIconStyle: ButtonStyle {
    enum Kind { case plain, filled }
    let kind: Kind

    func makeBody(configuration: Configuration) -> some View {
        ComposerIcon(label: configuration.label, isPressed: configuration.isPressed, kind: kind)
    }
}

private struct ComposerIcon<Label: View>: View {
    let label: Label
    let isPressed: Bool
    let kind: ComposerIconStyle.Kind
    private var mortar = MortarContext()
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused

    init(label: Label, isPressed: Bool, kind: ComposerIconStyle.Kind) {
        self.label = label
        self.isPressed = isPressed
        self.kind = kind
    }

    var body: some View {
        let p = mortar.palette
        let filled = kind == .filled
        let fill: Color = !filled ? (isPressed ? p[\.sunken] : .clear)
            : !isEnabled ? p[\.sunken]
            : isPressed ? p[\.primaryActive] : p[\.primary]
        let ink: Color = filled ? (isEnabled ? p[\.onPrimary] : p[\.muted]) : p[\.secondary]
        label
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(ink)
            .frame(width: 32, height: 32)
            .background(Circle().fill(fill))
            .overlay {
                if isFocused { Circle().strokeBorder(p[\.focus], lineWidth: 2).padding(-3) }
            }
            .frame(width: 44, height: 44)
            .contentShape(Rectangle())
    }
}
