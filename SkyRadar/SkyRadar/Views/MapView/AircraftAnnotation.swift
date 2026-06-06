import MapKit
import UIKit

// MARK: - Annotation Model

final class AircraftAnnotationModel: NSObject, MKAnnotation {
    static let reuseID = "AircraftAnnotationView"

    var aircraft: Aircraft
    @objc dynamic var coordinate: CLLocationCoordinate2D

    var title: String?    { aircraft.displayCallsign }
    var subtitle: String? { aircraft.altitudeFeet.map { "\($0) ft" } }

    init(aircraft: Aircraft) {
        self.aircraft   = aircraft
        self.coordinate = aircraft.coordinate ?? CLLocationCoordinate2D()
    }
}

// MARK: - Annotation View

final class AircraftAnnotationView: MKAnnotationView {
    static let reuseID = "AircraftAnnotationView"

    private let planeImageView = UIImageView()
    private let callsignLabel  = UILabel()
    private let altLabel       = UILabel()
    private let pulseRing      = UIView()

    // Shadow / glow layer
    private let glowLayer = CALayer()

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
        frame             = CGRect(x: 0, y: 0, width: 64, height: 64)
        backgroundColor   = .clear
        canShowCallout    = false
        clusteringIdentifier = nil

        // Pulse ring (shown when selected)
        pulseRing.frame  = CGRect(x: 12, y: 12, width: 40, height: 40)
        pulseRing.layer.cornerRadius = 20
        pulseRing.layer.borderWidth  = 1.5
        pulseRing.layer.borderColor  = UIColor(red: 0, green: 0.83, blue: 1, alpha: 0.5).cgColor
        pulseRing.backgroundColor    = UIColor(red: 0, green: 0.83, blue: 1, alpha: 0.08)
        pulseRing.isHidden           = true
        addSubview(pulseRing)

        // Plane icon
        let cfg = UIImage.SymbolConfiguration(pointSize: 20, weight: .semibold)
        planeImageView.image           = UIImage(systemName: "airplane", withConfiguration: cfg)
        planeImageView.contentMode     = .scaleAspectFit
        planeImageView.frame           = CGRect(x: 22, y: 22, width: 20, height: 20)
        planeImageView.tintColor       = UIColor(red: 0, green: 0.83, blue: 1, alpha: 1)
        addSubview(planeImageView)

        // Callsign
        callsignLabel.font          = .systemFont(ofSize: 8, weight: .bold)
        callsignLabel.textColor     = .white
        callsignLabel.textAlignment = .center
        callsignLabel.frame         = CGRect(x: -8, y: 44, width: 80, height: 10)
        addSubview(callsignLabel)

        // Altitude
        altLabel.font          = .monospacedSystemFont(ofSize: 7, weight: .regular)
        altLabel.textColor     = UIColor(red: 0, green: 0.83, blue: 1, alpha: 0.75)
        altLabel.textAlignment = .center
        altLabel.frame         = CGRect(x: -8, y: 54, width: 80, height: 9)
        addSubview(altLabel)
    }

    // MARK: Configure
    func configure(with aircraft: Aircraft) {
        // Rotate by true heading (airplane SF symbol points up at 0°, true north)
        let heading = (aircraft.heading ?? 0) - 45
        planeImageView.transform = CGAffineTransform(rotationAngle: CGFloat(heading) * .pi / 180)

        callsignLabel.text = aircraft.displayCallsign

        if let fl = aircraft.altitudeFeet {
            altLabel.text = "FL\(fl / 100)"
        } else {
            altLabel.text = aircraft.onGround ? "GND" : ""
        }

        planeImageView.tintColor = uiColor(for: aircraft.altitudeCategory)

        // Scale: very small for ground traffic, normal for airborne
        let scale: CGFloat = aircraft.onGround ? 0.75 : 1.0
        transform = CGAffineTransform(scaleX: scale, y: scale)
    }

    private func uiColor(for cat: AltitudeCategory) -> UIColor {
        switch cat {
        case .ground:  return UIColor(white: 0.65, alpha: 1)
        case .low:     return UIColor(red: 1.0,  green: 0.44, blue: 0.26, alpha: 1)
        case .medium:  return UIColor(red: 1.0,  green: 0.84, blue: 0.0,  alpha: 1)
        case .high:    return UIColor(red: 0.0,  green: 0.83, blue: 1.0,  alpha: 1)
        case .unknown: return UIColor(red: 0.0,  green: 0.83, blue: 1.0,  alpha: 1)
        }
    }

    // MARK: Selection
    override var isSelected: Bool {
        didSet { updateSelectionState(animated: true) }
    }

    private func updateSelectionState(animated: Bool) {
        let block: () -> Void = {
            self.pulseRing.isHidden = !self.isSelected
            let s: CGFloat = self.isSelected ? 1.5 : 1.0
            self.planeImageView.transform = self.planeImageView.transform.scaledBy(x: s, y: s)
        }
        if animated {
            UIView.animate(withDuration: 0.25,
                           delay: 0,
                           usingSpringWithDamping: 0.6,
                           initialSpringVelocity: 0.5,
                           options: [],
                           animations: block)
        } else {
            block()
        }
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        pulseRing.isHidden = true
        transform = .identity
        planeImageView.transform = .identity
    }
}
