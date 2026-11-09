import SwiftUI

/// A settings or editor page: sections in a scrolling column of readable
/// width on the screen's paper, never the system's grouped grey, with the
/// page's actions pinned at the bottom.
///
/// Use it instead of `Form` or `List` for settings and editors, in a
/// navigation destination or a sheet, on iPhone, iPad and Mac alike. On a
/// Mac it asks for a sheet-sized window when it is the root of a sheet.
public struct MortarForm<Content: View, Actions: View>: View {
    private let title: Text?
    private let description: Text?
    private let measure: Double
    private let content: Content
    private let actions: Actions
    private var mortar = MortarContext()

    /// - Parameters:
    ///   - title: A heading above the sections, for a sheet or a page
    ///     without a navigation title.
    ///   - measure: The column's widest, in points.
    ///   - actions: Pinned under the column, trailing, such as Cancel and
    ///     Save. Give the primary action `isLoading` while it saves.
    public init(
        _ title: LocalizedStringKey? = nil,
        description: LocalizedStringKey? = nil,
        measure: Double = 760,
        @ViewBuilder content: () -> Content,
        @ViewBuilder actions: () -> Actions
    ) {
        self.title = title.map { Text($0) }
        self.description = description.map { Text($0) }
        self.measure = measure
        self.content = content()
        self.actions = actions()
    }

    public var body: some View {
        let p = mortar.palette
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if title != nil || description != nil {
                    VStack(alignment: .leading, spacing: 6) {
                        if let title {
                            title
                                .font(mortar.font(22, .semibold, heading: true))
                                .foregroundStyle(p[\.ink])
                                .accessibilityAddTraits(.isHeader)
                        }
                        if let description {
                            description
                                .font(mortar.font(14))
                                .foregroundStyle(p[\.muted])
                        }
                    }
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 8)
                }
                content
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .frame(maxWidth: measure, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(p[\.paper])
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if Actions.self != EmptyView.self {
                VStack(spacing: 0) {
                    Rectangle().fill(p[\.line]).frame(height: 1)
                    // Side by side, trailing; stacked full width when they
                    // don't fit, as at the largest text sizes.
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 12) {
                            Spacer(minLength: 0)
                            actions
                        }
                        VStack(alignment: .trailing, spacing: 8) {
                            actions
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .frame(maxWidth: measure)
                    .frame(maxWidth: .infinity)
                }
                .background(p[\.paper])
            }
        }
        #if os(macOS)
        .frame(minWidth: 420, idealWidth: min(measure, 640), minHeight: 320, idealHeight: 520)
        #endif
    }
}

extension MortarForm where Actions == EmptyView {
    public init(
        _ title: LocalizedStringKey? = nil,
        description: LocalizedStringKey? = nil,
        measure: Double = 760,
        @ViewBuilder content: () -> Content
    ) {
        self.init(title, description: description, measure: measure, content: content) { EmptyView() }
    }
}

/// A group of settings, as the web SettingsSection: its title and
/// description beside its fields where there is room (a third and two
/// thirds), above them where there isn't, and a rule underneath.
public struct MortarFormSection<Content: View>: View {
    private let title: Text
    private let description: Text?
    private let content: Content
    private var mortar = MortarContext()

    public init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = Text(title)
        self.description = description.map { Text($0) }
        self.content = content()
    }

    public var body: some View {
        let p = mortar.palette
        VStack(spacing: 0) {
            SectionColumns {
                VStack(alignment: .leading, spacing: 6) {
                    title
                        .font(mortar.font(16, .semibold, heading: true))
                        .foregroundStyle(p[\.ink])
                        .accessibilityAddTraits(.isHeader)
                    if let description {
                        description
                            .font(mortar.font(13))
                            .foregroundStyle(p[\.muted])
                    }
                }
                .fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: 20) {
                    content
                }
            }
            .padding(.vertical, 28)
            Rectangle().fill(p[\.line]).frame(height: 1)
        }
        .accessibilityElement(children: .contain)
    }
}

