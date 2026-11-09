import SwiftUI

/// An option in a ``MortarPicker``.
public struct MortarPickerOption<Value: Hashable>: Identifiable {
    public var value: Value
    public var label: String
    public var id: Value { value }

    public init(_ label: String, value: Value) {
        self.label = label
        self.value = value
    }
}

/// A labelled choice of one option from a menu, as the web Select: the
/// field shows the chosen option in Mortar's field box, and a tap or click
/// opens the system menu. VoiceOver reads the label, the chosen option as
/// its value, then "required", the error and the hint.
public struct MortarPicker<Value: Hashable>: View {
    private let label: Text
    @Binding private var selection: Value
    private let options: [MortarPickerOption<Value>]
    private let placeholder: String?
    private let hint: Text?
    private let error: Text?
    private let isRequired: Bool
    private var mortar = MortarContext()
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameter placeholder: Shown while the selection matches no option.
    public init(
        _ label: LocalizedStringKey,
        selection: Binding<Value>,
        options: [MortarPickerOption<Value>],
        placeholder: String? = nil,
        hint: LocalizedStringKey? = nil,
        error: LocalizedStringKey? = nil,
        isRequired: Bool = false
    ) {
        self.label = Text(label)
        self._selection = selection
        self.options = options
        self.placeholder = placeholder
        self.hint = hint.map { Text($0) }
        self.error = error.map { Text($0) }
        self.isRequired = isRequired
    }

    private var chosen: MortarPickerOption<Value>? {
        options.first { $0.value == selection }
    }

    public var body: some View {
        let p = mortar.palette
        let density = mortar.theme.density
        FieldChrome(label: label, hint: hint, error: error, isRequired: isRequired) {
            Menu {
                ForEach(options) { option in
                    Button {
                        selection = option.value
                    } label: {
                        if option.value == selection {
                            Label(option.label, systemImage: "checkmark")
                        } else {
                            Text(option.label)
                        }
                    }
                }
            } label: {
                HStack(spacing: 8) {
                    Text(verbatim: chosen?.label ?? placeholder ?? "")
                        .foregroundStyle(chosen == nil ? p[\.muted] : isEnabled ? p[\.ink] : p[\.muted])
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(p[\.muted])
                }
                .font(mortar.font(density.fontSize))
                .padding(.horizontal, density.pad)
                .frame(maxWidth: .infinity, minHeight: mortar.scaled(max(density.control, MortarTokens.touchTarget)))
                .contentShape(Rectangle())
            }
            .menuStyle(.button)
            .buttonStyle(FieldBoxStyle(isInvalid: error != nil))
            .menuIndicator(.hidden)
            .focusEffectDisabled()
            .accessibilityLabel(label)
            .accessibilityValue(Text(verbatim: chosen?.label ?? ""))
            .accessibilityHint(FieldChrome<EmptyView>.hint(isRequired: isRequired, error: error, hint: hint))
        }
    }
}

/// A button drawn as Mortar's field box, with its focus ring for keyboard
/// focus in place of the system's.
private struct FieldBoxStyle: ButtonStyle {
    let isInvalid: Bool

    func makeBody(configuration: Configuration) -> some View {
        FieldBox(label: configuration.label, isPressed: configuration.isPressed, isInvalid: isInvalid)
    }
}

private struct FieldBox<Label: View>: View {
    let label: Label
    let isPressed: Bool
    let isInvalid: Bool
    private var mortar = MortarContext()
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused

    init(label: Label, isPressed: Bool, isInvalid: Bool) {
        self.label = label
        self.isPressed = isPressed
        self.isInvalid = isInvalid
    }

    var body: some View {
        let p = mortar.palette
        let shape = RoundedRectangle(cornerRadius: MortarTokens.radius)
        let border = isInvalid ? p[\.danger] : isFocused ? p[\.focus] : p[\.lineStrong]
        label
            .background(shape.fill(!isEnabled ? p[\.sunken] : isPressed ? p[\.sunken] : p[\.surface]))
            .overlay(shape.strokeBorder(border, lineWidth: isFocused || isInvalid ? 2 : 1))
    }
}
