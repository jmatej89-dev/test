import Foundation

struct OpenSkyResponse: Codable {
    let time: Int
    let states: [[StateValue]]?
}

enum StateValue: Codable {
    case string(String)
    case double(Double)
    case int(Int)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() {
            self = .null
        } else if let v = try? c.decode(Bool.self) {
            self = .bool(v)
        } else if let v = try? c.decode(Int.self) {
            self = .int(v)
        } else if let v = try? c.decode(Double.self) {
            self = .double(v)
        } else if let v = try? c.decode(String.self) {
            self = .string(v)
        } else {
            self = .null
        }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let v): try c.encode(v)
        case .double(let v): try c.encode(v)
        case .int(let v): try c.encode(v)
        case .bool(let v): try c.encode(v)
        case .null: try c.encodeNil()
        }
    }

    var stringValue: String? {
        if case .string(let v) = self { return v }
        return nil
    }

    var doubleValue: Double? {
        if case .double(let v) = self { return v }
        if case .int(let v) = self { return Double(v) }
        return nil
    }

    var boolValue: Bool? {
        if case .bool(let v) = self { return v }
        return nil
    }
}

extension Aircraft {
    init?(fromState state: [StateValue]) {
        guard state.count >= 17,
              let icao = state[0].stringValue else { return nil }

        self.id = icao
        self.callsign = state[1].stringValue ?? ""
        self.originCountry = state[2].stringValue ?? "Unknown"
        self.longitude = state[5].doubleValue
        self.latitude = state[6].doubleValue
        self.baroAltitude = state[7].doubleValue
        self.onGround = state[8].boolValue ?? false
        self.velocity = state[9].doubleValue
        self.heading = state[10].doubleValue
        self.verticalRate = state[11].doubleValue
        self.geoAltitude = state[13].doubleValue
        self.squawk = state[14].stringValue
        let ts = state[4].doubleValue ?? 0
        self.lastContact = Date(timeIntervalSince1970: ts)
    }
}
