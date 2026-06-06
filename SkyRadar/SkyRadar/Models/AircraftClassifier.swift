import Foundation

// MARK: - Aircraft class

enum AircraftClass: Equatable {
    case civilian
    case military(MilitaryInfo)

    var isMilitary: Bool {
        if case .military = self { return true }
        return false
    }

    var militaryInfo: MilitaryInfo? {
        if case .military(let info) = self { return info }
        return nil
    }
}

struct MilitaryInfo: Equatable {
    let country: String
    let branch: String
    let flag: String
}

// MARK: - Classifier

enum AircraftClassifier {

    static func classify(icao24: String, callsign: String) -> AircraftClass {
        if let info = militaryInfo(icao24: icao24, callsign: callsign) {
            return .military(info)
        }
        return .civilian
    }

    // MARK: Military ICAO24 hex ranges
    // Sources: ICAO Annex 10 / public aviation databases
    private static let icaoRanges: [(lo: UInt32, hi: UInt32, country: String, branch: String, flag: String)] = [
        // United States
        (0xAE0000, 0xAFFFFF, "United States",   "USAF / USN / USMC",    "🇺🇸"),
        // United Kingdom
        (0x43C000, 0x43CFFF, "United Kingdom",  "Royal Air Force",       "🇬🇧"),
        (0x43F000, 0x43FFFF, "United Kingdom",  "UK Military",           "🇬🇧"),
        // France
        (0x302000, 0x307FFF, "France",          "Armée de l'Air",        "🇫🇷"),
        (0x38A000, 0x38AFFF, "France",          "Marine Nationale",      "🇫🇷"),
        // Germany
        (0x3E0000, 0x3EFFFF, "Germany",         "Luftwaffe",             "🇩🇪"),
        // Italy
        (0x300200, 0x3002FF, "Italy",           "Aeronautica Militare",  "🇮🇹"),
        // Spain
        (0x340000, 0x37FFFF, "Spain",           "Ejército del Aire",     "🇪🇸"),
        // Netherlands
        (0x480000, 0x487FFF, "Netherlands",     "Koninklijke Luchtmacht","🇳🇱"),
        // Belgium
        (0x448000, 0x44FFFF, "Belgium",         "Composante air",        "🇧🇪"),
        // Norway
        (0x47C000, 0x47FFFF, "Norway",          "Luftforsvaret",         "🇳🇴"),
        // Sweden
        (0x4A0000, 0x4AFFFF, "Sweden",          "Flygvapnet",            "🇸🇪"),
        // Switzerland
        (0x4B3000, 0x4B3FFF, "Switzerland",     "Schweizer Luftwaffe",   "🇨🇭"),
        // NATO / multi-national
        (0x44F000, 0x44FFFF, "NATO",            "NATO AEW&C",            "🌐"),
        (0x45F000, 0x45FFFF, "NATO",            "NATO",                  "🌐"),
        // Russia (those that broadcast)
        (0x100000, 0x1FFFFF, "Russia",          "VKS / AV-MF",           "🇷🇺"),
        // China (selective)
        (0x780000, 0x7BFFFF, "China",           "PLAAF",                 "🇨🇳"),
        // Israel
        (0x738000, 0x73FFFF, "Israel",          "Heyl Ha'Avir",          "🇮🇱"),
        // Turkey
        (0x4B9000, 0x4B9FFF, "Turkey",          "Türk Hava Kuvvetleri",  "🇹🇷"),
        // Canada
        (0xC00000, 0xC3FFFF, "Canada",          "RCAF",                  "🇨🇦"),
        // Australia
        (0x7C0000, 0x7C3FFF, "Australia",       "RAAF",                  "🇦🇺"),
        // Japan (Air Self-Defense Force)
        (0x840000, 0x87FFFF, "Japan",           "Kōkū Jieitai",          "🇯🇵"),
    ]

    // MARK: Military callsign prefixes
    private static let militaryPrefixes: [(prefix: String, country: String, branch: String, flag: String)] = [
        ("REACH",   "United States", "Air Mobility Command",   "🇺🇸"),
        ("SPAR",    "United States", "USAF VIP Transport",     "🇺🇸"),
        ("SAM",     "United States", "Special Air Mission",    "🇺🇸"),
        ("USAF",    "United States", "US Air Force",           "🇺🇸"),
        ("NAVY",    "United States", "US Navy",                "🇺🇸"),
        ("DUKE",    "United States", "US Air Force",           "🇺🇸"),
        ("JAKE",    "United States", "US Air Force",           "🇺🇸"),
        ("HAVOC",   "United States", "US Air Force",           "🇺🇸"),
        ("BISON",   "United States", "US Air Force",           "🇺🇸"),
        ("VIPER",   "United States", "US Air Force",           "🇺🇸"),
        ("EAGLE",   "United States", "US Air Force",           "🇺🇸"),
        ("HAWK",    "United States", "US Air Force",           "🇺🇸"),
        ("RAPTOR",  "United States", "US Air Force",           "🇺🇸"),
        ("TALON",   "United States", "US Air Force",           "🇺🇸"),
        ("GHOST",   "United States", "US Air Force",           "🇺🇸"),
        ("IRON",    "United States", "US Air Force",           "🇺🇸"),
        ("GAF",     "Germany",       "Luftwaffe",              "🇩🇪"),
        ("RRR",     "United Kingdom","Royal Air Force",        "🇬🇧"),
        ("RFF",     "United Kingdom","Royal Air Force",        "🇬🇧"),
        ("NATO",    "NATO",          "NATO",                   "🌐"),
        ("NATOAW",  "NATO",          "NATO AWACS",             "🌐"),
        ("FAF",     "France",        "Armée de l'Air",         "🇫🇷"),
        ("COTAM",   "France",        "Armée de l'Air",         "🇫🇷"),
        ("SWEDISH", "Sweden",        "Flygvapnet",             "🇸🇪"),
        ("FALCON",  "United States", "US Air Force",           "🇺🇸"),
        ("RAVEN",   "United States", "US Air Force",           "🇺🇸"),
        ("FURY",    "United States", "US Air Force",           "🇺🇸"),
        ("BLADE",   "United States", "US Air Force",           "🇺🇸"),
    ]

    // MARK: Lookup
    private static func militaryInfo(icao24: String, callsign: String) -> MilitaryInfo? {
        // ICAO hex range check
        if let hex = UInt32(icao24.lowercased(), radix: 16) {
            for r in icaoRanges where hex >= r.lo && hex <= r.hi {
                return MilitaryInfo(country: r.country, branch: r.branch, flag: r.flag)
            }
        }

        // Callsign prefix check
        let cs = callsign.trimmingCharacters(in: .whitespaces).uppercased()
        for entry in militaryPrefixes where cs.hasPrefix(entry.prefix) {
            return MilitaryInfo(country: entry.country, branch: entry.branch, flag: entry.flag)
        }

        return nil
    }
}
