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
                    Text(verbatim: "Ada Lovelace").lineLimit(1)
                    Text(verbatim: "ada@example.com").foregroundStyle(.secondary).font(.footnote)
                        .lineLimit(1).truncationMode(.middle)
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

/// A settings page with every field type, long hint and error text, a
/// secure field, and actions with Save loading.
struct SettingsFormSample: View {
    var title: LocalizedStringKey? = "Account"
    var isSaving = true

    var body: some View {
        MortarForm(title, description: "Changes apply to every workspace you belong to.") {
            MortarFormSection("Profile", description: "Shown to people you work with.") {
                MortarTextField("Display name", text: .constant("Ada Lovelace"))
                MortarTextField("Email", text: .constant("ada@"), isRequired: true)
                MortarTextField("Work email", text: .constant("ada@analytical"),
                                hint: "We send sign-in links and security alerts here, so use an address you check often. It isn't shown to anyone outside your workspaces.",
                                error: "Enter an email address with a domain, such as ada@example.com, so we can send your sign-in links.",
                                isRequired: true)
                MortarTextEditor("Bio", text: .constant("Mathematician. Writes the notes on the engine."),
                                 hint: "A sentence or two.")
                MortarPicker("Time zone", selection: .constant("london"), options: [
                    MortarPickerOption("London", value: "london"),
                    MortarPickerOption("New York", value: "new-york"),
                    MortarPickerOption("Tokyo", value: "tokyo"),
                ], hint: "Used for reminders and digests.")
            }
            MortarFormSection("Security") {
                MortarTextField("Current password", text: .constant("hunter22"), isSecure: true)
                MortarTextField("New password", text: .constant(""), hint: "At least 12 characters.",
                                isRequired: true, isSecure: true)
                MortarPicker("Sign-in method", selection: .constant(""), options: [
                    MortarPickerOption("Passkey", value: "passkey"),
                    MortarPickerOption("Password and code", value: "password"),
                ], placeholder: "Choose…", error: "Choose how you sign in.", isRequired: true)
            }
            MortarFormSection("Notifications") {
                MortarField("Quiet hours start", hint: "No notifications after this time.") {
                    DatePicker("", selection: .constant(Date(timeIntervalSince1970: 79_200)),
                               displayedComponents: .hourAndMinute)
                        .labelsHidden()
                }
                MortarSwitch("Daily digest", isOn: .constant(true))
                MortarTextField("Webhook", text: .constant("https://example.com/hooks/ada"))
                    .disabled(true)
            }
        } actions: {
            MortarButton("Cancel", variant: .ghost) {}
            MortarButton("Save changes", variant: .primary, isLoading: isSaving) {}
        }
        .environment(\.timeZone, TimeZone(identifier: "UTC")!)
        .environment(\.locale, Locale(identifier: "en_GB"))
    }
}

/// The integration that hit an AppKit layout loop on macOS 26.2: a split
/// view whose detail is a scrolling connector form with a text field and a
/// secure field, opened and closed repeatedly, and the same form in a
/// fixed-size sheet.
@MainActor
@Observable
final class ConnectorModel {
    var showsForm = false
    var showsSheet = false
    var host = "imap.example.com"
    var password = ""
}

struct ConnectorSplitSample: View {
    @Bindable var model: ConnectorModel

    var body: some View {
        NavigationSplitView {
            List {
                Text(verbatim: "Mail")
                Text(verbatim: "Calendar")
            }
        } detail: {
            if model.showsForm {
                ConnectorForm(model: model)
            } else {
                MortarEmptyState("Choose a connector", systemImage: "puzzlepiece.extension")
            }
        }
        .sheet(isPresented: $model.showsSheet) {
            ConnectorForm(model: model)
                .frame(width: 680, height: 650)
        }
    }
}

struct ConnectorForm: View {
    @Bindable var model: ConnectorModel

    var body: some View {
        MortarForm("Connect mail", description: "Mortar never stores this password in plain text.") {
            MortarFormSection("Server") {
                MortarTextField("IMAP host", text: $model.host, prompt: "imap.example.com",
                                hint: "Ask your mail provider if you don't know it. It's often imap. followed by your email domain.", isRequired: true)
                MortarTextField("Password", text: $model.password,
                                error: model.password.isEmpty ? "Enter the app password from your provider." : nil,
                                isRequired: true, isSecure: true)
            }
        } actions: {
            MortarButton("Cancel", variant: .ghost) { model.showsForm = false; model.showsSheet = false }
            MortarButton("Connect", variant: .primary) {}
        }
    }
}
