import SwiftUI

/// A top-level destination in a ``MortarAppShell``.
public struct MortarNavigationItem<Value: Hashable>: Identifiable {
    public var value: Value
    public var label: LocalizedStringKey
    public var systemImage: String
    /// A count beside the label, such as unread items. Hidden when `nil` or 0.
    public var count: Int?
    public var id: Value { value }

    public init(_ label: LocalizedStringKey, systemImage: String, value: Value, count: Int? = nil) {
        self.label = label
        self.systemImage = systemImage
        self.value = value
        self.count = count
    }
}

/// A labelled group of destinations under a ``MortarAppShell``'s main
/// navigation, as the web AppShell's `sections`.
public struct MortarNavigationGroup<Value: Hashable> {
    public var label: LocalizedStringKey
    public var items: [MortarNavigationItem<Value>]

    public init(_ label: LocalizedStringKey, items: [MortarNavigationItem<Value>]) {
        self.label = label
        self.items = items
    }
}

/// An app's top-level navigation, as the web AppShell: a sidebar where
/// there is room (iPad, Mac, iPhone in landscape on large models) and a tab
/// bar on iPhone.
///
/// Each destination gets its own navigation stack: changing destination
/// starts the new one at its root, so Back never returns to a screen pushed
/// under another destination. The shell owns the sidebar's surface,
/// selection, spacing and keyboard focus ring; the app supplies only the
/// destinations, their screens and the footer's content.
public struct MortarAppShell<Value: Hashable, Footer: View, Content: View>: View {
    private let brand: Text?
    private let items: [MortarNavigationItem<Value>]
    private let sections: [MortarNavigationGroup<Value>]
    @Binding private var selection: Value
    private let content: (Value) -> Content
    private let footer: Footer
    private var mortar = MortarContext()
    #if os(iOS)
    @Environment(\.horizontalSizeClass) private var sizeClass
    #endif

    /// - Parameters:
    ///   - brand: The sidebar's title. Without one, the sidebar reserves no
    ///     large-title space for it.
    ///   - sections: Labelled groups under `items`. On iPhone they join the
    ///     tab bar after `items`.
    ///   - content: The screen for a destination.
    ///   - footer: Pinned to the bottom of the sidebar, such as an avatar,
    ///     name and account menu. Not shown on iPhone, which has no sidebar:
    ///     give account actions a destination of their own there.
    public init(
        _ brand: LocalizedStringKey? = nil,
        selection: Binding<Value>,
        items: [MortarNavigationItem<Value>],
        sections: [MortarNavigationGroup<Value>] = [],
        @ViewBuilder content: @escaping (Value) -> Content,
        @ViewBuilder footer: () -> Footer
    ) {
        self.brand = brand.map { Text($0) }
        self._selection = selection
        self.items = items
        self.sections = sections
        self.content = content
        self.footer = footer()
    }

    private var isCompact: Bool {
        #if os(iOS)
        sizeClass == .compact
        #else
        false
        #endif
    }

    private var hasFooter: Bool { Footer.self != EmptyView.self }