/// Two columns, one third and two thirds with a 40-point gap, from 560
/// points wide; stacked with a 20-point gap below that. Its width comes only
/// from the proposal, never from its children, so it can't feed back into
/// itself while a window resizes.
private struct SectionColumns: Layout {
    static let breakpoint: CGFloat = 560

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard subviews.count == 2 else { return .zero }
        let width: CGFloat = proposal.width ?? Self.breakpoint
        if width >= Self.breakpoint {
            let (lead, trail) = columns(width)
            let a = subviews[0].sizeThatFits(ProposedViewSize(width: lead, height: nil))
            let b = subviews[1].sizeThatFits(ProposedViewSize(width: trail, height: nil))
            return CGSize(width: width, height: max(a.height, b.height))
        }
        let a = subviews[0].sizeThatFits(ProposedViewSize(width: width, height: nil))
        let b = subviews[1].sizeThatFits(ProposedViewSize(width: width, height: nil))
        return CGSize(width: width, height: a.height + 20 + b.height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 2 else { return }
        let width = bounds.width
        if width >= Self.breakpoint {
            let (lead, trail) = columns(width)
            subviews[0].place(at: bounds.origin, proposal: ProposedViewSize(width: lead, height: nil))
            subviews[1].place(at: CGPoint(x: bounds.minX + lead + 40, y: bounds.minY),
                              proposal: ProposedViewSize(width: trail, height: nil))
        } else {
            let a = subviews[0].sizeThatFits(ProposedViewSize(width: width, height: nil))
            subviews[0].place(at: bounds.origin, proposal: ProposedViewSize(width: width, height: nil))
            subviews[1].place(at: CGPoint(x: bounds.minX, y: bounds.minY + a.height + 20),
                              proposal: ProposedViewSize(width: width, height: nil))
        }
    }

    private func columns(_ width: CGFloat) -> (CGFloat, CGFloat) {
        let available = width - 40
        return (available / 3, available * 2 / 3)
    }
}

/// A label, hint and error around any control, such as a `DatePicker`,
/// `Stepper` or a control of the app's own, as Mortar's fields lay them out.
/// VoiceOver reads the label as the control's name, then "required", the
/// error and the hint.
public struct MortarField<Control: View>: View {
    private let label: Text
    private let hint: Text?
    private let error: Text?
    private let isRequired: Bool
    private let control: Control
    private var mortar = MortarContext()

    public init(
        _ label: LocalizedStringKey,
        hint: LocalizedStringKey? = nil,
        error: LocalizedStringKey? = nil,
        isRequired: Bool = false,
        @ViewBuilder control: () -> Control
    ) {
        self.label = Text(label)
        self.hint = hint.map { Text($0) }
        self.error = error.map { Text($0) }
        self.isRequired = isRequired
        self.control = control()
    }

    public var body: some View {
        FieldChrome(label: label, hint: hint, error: error, isRequired: isRequired) {
            control
                .tint(mortar.palette[\.primary])
                .accessibilityLabel(label)
                .accessibilityHint(FieldChrome<EmptyView>.hint(isRequired: isRequired, error: error, hint: hint))
        }
    }
}

/// The label, required marker, hint and error Mortar's fields share. The
/// texts are hidden from VoiceOver: the control carries them as its name
/// and hint.
struct FieldChrome<Control: View>: View {
    let label: Text
    let hint: Text?
    let error: Text?
    let isRequired: Bool
    let control: Control
    private var mortar = MortarContext()

    init(label: Text, hint: Text?, error: Text?, isRequired: Bool, @ViewBuilder control: () -> Control) {
        self.label = label
        self.hint = hint
        self.error = error
        self.isRequired = isRequired
        self.control = control()
    }

    var body: some View {
        let p = mortar.palette
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 2) {
                label
                if isRequired {
                    Text(verbatim: "*")
                        .foregroundStyle(p[\.danger])
                }
            }
            .font(mortar.font(13, .semibold))
            .foregroundStyle(p[\.ink])
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityHidden(true)

            control

            if let error {
                Label { error } icon: { Image(systemName: "exclamationmark.circle") }
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.danger])
                    .tint(p[\.danger])
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityHidden(true)
            }
            if let hint {
                hint
                    .font(mortar.font(12))
                    .foregroundStyle(p[\.muted])
                    .tint(p[\.muted])
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityHidden(true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// "Required", the error and the hint, for VoiceOver.
    static func hint(isRequired: Bool, error: Text?, hint: Text?) -> Text {
        let parts = [isRequired ? Text("Required") : nil, error, hint].compactMap { $0 }
        guard var joined = parts.first else { return Text(verbatim: "") }
        for part in parts.dropFirst() { joined = joined + Text(verbatim: ". ") + part }
        return joined
    }
}
