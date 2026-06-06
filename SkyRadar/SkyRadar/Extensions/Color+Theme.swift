import SwiftUI

extension Color {
    // Backgrounds
    static let skyBackground      = Color(hex: "070B14")
    static let skyCard            = Color(hex: "0F1826")
    static let skyCardSecondary   = Color(hex: "162033")
    static let skyBorder          = Color(hex: "1C2D4A")

    // Accents
    static let skyAccent          = Color(hex: "00D4FF")
    static let skyAccentDim       = Color(hex: "0099BB")
    static let skyGreen           = Color(hex: "00E676")
    static let skyOrange          = Color(hex: "FF7043")
    static let skyYellow          = Color(hex: "FFD600")
    static let skyRed             = Color(hex: "FF3B5C")
    static let skyGray            = Color(hex: "90A4AE")

    // Text
    static let skyText            = Color(hex: "E8F0FE")
    static let skyTextSecondary   = Color(hex: "7B93B8")
    static let skyTextDim         = Color(hex: "4A6080")

    // Radar
    static let radarGreen         = Color(hex: "00FF88")

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:  (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:  (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:  (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}

extension LinearGradient {
    static let skyPrimary = LinearGradient(
        colors: [.skyAccent, Color(hex: "0066FF")],
        startPoint: .topLeading, endPoint: .bottomTrailing)

    static let skyCard = LinearGradient(
        colors: [Color.skyCard, Color.skyCardSecondary],
        startPoint: .top, endPoint: .bottom)

    static let radarSweep = LinearGradient(
        colors: [Color.radarGreen.opacity(0), Color.radarGreen.opacity(0.3)],
        startPoint: .center, endPoint: .trailing)
}

// Altitude → color mapping
extension AltitudeCategory {
    var color: Color {
        switch self {
        case .ground:  return .skyGray
        case .low:     return .skyOrange
        case .medium:  return .skyYellow
        case .high:    return .skyAccent
        case .unknown: return .skyAccent
        }
    }
}
