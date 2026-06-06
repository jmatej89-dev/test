import Foundation
import CoreLocation

final class OpenSkyService {
    static let shared = OpenSkyService()

    private let baseURL = "https://opensky-network.org/api"
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 20
        config.timeoutIntervalForResource = 40
        config.httpAdditionalHeaders = ["Accept": "application/json"]
        self.session = URLSession(configuration: config)
    }

    func fetchAircraft(in region: BoundingBox? = nil) async throws -> [Aircraft] {
        var components = URLComponents(string: "\(baseURL)/states/all")!

        if let box = region {
            components.queryItems = [
                URLQueryItem(name: "lamin", value: String(format: "%.4f", box.minLat)),
                URLQueryItem(name: "lomin", value: String(format: "%.4f", box.minLon)),
                URLQueryItem(name: "lamax", value: String(format: "%.4f", box.maxLat)),
                URLQueryItem(name: "lomax", value: String(format: "%.4f", box.maxLon))
            ]
        }

        guard let url = components.url else { throw FlightError.invalidURL }

        let (data, response) = try await session.data(from: url)

        guard let http = response as? HTTPURLResponse else {
            throw FlightError.networkError("Invalid response")
        }

        switch http.statusCode {
        case 200: break
        case 429: throw FlightError.rateLimited
        case 401, 403: throw FlightError.unauthorized
        default: throw FlightError.networkError("HTTP \(http.statusCode)")
        }

        let decoded = try JSONDecoder().decode(OpenSkyResponse.self, from: data)

        return (decoded.states ?? [])
            .compactMap { Aircraft(fromState: $0) }
            .filter { $0.latitude != nil && $0.longitude != nil }
    }
}

struct BoundingBox {
    let minLat, maxLat, minLon, maxLon: Double

    init(center: CLLocationCoordinate2D, latSpan: Double = 12, lonSpan: Double = 15) {
        minLat = max(-90, center.latitude - latSpan)
        maxLat = min(90, center.latitude + latSpan)
        minLon = max(-180, center.longitude - lonSpan)
        maxLon = min(180, center.longitude + lonSpan)
    }
}

enum FlightError: LocalizedError {
    case invalidURL
    case networkError(String)
    case rateLimited
    case unauthorized
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .networkError(let m): return "Network error: \(m)"
        case .rateLimited: return "Rate limited — please wait a moment"
        case .unauthorized: return "Authentication required"
        case .decodingError: return "Failed to decode flight data"
        }
    }
}
