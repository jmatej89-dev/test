import Foundation

extension Double {
    var toFeet: Int  { Int(self * 3.28084) }
    var toKnots: Int { Int(self * 1.94384) }
    var toFpm: Int   { Int(self * 196.85) }

    var formattedAltFt: String {
        let ft = toFeet
        if ft >= 1000 {
            return "\(ft / 1000),\(String(format: "%03d", ft % 1000)) ft"
        }
        return "\(ft) ft"
    }

    var formattedSpeed: String { "\(toKnots) kts" }

    var formattedVSpeed: String {
        let fpm = toFpm
        return fpm >= 0 ? "+\(fpm) fpm" : "\(fpm) fpm"
    }
}

extension Int {
    var withCommas: String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return f.string(from: NSNumber(value: self)) ?? "\(self)"
    }
}

extension Date {
    var relativeShort: String {
        let sec = Int(Date().timeIntervalSince(self))
        if sec < 60 { return "now" }
        if sec < 3600 { return "\(sec / 60)m ago" }
        return "\(sec / 3600)h ago"
    }

    var timeString: String {
        let f = DateFormatter()
        f.timeStyle = .medium
        return f.string(from: self)
    }
}

extension Optional where Wrapped == Int {
    var displayOrDash: String {
        guard let v = self else { return "—" }
        return v.withCommas
    }
}
