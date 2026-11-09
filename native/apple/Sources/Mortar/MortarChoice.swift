import SwiftUI

/// A checkbox with a label, an optional description and an error, as the
/// web Checkbox. The whole row toggles; VoiceOver reads a checkbox.
public struct MortarCheckbox: View {
    private let label: Text
    private let description: Text?
    private let error: Text?
    private let isRequired: Bool
    @Binding private var isOn: Bool
    private var mortar = MortarContext()
    @Environment(\.isEnabled) private var isEnabled

    public init(
        _ label: LocalizedStringKey,
        isOn: Binding<Bool>,
        description: LocalizedStringKey? = nil,
        error: LocalizedStringKey? = nil,
        isRequired: Bool = false
    ) {
        self.label = Text(label)
        self._isOn = isOn
        self.description = description.map { Text($0) }
        self.error = error.map { Text($0) }
        self.isRequired = isRequired
    }

    public var body: some View {
        let p = mortar.palette
        let box = RoundedRectangle(cornerRadius: MortarTokens.radiusSm)
        Button { isOn.toggle() } label: {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                ZStack {
                    box.fill(isOn ? p[\.primary] : p[\.surface])
                    box.strokeBorder(isOn ? p[\.primary] : error != nil ? p[\.danger] : p[\.lineStrong], lineWidth: 1)
                    if isOn {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(p[\.onPrimary])
                    }
                }
                .frame(width: 18, height: 18)
                .alignmentGuide(.firstTextBaseline) { $0[VerticalAlignment.center] + 4 }
                ChoiceText(label: label, description: description, error: error, isRequired: isRequired)
            }
            .frame(maxWidth: .infinity, minHeight: MortarTokens.touchTarget, alignment: .leading)
            .contentShape(Rectangle())
            .opacity(isEnabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .accessibilityRepresentation {
            Toggle(isOn: $isOn) { label }
                .accessibilityHint(hint)
        }
    }

    private var hint: Text {
        let parts = [isRequired ? Text("Required") : nil, error, description].compactMap { $0 }
        guard var joined = parts.first else { return Text(verbatim: "") }
        for part in parts.dropFirst() { joined = joined + Text(verbatim: ". ") + part }
        return joined
    }
}

/// One choice in a ``MortarRadioGroup``.
public struct MortarRadioOption<Value: Hashable>: Identifiable {
    public var value: Value
    public var label: LocalizedStringKey
    public var description: LocalizedStringKey?
    public var isDisabled: Bool
    public var id: Value { value }

    public init(_ label: LocalizedStringKey, value: Value, description: LocalizedStringKey? = nil, isDisabled: Bool = false) {
        self.label = label
        self.value = value
        self.description = description
        self.isDisabled = isDisabled
    }
}

/// A labelled set of mutually exclusive choices, as the web RadioGroup.
public struct MortarRadioGroup<Value: Hashable>: View {
    private let label: Text
    private let options: [MortarRadioOption<Value>]
    private let hint: Text?
    private let error: Text?
    @Binding private var selection: Value?
    private var mortar = MortarContext()

    public init(
        _ label: LocalizedStringKey,
        selection: Binding<Value?>,
        options: [MortarRadioOption<Value>],
        hint: LocalizedStringKey? = nil,
        error: LocalizedStringKey? = nil
    ) {
        self.label = Text(label)
        self._selection = selection
        self.options = options
        self.hint = hint.map { Text($0) }
        self.error = error.map { Text($0) }
    }

    public var body: some View {
        let p = mortar.palette
        VStack(alignment: .leading, spacing: 4) {
            label
                .font(mortar.font(13, .semibold))
                .foregroundStyle(p[\.ink])
                .accessibilityAddTraits(.isHeader)
            if let hint {
                hint.font(mortar.font(12)).foregroundStyle(p[\.muted])
            }
            if let error {
                Label { error } icon: { Image(systemName: "exclamationmark.circle") }
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.danger])
            }
            ForEach(options) { option in
                RadioRow(
                    option: option,
                    isSelected: selection == option.value,
                    isInvalid: error != nil
                ) { selection = option.value }
            }
        }
        .accessibilityElement(children: .contain)
    }
}

private struct RadioRow<Value: Hashable>: View {
    let option: MortarRadioOption<Value>
    let isSelected: Bool
    let isInvalid: Bool
    let select: () -> Void
    private var mortar = MortarContext()
    @Environment(\.isEnabled) private var isEnabled

    init(option: MortarRadioOption<Value>, isSelected: Bool, isInvalid: Bool, select: @escaping () -> Void) {
        self.option = option
        self.isSelected = isSelected
        self.isInvalid = isInvalid
        self.select = select
    }

    var body: some View {
        let p = mortar.palette
        let enabled = isEnabled && !option.isDisabled
        Button(action: select) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Circle()
                    .strokeBorder(isSelected ? p[\.primary] : isInvalid ? p[\.danger] : p[\.lineStrong], lineWidth: isSelected ? 5 : 1)
                    .background(Circle().fill(p[\.surface]))
                    .frame(width: 18, height: 18)
                    .alignmentGuide(.firstTextBaseline) { $0[VerticalAlignment.center] + 4 }
                ChoiceText(label: Text(option.label), description: option.description.map { Text($0) }, error: nil, isRequired: false)
            }
            .frame(maxWidth: .infinity, minHeight: MortarTokens.touchTarget, alignment: .leading)
            .contentShape(Rectangle())
            .opacity(enabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }
}

private struct ChoiceText: View {
    let label: Text
    let description: Text?
    let error: Text?
    let isRequired: Bool
    private var mortar = MortarContext()

    init(label: Text, description: Text?, error: Text?, isRequired: Bool) {
        self.label = label
        self.description = description
        self.error = error
        self.isRequired = isRequired
    }

    var body: some View {
        let p = mortar.palette
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 2) {
                label
                if isRequired {
                    Text(verbatim: "*").foregroundStyle(p[\.danger]).accessibilityHidden(true)
                }
            }
            .font(mortar.font(mortar.theme.density.fontSize))
            .foregroundStyle(p[\.ink])
            if let description {
                description.font(mortar.font(12)).foregroundStyle(p[\.muted])
            }
            if let error {
                error.font(mortar.font(12)).foregroundStyle(p[\.danger])
            }
        }
    }
}
