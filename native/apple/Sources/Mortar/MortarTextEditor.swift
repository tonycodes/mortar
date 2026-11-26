import SwiftUI

/// A labelled multi-line field, as the web TextArea: it starts at
/// `minLines` and grows with its text to `maxLines`, then scrolls.
/// VoiceOver reads the label as its name, then "required", the error and
/// the hint.
public struct MortarTextEditor: View {
    private let label: Text
    @Binding private var text: String
    private let prompt: String?
    private let hint: Text?
    private let error: Text?
    private let isRequired: Bool
    private let lines: ClosedRange<Int>
    private var mortar = MortarContext()
    @FocusState private var isFocused: Bool
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameter prompt: Placeholder text. Never a substitute for the label.
    public init(
        _ label: LocalizedStringKey,
        text: Binding<String>,
        prompt: LocalizedStringResource? = nil,
        hint: LocalizedStringKey? = nil,
        error: LocalizedStringKey? = nil,
        isRequired: Bool = false,
        minLines: Int = 3,
        maxLines: Int = 10
    ) {
        self.label = Text(label)
        self._text = text
        self.prompt = prompt.map { String(localized: $0) }
        self.hint = hint.map { Text($0) }
        self.error = error.map { Text($0) }
        self.isRequired = isRequired
        self.lines = max(1, minLines)...max(minLines, maxLines)
    }

    public var body: some View {
        let p = mortar.palette
        let density = mortar.theme.density
        let shape = RoundedRectangle(cornerRadius: MortarTokens.radius)
        let border = error != nil ? p[\.danger] : isFocused ? p[\.focus] : p[\.lineStrong]
        FieldChrome(label: label, hint: hint, error: error, isRequired: isRequired) {
            // A vertical TextField, not TextEditor: it takes a placeholder,
            // sizes to its lines and draws no background of its own.
            TextField(text: $text, prompt: prompt.map { Text(verbatim: $0).foregroundStyle(p[\.muted]) },
                      axis: .vertical) { label }
                .lineLimit(lines)
                .textFieldStyle(.plain)
                .font(mortar.font(density.fontSize))
                .lineSpacing(2)
                .foregroundStyle(isEnabled ? p[\.ink] : p[\.muted])
                .tint(p[\.primary])
                .focused($isFocused)
                .padding(.horizontal, density.pad)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .topLeading)
                .background(shape.fill(isEnabled ? p[\.surface] : p[\.sunken]))
                .overlay(shape.strokeBorder(border, lineWidth: isFocused || error != nil ? 2 : 1))
                .accessibilityLabel(label)
                .accessibilityHint(FieldChrome<EmptyView>.hint(isRequired: isRequired, error: error, hint: hint))
        }
    }
}
