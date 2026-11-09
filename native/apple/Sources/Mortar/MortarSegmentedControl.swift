import SwiftUI

/// A small set of views or filters to switch between, as the web
/// SegmentedControl. The selected segment reads as selected to VoiceOver.
public struct MortarSegmentedControl<Value: Hashable>: View {
    private let label: Text
    private let options: [(value: Value, label: LocalizedStringKey)]
    @Binding private var selection: Value
    private var mortar = MortarContext()

    public init(_ label: LocalizedStringKey, selection: Binding<Value>, options: [(value: Value, label: LocalizedStringKey)]) {
        self.label = Text(label)
        self._selection = selection
        self.options = options
    }

    public var body: some View {
        let p = mortar.palette
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 2) {
                ForEach(options.indices, id: \.self) { index in
                    let option = options[index]
                    let isSelected = option.value == selection
                    Button { selection = option.value } label: {
                        Text(option.label)
                            .font(mortar.font(12, .medium))
                            .foregroundStyle(isSelected ? p[\.ink] : p[\.muted])
                            .lineLimit(1)
                            .padding(.horizontal, 10)
                            .frame(minHeight: MortarTokens.touchTarget - 6)
                            .background {
                                if isSelected {
                                    RoundedRectangle(cornerRadius: 6).fill(p[\.surface])
                                        .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(p[\.line], lineWidth: 1))
                                }
                            }
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
                }
            }
            .padding(3)
            .background(RoundedRectangle(cornerRadius: MortarTokens.radius).fill(p[\.sunken]))
        }
        .fixedSize(horizontal: false, vertical: true)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}
