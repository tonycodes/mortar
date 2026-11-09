import Foundation

// TEMPORARY, removed before merge. Prints reference images recorded during a
// run, and failed comparisons, to the test log as base64, so they can be
// reviewed and committed where the CI artifact can't be downloaded.
enum SnapshotLog {
    nonisolated(unsafe) private static var before: Set<String> = []

    private static var directory: URL {
        URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("__Snapshots__")
    }

    private static func pngs(in directory: URL) -> [String] {
        guard let walker = FileManager.default.enumerator(atPath: directory.path) else { return [] }
        return walker.compactMap { $0 as? String }.filter { $0.hasSuffix(".png") }
            .map { directory.appendingPathComponent($0).path }
    }

    static func start() {
        before = Set(pngs(in: directory))
    }

    static func finish() {
        var files = pngs(in: directory).filter { !before.contains($0) }
        if let failures = ProcessInfo.processInfo.environment["SNAPSHOT_ARTIFACTS"] {
            files += pngs(in: URL(fileURLWithPath: failures))
        }
        for file in files.sorted() {
            guard let data = FileManager.default.contents(atPath: file) else { continue }
            let encoded = data.base64EncodedString(options: [.lineLength76Characters, .endLineWithLineFeed])
            print("SNAPSHOT-BEGIN \(file)\n\(encoded)\nSNAPSHOT-END \(file)")
        }
    }
}
