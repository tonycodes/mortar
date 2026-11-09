import SwiftUI

/// One row of a ``MortarStackedList``.
public struct MortarListItem: Identifiable {
    /// What leads a row: a person's avatar or an SF Symbol in a tile.
    public enum Leading {
        case avatar(name: String, image: URL? = nil)
        case systemImage(String)
    }

    public var id: String
    public var title: String
    public var description: String?
    public var leading: Leading?
    /// Short text at the end of the row, such as a date or a count.
    public var trailing: String?
    /// Makes the row a button; with `chevrons`, it ends in a chevron.
    public var action: (() -> Void)?

    public init(
        id: String,
        title: String,
        description: String? = nil,
        leading: Leading? = nil,
        trailing: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.leading = leading
        self.trailing = trailing
        self.action = action
    }
}

/// A bordered list of people, files or records, optionally grouped under
/// sticky headings, as the web StackedList.
public struct MortarStackedList: View {
    private let title: Text?
    private let groups: [(label: String?, items: [MortarListItem])]
    private let chevrons: Bool
    private var mortar = MortarContext()

    public init(_ title: LocalizedStringKey? = nil, items: [MortarListItem], chevrons: Bool = false) {
        self.title = title.map { Text($0) }
        self.groups = [(nil, items)]
        self.chevrons = chevrons
    }

    public init(_ title: LocalizedStringKey? = nil, groups: [(label: String, items: [MortarListItem])], chevrons: Bool = false) {
        self.title = title.map { Text($0) }
        self.groups = groups.map { ($0.label, $0.items) }
        self.chevrons = chevrons
    }

    public var body: some View {
        let p = mortar.palette
        let shape = RoundedRectangle(cornerRadius: MortarTokens.radiusLg)
        VStack(alignment: .leading, spacing: 0) {
            if let title {
                title
                    .font(mortar.font(15, .semibold, heading: true))
                    .foregroundStyle(p[\.ink])
                    .accessibilityAddTraits(.isHeader)
                    .padding(.vertical, 14)
                    .padding(.horizontal, 18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                rule
            }
            ForEach(groups.indices, id: \.self) { g in
                let group = groups[g]
                if let label = group.label {
                    Text(verbatim: label)
                        .font(mortar.font(12, .semibold))
                        .foregroundStyle(p[\.secondary])
                        .padding(.vertical, 6)
                        .padding(.horizontal, 18)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(p[\.sunken])
                        .accessibilityAddTraits(.isHeader)
                    rule
                }
                ForEach(group.items.indices, id: \.self) { i in
                    row(group.items[i])
                    if i < group.items.count - 1 || g < groups.count - 1 { rule }
                }
            }
        }
        .background(p[\.surface])
        .clipShape(shape)
        .overlay(shape.strokeBorder(p[\.line], lineWidth: 1))
    }

    private var rule: some View {
        Rectangle().fill(mortar.palette[\.line]).frame(height: 1)
    }

    @ViewBuilder private func row(_ item: MortarListItem) -> some View {
        let content = RowContent(item: item, chevron: chevrons && item.action != nil)
        if let action = item.action {
            Button(action: action) { content }.buttonStyle(MortarRowStyle())
        } else {
            content.accessibilityElement(children: .combine)
        }
    }
}

private struct MortarRowStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        RowPress(configuration: configuration)
    }

    private struct RowPress: View {
        let configuration: ButtonStyleConfiguration
        @Environment(\.mortarTheme) private var theme
        @Environment(\.colorScheme) private var scheme

        var body: some View {
            configuration.label
                .background(configuration.isPressed ? theme.palette(for: scheme)[\.sunken] : .clear)
        }
    }
}

private struct RowContent: View {
    let item: MortarListItem
    let chevron: Bool
    private var mortar = MortarContext()

    init(item: MortarListItem, chevron: Bool) {
        self.item = item
        self.chevron = chevron
    }

    var body: some View {
        let p = mortar.palette
        let density = mortar.theme.density
        HStack(spacing: 12) {
            switch item.leading {
            case .avatar(let name, let image):
                MortarAvatar(name: name, image: image, decorative: true)
            case .systemImage(let symbol):
                Image(systemName: symbol)
                    .font(.system(size: 15))
                    .foregroundStyle(p[\.secondary])
                    .frame(width: 34, height: 34)
                    .background(RoundedRectangle(cornerRadius: MortarTokens.radius).fill(p[\.sunken]))
                    .accessibilityHidden(true)
            case nil:
                EmptyView()
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(verbatim: item.title)
                    .font(mortar.font(density.fontSize, .semibold))
                    .foregroundStyle(p[\.ink])
                if let description = item.description {
                    Text(verbatim: description)
                        .font(mortar.font(12))
                        .foregroundStyle(p[\.muted])
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if let trailing = item.trailing {
                Text(verbatim: trailing)
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.muted])
            }
            if chevron {
                Image(systemName: "chevron.forward")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(p[\.muted])
                    .accessibilityHidden(true)
            }
        }
        .padding(.vertical, density.rowPad)
        .padding(.horizontal, 18)
        .frame(minHeight: MortarTokens.touchTarget)
        .contentShape(Rectangle())
    }
}
