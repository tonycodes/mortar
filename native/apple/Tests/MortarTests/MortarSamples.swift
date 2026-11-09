import SwiftUI
@testable import Mortar

// Screens shared by the iOS snapshot tests and the Mac tests.

/// Groups, counts, a long name, no brand and an account footer.
struct AppShellSectionsSample: View {
    @State private var selection = "inbox"

    var body: some View {
        MortarAppShell(selection: $selection, items: [
            MortarNavigationItem("Inbox", systemImage: "tray", value: "inbox", count: 12),
            MortarNavigationItem("Drafts", systemImage: "doc", value: "drafts", count: 0),
            MortarNavigationItem("Sent", systemImage: "paperplane", value: "sent"),
        ], sections: [
            MortarNavigationGroup("Projects", items: [
                MortarNavigationItem("Quarterly planning and roadmap review", systemImage: "folder",
                                     value: "planning", count: 3),
                MortarNavigationItem("Design", systemImage: "folder", value: "design"),
            ]),
        ]) { value in
            MortarEmptyState("Nothing here", description: "Messages appear here.", systemImage: "tray")
                .navigationTitle(value.capitalized)
        } footer: {
            AccountFooterSample()
        }
    }
}

/// What an app puts in the sidebar footer: its own account menu.
struct AccountFooterSample: View {
    var body: some View {
        Menu {
            Button("Settings", systemImage: "gearshape") {}
            Button("Sign out", systemImage: "rectangle.portrait.and.arrow.right") {}
        } label: {
            HStack(spacing: 10) {
                MortarAvatar(name: "Ada Lovelace", size: .sm)
                VStack(alignment: .leading, spacing: 0) {
                    Text(verbatim: "Ada Lovelace")
                    Text(verbatim: "ada@example.com").foregroundStyle(.secondary).font(.footnote)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.up.chevron.down").foregroundStyle(.secondary)
            }
            .contentShape(Rectangle())
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .accessibilityLabel(Text(verbatim: "Account, Ada Lovelace"))
    }
}
