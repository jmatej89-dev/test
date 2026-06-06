import MapKit
import UIKit

// MARK: - Annotation model

final class AircraftAnnotationModel: NSObject, MKAnnotation {
    var aircraft: Aircraft
    @objc dynamic var coordinate: CLLocationCoordinate2D

    var title: String?    { aircraft.displayCallsign }
    var subtitle: String? {
        if aircraft.isMilitary { return "MILITARY" }
        return aircraft.altitudeFeet.map { "\($0) ft" }
    }

    init(aircraft: Aircraft) {
        self.aircraft   = aircraft
        self.coordinate = aircraft.coordinate ?? CLLocationCoordinate2D()
    }
}

// MARK: - Annotation view

final class AircraftAnnotationView: MKAnnotationView {
    static let reuseID = "AircraftAnnotationView"

    private let container     = UIView()
    private let planeImage    = UIImageView()
    private let pulseRing     = UIView()
    private let militaryBadge = UIView()
    private let labelStack    = UIStackView()
    private let callsignLabel = UILabel()
    private let infoLabel     = UILabel()

    override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        build()
    }
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        build()
    }

    // MARK: Build
    private func build() {
        frame = CGRect(x: 0, y: 0, width: 70, height: 72)
        backgroundColor = .clear
        canShowCallout  = false

        // Pulse ring
        pulseRing.frame           = CGRect(x: 15, y: 15, width: 40, height: 40)
        pulseRing.layer.cornerRadius = 20
        pulseRing.layer.borderWidth  = 1
        pulseRing.isHidden           = true
        addSubview(pulseRing)

        // Plane icon
        planeImage.frame        = CGRect(x: 25, y: 25, width: 20, height: 20)
        planeImage.contentMode  = .scaleAspectFit
        addSubview(planeImage)

        // Military triangle badge (top-right corner)
        militaryBadge.frame           = CGRect(x: 43, y: 18, width: 8, height: 8)
        militaryBadge.layer.cornerRadius = 4
        militaryBadge.isHidden        = true
        addSubview(militaryBadge)

        // Labels below icon
        callsignLabel.font          = .systemFont(ofSize: 8, weight: .bold)
        callsignLabel.textColor     = .white
        callsignLabel.textAlignment = .center
        callsignLabel.frame         = CGRect(x: -5, y: 46, width: 80, height: 11)
        addSubview(callsignLabel)

        infoLabel.font          = .monospacedSystemFont(ofSize: 7, weight: .regular)
        infoLabel.textAlignment = .center
        infoLabel.frame         = CGRect(x: -5, y: 57, width: 80, height: 10)
        addSubview(infoLabel)
    }

    // MARK: Configure
    func configure(with aircraft: Aircraft) {
        let isMil = aircraft.isMilitary

        // Icon symbol: fighter silhouette for military, standard for civilian
        let symbolName = isMil ? "airplane.departure" : "airplane"
        let cfg = UIImage.SymbolConfiguration(pointSize: isMil ? 18 : 17, weight: .semibold)
        planeImage.image = UIImage(systemName: symbolName, withConfiguration: cfg)

        // Color
        let iconColor: UIColor
        if isMil {
            iconColor = UIColor(red: 1.0, green: 0.70, blue: 0.0, alpha: 1)   // amber
        } else {
            iconColor = uiColor(for: aircraft.altitudeCategory)
        }
        planeImage.tintColor = iconColor

        // Heading rotation: SF airplane symbol points up at 0° = north
        let heading = (aircraft.heading ?? 0) - 45
        planeImage.transform = CGAffineTransform(rotationAngle: CGFloat(heading) * .pi / 180)

        // Callsign
        callsignLabel.text = aircraft.displayCallsign
        callsignLabel.textColor = isMil ? UIColor(red: 1, green: 0.70, blue: 0, alpha: 1) : .white

        // Info line
        if isMil {
            infoLabel.text      = aircraft.aircraftClass.militaryInfo?.branch.components(separatedBy: " ").first ?? "MIL"
            infoLabel.textColor = UIColor(red: 1, green: 0.70, blue: 0, alpha: 0.75)
        } else if let fl = aircraft.altitudeFeet {
            infoLabel.text      = "FL\(fl / 100)"
            infoLabel.textColor = iconColor.withAlphaComponent(0.75)
        } else if aircraft.onGround {
            infoLabel.text      = "GND"
            infoLabel.textColor = UIColor(white: 0.6, alpha: 1)
        } else {
            infoLabel.text = ""
        }

        // Military badge dot
        militaryBadge.isHidden        = !isMil
        militaryBadge.backgroundColor = UIColor(red: 1, green: 0.70, blue: 0, alpha: 1)

        // Ground scale
        let scale: CGFloat = aircraft.onGround ? 0.75 : 1.0
        transform = CGAffineTransform(scaleX: scale, y: scale)
    }

    private func uiColor(for cat: AltitudeCategory) -> UIColor {
        switch cat {
        case .ground:  return UIColor(white: 0.55, alpha: 1)
        case .low:     return UIColor(red: 1.0, green: 0.44, blue: 0.26, alpha: 1)
        case .medium:  return UIColor(red: 1.0, green: 0.84, blue: 0.0,  alpha: 1)
        case .high:    return UIColor(red: 0.0, green: 0.78, blue: 0.94, alpha: 1)
        case .unknown: return UIColor(red: 0.0, green: 0.78, blue: 0.94, alpha: 1)
        }
    }

    // MARK: Selection
    override var isSelected: Bool {
        didSet { applySelection(animated: true) }
    }

    private func applySelection(animated: Bool) {
        let color = (annotation as? AircraftAnnotationModel)?.aircraft.isMilitary == true
            ? UIColor(red: 1, green: 0.70, blue: 0, alpha: 0.35)
            : UIColor(red: 0, green: 0.78, blue: 0.94, alpha: 0.3)

        pulseRing.layer.borderColor = color.cgColor
        pulseRing.backgroundColor   = color.withAlphaComponent(0.1)

        let show = isSelected
        UIView.animate(withDuration: 0.25,
                       delay: 0,
                       usingSpringWithDamping: 0.65,
                       initialSpringVelocity: 0.5,
                       options: []) {
            self.pulseRing.isHidden = !show
            let s: CGFloat = show ? 1.5 : 1.0
            self.transform = CGAffineTransform(scaleX: s, y: s)
        }
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        pulseRing.isHidden    = true
        militaryBadge.isHidden = true
        transform             = .identity
        planeImage.transform  = .identity
    }
}
