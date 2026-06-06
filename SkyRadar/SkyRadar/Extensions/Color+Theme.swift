import SwiftUI

extension Color {
    // Backgrounds
    static let skyBackground      = Color(hex: "050A14")
    static let skyCard            = Color(hex: "0D1626")
    static let skyCardSecondary   = Color(hex: "132030")
    static let skyBorder          = Color(hex: "1A2D48")

    // Civilian accents
    static let skyAccent          = Color(hex: "00C8F0")
    static let skyAccentDim       = Color(hex: "007FAA")
    static let skyGreen           = Color(hex: "00E676")
    static let skyOrange          = Color(hex: "FF7043")
    static let skyYellow          = Color(hex: "FFD600")
    static let skyRed             = Color(hex: "FF3B5C")
    static let skyGray            = Color(hex: "8EAABF")

    // Military
    static let milAmber           = Color(hex: "FFB300")
    static let milAmberDim        = Color(hex: "7A5500")

    // Text
    static let skyText            = Color(hex: "DCE9FA")
    static let skyTextSecondary   = Color(hex: "6E8DAD")
    static let skyTextDim         = Color(hex: "384D68")

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
                  red:     Double(r) / 255,
                  green:   Double(g) / 255,
                  blue:    Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}

extension LinearGradient {
    static let skyPrimary = LinearGradient(
        colors: [.skyAccent, Color(hex: "005FCC")],
        startPoint: .topLeading, endPoint: .bottomTrailing)

    static let skyCard = LinearGradient(
        colors: [Color.skyCard, Color.skyCardSecondary],
        startPoint: .top, endPoint: .bottom)

    static let milGradient = LinearGradient(
        colors: [.milAmber, Color(hex: "E65100")],
        startPoint: .topLeading, endPoint: .bottomTrailing)
}

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