    public var body: some View {
        let p = mortar.palette
        Group {
            if isCompact {
                TabView(selection: $selection) {
                    ForEach(items + sections.flatMap(\.items)) { item in
                        NavigationStack { screen(item.value) }
                            .tabItem { Label(item.label, systemImage: item.systemImage) }
                            .badge(item.count ?? 0)
                            .tag(item.value)
                    }
                }
            } else {
                NavigationSplitView {
                    List {
                        ForEach(items) { row($0) }
                        ForEach(sections.indices, id: \.self) { index in
                            Section {
                                ForEach(sections[index].items) { row($0) }
                            } header: {
                                Text(sections[index].label)
                                    .font(mortar.font(11, .semibold))
                                    .tracking(11 * MortarTokens.trackingCaps)
                                    .textCase(.uppercase)
                                    .foregroundStyle(p[\.muted])
                                    .accessibilityAddTraits(.isHeader)
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                    .background(p[\.sunken])
                    .safeAreaInset(edge: .bottom, spacing: 0) {
                        if hasFooter {
                            VStack(spacing: 0) {
                                Rectangle().fill(p[\.line]).frame(height: 1)
                                footer
                                    .font(mortar.font(mortar.theme.density.fontSize))
                                    .foregroundStyle(p[\.ink])
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 10)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .background(p[\.sunken])
                        }
                    }
                    .modifier(SidebarTitle(brand: brand))
                } detail: {
                    // A fresh stack per destination: the old destination's
                    // pushed screens don't stay on top of the new one.
                    NavigationStack { screen(selection) }
                        .id(selection)
                }
            }
        }
        .tint(p[\.primary])
    }

    private func row(_ item: MortarNavigationItem<Value>) -> some View {
        let isSelected = item.value == selection
        let count = (item.count ?? 0) > 0 ? item.count : nil
        return Button { selection = item.value } label: {
            HStack(spacing: 8) {
                Label(item.label, systemImage: item.systemImage)
                Spacer(minLength: 8)
                if let count {
                    Text(count, format: .number)
                        .font(mortar.font(11).monospaced())
                        .foregroundStyle(mortar.palette[\.muted])
                        .accessibilityHidden(true)
                }
            }
        }
        .buttonStyle(SidebarRowStyle(isSelected: isSelected))
        .focusEffectDisabled()
        .listRowBackground(
            RoundedRectangle(cornerRadius: MortarTokens.radius)
                .fill(isSelected ? mortar.palette[\.surface] : .clear)
                .padding(.horizontal, 8)
        )
        .accessibilityValue(count.map { Text("\($0)") } ?? Text(verbatim: ""))
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }

    private func screen(_ value: Value) -> some View {
        content(value)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(mortar.palette[\.paper])
    }
}

extension MortarAppShell where Footer == EmptyView {
    /// A shell without a sidebar footer.
    public init(
        _ brand: LocalizedStringKey? = nil,
        selection: Binding<Value>,
        items: [MortarNavigationItem<Value>],
        sections: [MortarNavigationGroup<Value>] = [],
        @ViewBuilder content: @escaping (Value) -> Content
    ) {
        self.init(brand, selection: selection, items: items, sections: sections, content: content) {
            EmptyView()
        }
    }
}

/// The sidebar's title, or none: without a brand an iPad sidebar keeps a
/// compact bar for its toggle instead of an empty large title.
private struct SidebarTitle: ViewModifier {
    let brand: Text?

    func body(content: Content) -> some View {
        if let brand {
            content.navigationTitle(brand)
        } else {
            #if os(iOS)
            content.navigationBarTitleDisplayMode(.inline)
            #else
            content
            #endif
        }
    }
}

/// A sidebar row, as the web sidebar's links: the current destination on
/// the surface in the link colour and semibold. Mortar's type, and
/// Mortar's focus ring for keyboard focus in place of the system's.
private struct SidebarRowStyle: ButtonStyle {
    let isSelected: Bool

    func makeBody(configuration: Configuration) -> some View {
        SidebarRow(label: configuration.label, isPressed: configuration.isPressed, isSelected: isSelected)
    }
}

private struct SidebarRow<Label: View>: View {
    let label: Label
    let isPressed: Bool
    let isSelected: Bool
    private var mortar = MortarContext()
    @Environment(\.isFocused) private var isFocused

    init(label: Label, isPressed: Bool, isSelected: Bool) {
        self.label = label
        self.isPressed = isPressed
        self.isSelected = isSelected
    }

    var body: some View {
        let p = mortar.palette
        let shape = RoundedRectangle(cornerRadius: MortarTokens.radius)
        label
            .font(mortar.font(mortar.theme.density.fontSize, isSelected ? .semibold : .regular))
            .foregroundStyle(isSelected ? p[\.link] : isPressed ? p[\.ink] : p[\.secondary])
            .frame(maxWidth: .infinity, minHeight: MortarTokens.touchTarget - 8, alignment: .leading)
            .contentShape(Rectangle())
            .overlay {
                if isFocused {
                    shape
                        .strokeBorder(p[\.focus], lineWidth: 2)
                        .padding(.horizontal, -8)
                }
            }
    }
}
