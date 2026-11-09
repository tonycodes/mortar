import SwiftUI

/// A rule between groups of content, optionally with a label in the middle.
public struct MortarDivider: View {
    public enum Spacing: Sendable { case none, sm, md, lg }

    private let label: Text?
    private let soft: Bool
    private let spacing: Spacing
    private var mortar = MortarContext()

    /// - Parameter soft: The quieter line colour, for dividers inside cards.
    public init(_ label: LocalizedStringKey? = nil, soft: Bool = false, spacing: Spacing = .md) {
        self.label = label.map { Text($0) }
        self.soft = soft
        self.spacing = spacing
    }

    private var gap: Double {
        switch spacing {
        case .none: 0
        case .sm: 12
        case .md: 24
        case .lg: 40
        }
    }

    public var body: some View {
        let p = mortar.palette
        let line = Rectangle().fill(soft ? p[\.line] : p[\.lineStrong]).frame(height: 1)
        Group {
            if let label {
                HStack(spacing: 12) {
                    line
                    label.font(mortar.font(13)).foregroundStyle(p[\.muted]).fixedSize()
                    line
                }
            } else {
                line.accessibilityHidden(true)
            }
        }
        .padding(.vertical, gap)
    }
}
