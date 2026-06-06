import Foundation

// Fetches aircraft photos from Planespotters.net (free, public API)
// API: https://api.planespotters.net/pub/photos/hex/{icao24}

struct AircraftPhoto: Equatable {
    let thumbnailURL: URL
    let largeURL: URL?
    let photographer: String
    let aircraftModel: String?
    let linkURL: URL?
}

actor PhotoCache {
    static let shared = PhotoCache()
    private var cache: [String: AircraftPhoto?] = [:]    // nil = known miss
    private var inFlight: [String: Task<AircraftPhoto?, Never>] = [:]

    func get(_ key: String)    -> AircraftPhoto?? { cache[key] }       // .some(nil) = miss cached
    func set(_ key: String, _ value: AircraftPhoto?) { cache[key] = value }
    func task(for key: String) -> Task<AircraftPhoto?, Never>? { inFlight[key] }
    func setTask(_ t: Task<AircraftPhoto?, Never>, for key: String) { inFlight[key] = t }
    func clearTask(for key: String) { inFlight[key] = nil }
}

final class PhotoService {
    static let shared = PhotoService()

    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 10
        cfg.httpAdditionalHeaders = [
            "User-Agent": "SkyRadar/1.0 (iOS; contact@skyradar.app)"
        ]
        return URLSession(configuration: cfg)
    }()

    private init() {}

    func photo(for icao24: String) async -> AircraftPhoto? {
        let key = icao24.lowercased()

        // Return cached result (including cached miss)
        if let cached = await PhotoCache.shared.get(key) {
            return cached
        }

        // De-duplicate concurrent requests for the same ICAO
        if let existing = await PhotoCache.shared.task(for: key) {
            return await existing.value
        }

        let task = Task<AircraftPhoto?, Never> {
            let result = await fetch(icao24: key)
            await PhotoCache.shared.set(key, result)
            await PhotoCache.shared.clearTask(for: key)
            return result
        }

        await PhotoCache.shared.setTask(task, for: key)
        return await task.value
    }

    private func fetch(icao24: String) async -> AircraftPhoto? {
        guard let url = URL(string: "https://api.planespotters.net/pub/photos/hex/\(icao24)") else {
            return nil
        }

        do {
            let (data, response) = try await session.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }

            let decoded = try JSONDecoder().decode(PlanespottersResponse.self, from: data)
            guard let first = decoded.photos.first else { return nil }

            guard let thumbURL = URL(string: first.thumbnail.src) else { return nil }

            return AircraftPhoto(
                thumbnailURL: thumbURL,
                largeURL: first.thumbnailLarge.flatMap { URL(string: $0.src) },
                photographer: first.photographer,
                aircraftModel: first.aircraft?.model,
                linkURL: first.link.flatMap { URL(string: $0) }
            )
        } catch {
            return nil
        }
    }
}

// MARK: - Codable response

private struct PlanespottersResponse: Codable {
    let photos: [PSPhoto]
}

private struct PSPhoto: Codable {
    let id: String
    let thumbnail: PSThumbnail
    let thumbnailLarge: PSThumbnail?
    let link: String?
    let photographer: String
    let aircraft: PSAircraft?

    enum CodingKeys: String, CodingKey {
        case id, thumbnail, link, photographer, aircraft
        case thumbnailLarge = "thumbnail_large"
    }
}

private struct PSThumbnail: Codable {
    let src: String
}

private struct PSAircraft: Codable {
    let model: String?
}
