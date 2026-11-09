import SwiftUI

/// A labelled text field with an optional hint and error, as the web Input.
/// The label, hint and error stay visible; VoiceOver reads the label as the
/// field's name and the error, then the hint, after its value.
public struct MortarTextField: View {
    private let label: Text
    @Binding private var text: String
    private let prompt: String?
    private let hint: Text?
    private let error: Text?
    private let isRequired: Bool
    private let isSecure: Bool
    private var mortar = MortarContext()
    @FocusState private var isFocused: Bool
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - prompt: Placeholder text. Never a substitute for the label.
    ///   - isRequired: Adds a marker to the label; VoiceOver says "required".
    ///   - isSecure: A password field.
    public init(
        _ label: LocalizedStringKey,
        text: Binding<String>,
        prompt: LocalizedStringResource? = nil,
        hint: LocalizedStringKey? = nil,
        error: LocalizedStringKey? = nil,
        isRequired: Bool = false,
        isSecure: Bool = false
    ) {
        self.label = Text(label)
        self._text = text
        // Verbatim, so an example address or URL isn't styled as a link.
        self.prompt = prompt.map { String(localized: $0) }
        self.hint = hint.map { Text($0) }
        self.error = error.map { Text($0) }
        self.isRequired = isRequired
        self.isSecure = isSecure
    }

    public var body: some View {
        let p = mortar.palette
        let density = mortar.theme.density
        let shape = RoundedRectangle(cornerRadius: MortarTokens.radius)
        let border = error != nil ? p[\.danger] : isFocused ? p[\.focus] : p[\.lineStrong]
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 2) {
                label
                if isRequired {
                    Text(verbatim: "*")
                        .foregroundStyle(p[\.danger])
                        .accessibilityHidden(true)
                }
            }
            .font(mortar.font(13, .semibold))
            .foregroundStyle(p[\.ink])
            .accessibilityHidden(true)

            field
                .font(mortar.font(density.fontSize))
                .foregroundStyle(isEnabled ? p[\.ink] : p[\.muted])
                .tint(p[\.primary])
                .focused($isFocused)
                .padding(.horizontal, density.pad)
                .frame(minHeight: mortar.scaled(max(density.control, MortarTokens.touchTarget)))
                .background(shape.fill(isEnabled ? p[\.surface] : p[\.sunken]))
                .overlay(shape.strokeBorder(border, lineWidth: isFocused || error != nil ? 2 : 1))
                .accessibilityLabel(label)
                .accessibilityHint(accessibilityHint)

            if let error {
                Label { error } icon: { Image(systemName: "exclamationmark.circle") }
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.danger])
                    .tint(p[\.danger])
                    .accessibilityHidden(true)
            }
            if let hint {
                hint
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.muted])
                    .tint(p[\.muted])
                    .accessibilityHidden(true)
            }
        }
    }

    @ViewBuilder private var field: some View {
        let placeholder = prompt.map { Text(verbatim: $0).foregroundStyle(mortar.palette[\.muted]) }
        if isSecure {
            SecureField(text: $text, prompt: placeholder) { label }
        } else {
            TextField(text: $text, prompt: placeholder) { label }
        }
    }

    private var accessibilityHint: Text {
        let parts = [isRequired ? Text("Required") : nil, error, hint].compactMap { $0 }
        guard var joined = parts.first else { return Text(verbatim: "") }
        for part in parts.dropFirst() { joined = joined + Text(verbatim: ". ") + part }
        return joined
    }
}
