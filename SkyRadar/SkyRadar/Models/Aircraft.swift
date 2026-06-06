import Foundation
import CoreLocation

struct Aircraft: Identifiable, Equatable {
    let id: String
    let callsign: String
    let originCountry: String
    let latitude: Double?
    let longitude: Double?
    let baroAltitude: Double?
    let onGround: Bool
    let velocity: Double?
    let heading: Double?
    let verticalRate: Double?
    let geoAltitude: Double?
    let squawk: String?
    let lastContact: Date

    var coordinate: CLLocationCoordinate2D? {
        guard let lat = latitude, let lon = longitude,
              !lat.isNaN, !lon.isNaN else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }

    var altitudeFeet: Int? {
        guard let alt = baroAltitude ?? geoAltitude, alt > 0 else { return nil }
        return Int(alt * 3.28084)
    }

    var speedKnots: Int? {
        guard let v = velocity, v > 0 else { return nil }
        return Int(v * 1.94384)
    }

    var verticalRateFpm: Int? {
        guard let vr = verticalRate else { return nil }
        return Int(vr * 196.85)
    }

    var climbStatus: ClimbStatus {
        guard let vr = verticalRate else { return .level }
        if vr > 1.0 { return .climbing }
        if vr < -1.0 { return .descending }
        return .level
    }

    var flightLevel: String {
        guard let alt = altitudeFeet else { return "—" }
        return "FL\(alt / 100)"
    }

    var displayCallsign: String {
        let trimmed = callsign.trimmingCharacters(in: .whitespaces)
        return trimmed.isEmpty ? id.uppercased() : trimmed
    }

    var altitudeCategory: AltitudeCategory {
        guard let alt = altitudeFeet else { return .unknown }
        switch alt {
        case 0..<1000: return .ground
        case 1000..<10000: return .low
        case 10000..<25000: return .medium
        default: return .high
        }
    }

    static func == (lhs: Aircraft, rhs: Aircraft) -> Bool {
        lhs.id == rhs.id
    }
}

enum ClimbStatus {
    case climbing, descending, level

    var symbol: String {
        switch self {
        case .climbing: return "arrow.up.right"
        case .descending: return "arrow.down.right"
        case .level: return "arrow.right"
        }
    }

    var label: String {
        switch self {
        case .climbing: return "Climbing"
        case .descending: return "Descending"
        case .level: return "Level"
        }
    }
}

enum AltitudeCategory {
    case ground, low, medium, high, unknown

    var colorName: String {
        switch self {
        case .ground: return "skyGray"
        case .low: return "skyOrange"
        case .medium: return "skyYellow"
        case .high: return "skyAccent"
        case .unknown: return "skyAccent"
        }
    }
}
