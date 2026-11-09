import SwiftUI

/// A top-level destination in a ``MortarAppShell``.
public struct MortarNavigationItem<Value: Hashable>: Identifiable {
    public var value: Value
    public var label: LocalizedStringKey
    public var systemImage: String
    public var id: Value { value }

    public init(_ label: LocalizedStringKey, systemImage: String, value: Value) {
        self.label = label
        self.systemImage = systemImage
        self.value = value
    }
}

/// An app's top-level navigation, as the web AppShell: a sidebar where
/// there is room (iPad, Mac, iPhone in landscape on large models) and a tab
/// bar on iPhone. Each destination gets its own navigation stack.
public struct MortarAppShell<Value: Hashable, Content: View>: View {
    private let brand: Text
    private let items: [MortarNavigationItem<Value>]
    @Binding private var selection: Value
    private let content: (Value) -> Content
    private var mortar = MortarContext()
    #if os(iOS)
    @Environment(\.horizontalSizeClass) private var sizeClass
    #endif

    /// - Parameter content: The screen for a destination.
    public init(
        _ brand: LocalizedStringKey,
        selection: Binding<Value>,
        items: [MortarNavigationItem<Value>],
        @ViewBuilder content: @escaping (Value) -> Content
    ) {
        self.brand = Text(brand)
        self._selection = selection
        self.items = items
        self.content = content
    }

    private var isCompact: Bool {
        #if os(iOS)
        sizeClass == .compact
        #else
        false
        #endif
    }

    public var body: some View {
        let p = mortar.palette
        Group {
            if isCompact {
                TabView(selection: $selection) {
                    ForEach(items) { item in
                        NavigationStack { screen(item.value) }
                            .tabItem { Label(item.label, systemImage: item.systemImage) }
                            .tag(item.value)
                    }
                }
            } else {
                NavigationSplitView {
                    List {
                        ForEach(items) { item in
                            let isSelected = item.value == selection
                            Button { selection = item.value } label: {
                                Label(item.label, systemImage: item.systemImage)
                                    .font(mortar.font(mortar.theme.density.fontSize, isSelected ? .semibold : .regular))
                                    .foregroundStyle(isSelected ? p[\.ink] : p[\.secondary])
                                    .frame(maxWidth: .infinity, minHeight: MortarTokens.touchTarget - 8, alignment: .leading)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .listRowBackground(
                                RoundedRectangle(cornerRadius: MortarTokens.radius)
                                    .fill(isSelected ? p[\.selected] : .clear)
                                    .padding(.horizontal, 8)
                            )
                            .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
                        }
                    }
                    .scrollContentBackground(.hidden)
                    .background(p[\.sunken])
                    .navigationTitle(brand)
                } detail: {
                    NavigationStack { screen(selection) }
                }
            }
        }
        .tint(p[\.primary])
    }

    private func screen(_ value: Value) -> some View {
        content(value)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(mortar.palette[\.paper])
    }
}
