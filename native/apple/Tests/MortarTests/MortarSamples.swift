import SwiftUI
@testable import Mortar

// Screens shared by the iOS snapshot tests and the Mac tests.

/// Groups, counts, a long name, no brand and an account footer.
struct AppShellSectionsSample: View {
    /// A destination name too long for one line in the sidebar.
    var longName = true
    @State private var selection = "inbox"

    var body: some View {
        MortarAppShell(selection: $selection, items: [
            MortarNavigationItem("Inbox", systemImage: "tray", value: "inbox", count: 12),
            MortarNavigationItem("Drafts", systemImage: "doc", value: "drafts", count: 0),
            MortarNavigationItem("Sent", systemImage: "paperplane", value: "sent"),
        ], sections: [
            MortarNavigationGroup("Projects", items: [
                MortarNavigationItem(longName ? "Quarterly planning and roadmap review" : "Planning",
                                     systemImage: "folder",
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

/// The composer's states, each a row as an app would show it.
struct ComposerStatesSample: View {
    var body: some View {
        VStack(spacing: 20) {
            MortarCommentComposer(text: .constant(""), placeholder: "Ask anything", onAttach: {}) { _ in }
            MortarCommentComposer(text: .constant("Can you summarise the thread from Monday?"),
                                  maxLength: 60, showsCount: true, onAttach: {}) { _ in }
            MortarCommentComposer(
                text: .constant("A long message that wraps onto several lines, because people paste "
                    + "whole paragraphs into composers and the field should grow with them up to six lines "
                    + "before it scrolls."),
                onAttach: {}
            ) { _ in }
            MortarCommentComposer(text: .constant("Draft a reply"), isStreaming: true, onStop: {}) { _ in }
            MortarCommentComposer(text: .constant(""), hint: "Command-Return to send.",
                                  error: "Couldn't reach the server. Try again.") { _ in }
            MortarCommentComposer(text: .constant("Offline"), onAttach: {}) { _ in }
                .disabled(true)
        }
    }
}

/// A conversation with Markdown, choices, a failed message and a reply
/// arriving, and a composer.
struct ConversationSample: View {
    var isEmpty = false

    var messages: [MortarChatMessage] {
        if isEmpty { return [] }
        return [
            MortarChatMessage(id: "1", role: .user, text: "What changed in the billing export?"),
            MortarChatMessage(
                id: "2", role: .assistant,
                text: "Two things: invoices now include **tax lines**, and the file is named "
                    + "`billing-2026-11.csv`. See [the release notes](https://example.com) for the rest."
            ),
            MortarChatMessage(
                id: "3", role: .assistant, text: "Do you want me to update the finance team's import?",
                choices: [
                    MortarChatChoice("Yes, update it") {},
                    MortarChatChoice("Not now") {},
                    MortarChatChoice("Show me the diff first") {},
                ]
            ),
            MortarChatMessage(id: "4", role: .user, text: "Show me the diff first",
                              status: .failed("Not sent. Check your connection.", retry: {})),
            MortarChatMessage(id: "5", role: .user, text: "Show me the diff first"),
            MortarChatMessage(id: "6", role: .assistant, text: "Comparing the October and November exports",
                              status: .streaming),
        ]
    }

    var body: some View {
        MortarConversation(messages: messages) {
            MortarCommentComposer(text: .constant(""), placeholder: "Reply", isStreaming: !isEmpty,
                                  onAttach: {}, onStop: {}) { _ in }
        } empty: {
            MortarEmptyState("Ask about your account", description: "Answers cite the pages they come from.",
                             systemImage: "bubble.left.and.bubble.right")
        }
    }
}
