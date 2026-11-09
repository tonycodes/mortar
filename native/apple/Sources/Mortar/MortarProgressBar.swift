import SwiftUI

/// Progress towards a goal, with its label and value, as the web ProgressBar.
public struct MortarProgressBar: View {
    private let label: Text
    private let value: Double
    private let total: Double
    private let valueLabel: String?
    private let tone: MortarTone?
    private var mortar = MortarContext()

    /// - Parameters:
    ///   - valueLabel: The value as people read it, such as "3 of 5 steps";
    ///     a percentage when nil.
    ///   - tone: A status colour; the brand's primary when nil.
    public init(
        _ label: LocalizedStringKey,
        value: Double,
        total: Double = 100,
        valueLabel: String? = nil,
        tone: MortarTone? = nil
    ) {
        self.label = Text(label)
        self.value = value
        self.total = total
        self.valueLabel = valueLabel
        self.tone = tone
    }

    private var fraction: Double { total > 0 ? min(max(value / total, 0), 1) : 0 }

    public var body: some View {
        let p = mortar.palette
        let text = valueLabel ?? "\(Int((fraction * 100).rounded()))%"
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                label.font(mortar.font(12, .semibold)).foregroundStyle(p[\.ink])
                Spacer(minLength: 12)
                Text(verbatim: text)
                    .font(.system(size: 12 * mortar.dynamicTypeSize.mortarScale, design: .monospaced))
                    .foregroundStyle(p[\.muted])
            }
            GeometryReader { proxy in
                Capsule()
                    .fill(p[\.sunken])
                    .overlay(alignment: .leading) {
                        Capsule()
                            .fill(tone?.colour(in: p) ?? p[\.primary])
                            .frame(width: proxy.size.width * fraction)
                    }
            }
            .frame(height: 6)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue(Text(verbatim: text))
    }
}
