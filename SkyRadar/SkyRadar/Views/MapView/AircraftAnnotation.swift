import MapKit
import UIKit

// MARK: - Annotation model

final class AircraftAnnotationModel: NSObject, MKAnnotation {
    var aircraft: Aircraft
    @objc dynamic var coordinate: CLLocationCoordinate2D

    var title: String?    { aircraft.displayCallsign }
    var subtitle: String? { aircraft.isMilitary ? "MILITARY" : aircraft.altitudeFeet.map { "\($0) ft" } }

    init(aircraft: Aircraft) {
        self.aircraft   = aircraft
        self.coordinate = aircraft.coordinate ?? CLLocationCoordinate2D()
    }
}

// MARK: - Annotation view

final class AircraftAnnotationView: MKAnnotationView {
    static let reuseID = "AircraftAnnotationView"

    private let planeLayer    = CAShapeLayer()
    private let glowLayer     = CAShapeLayer()
    private let selRingLayer  = CAShapeLayer()
    private let milBadge      = CALayer()
    private let milDot        = CAShapeLayer()
    private let callsignLabel = UILabel()
    private let infoLabel     = UILabel()
    private var rotationAngle: CGFloat = 0

    private let iconSize:  CGFloat = 48
    private let totalSize: CGFloat = 72

    override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        buildView()
    }
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        buildView()
    }

    // MARK: Build

    private func buildView() {
        let w = totalSize
        frame = CGRect(x: 0, y: 0, width: w, height: w + 18)
        backgroundColor = .clear
        canShowCallout  = false

        let cx = w / 2, cy = iconSize / 2 + 4

        // Glow (rendered below plane)
        glowLayer.frame   = CGRect(x: 0, y: 0, width: w, height: iconSize + 8)
        glowLayer.opacity = 0
        layer.addSublayer(glowLayer)

        // Selection dashed ring
        selRingLayer.frame       = CGRect(x: 0, y: 0, width: w, height: iconSize + 8)
        selRingLayer.strokeColor  = UIColor.white.cgColor
        selRingLayer.fillColor    = UIColor.clear.cgColor
        selRingLayer.lineWidth    = 1.2
        selRingLayer.lineDashPattern = [5, 3]
        selRingLayer.opacity      = 0
        let ringRadius: CGFloat   = iconSize * 0.52
        selRingLayer.path = UIBezierPath(
            arcCenter: CGPoint(x: cx, y: cy),
            radius: ringRadius,
            startAngle: 0, endAngle: .pi * 2, clockwise: true).cgPath
        layer.addSublayer(selRingLayer)

        // Plane silhouette
        planeLayer.frame     = CGRect(x: 0, y: 0, width: w, height: iconSize + 8)
        planeLayer.fillColor = UIColor.white.cgColor
        layer.addSublayer(planeLayer)

        // Military badge dot
        let badgeSize: CGFloat = 10
        milDot.frame       = CGRect(x: cx + 13, y: 5, width: badgeSize, height: badgeSize)
        milDot.path        = UIBezierPath(ovalIn: CGRect(x: 0, y: 0, width: badgeSize, height: badgeSize)).cgPath
        milDot.fillColor   = UIColor(red: 1, green: 0.702, blue: 0, alpha: 1).cgColor
        milDot.strokeColor = UIColor(red: 0.016, green: 0.039, blue: 0.078, alpha: 1).cgColor
        milDot.lineWidth   = 1.5
        milDot.isHidden    = true
        layer.addSublayer(milDot)

        // Callsign label
        callsignLabel.font          = .systemFont(ofSize: 9, weight: .bold)
        callsignLabel.textColor     = .white
        callsignLabel.textAlignment = .center
        callsignLabel.frame         = CGRect(x: 0, y: iconSize + 8, width: w, height: 12)
        callsignLabel.layer.shadowColor   = UIColor.black.cgColor
        callsignLabel.layer.shadowOffset  = .zero
        callsignLabel.layer.shadowOpacity = 0.9
        callsignLabel.layer.shadowRadius  = 2
        addSubview(callsignLabel)

        // Info label (FL / branch)
        infoLabel.font          = .monospacedSystemFont(ofSize: 8, weight: .regular)
        infoLabel.textAlignment = .center
        infoLabel.frame         = CGRect(x: 0, y: iconSize + 20, width: w, height: 11)
        infoLabel.layer.shadowColor   = UIColor.black.cgColor
        infoLabel.layer.shadowOffset  = .zero
        infoLabel.layer.shadowOpacity = 0.85
        infoLabel.layer.shadowRadius  = 2
        addSubview(infoLabel)
    }

    // MARK: Configure

    func configure(with aircraft: Aircraft) {
        let isMil = aircraft.isMilitary
        let color = isMil ? UIColor(red: 1, green: 0.702, blue: 0, alpha: 1) : altColor(aircraft.altitudeCategory)

        // Build plane path (top-down view, nose at top, centered in bounds)
        let cx: CGFloat  = totalSize / 2
        let cy: CGFloat  = iconSize / 2 + 4
        let scale: CGFloat = aircraft.onGround ? 0.72 : 1.0
        let planePath    = makePlanePath(cx: cx, cy: cy, scale: scale)

        planeLayer.path      = planePath
        planeLayer.fillColor = color.cgColor

        // Apply glow
        glowLayer.path         = planePath
        glowLayer.fillColor    = UIColor.clear.cgColor
        glowLayer.strokeColor  = color.cgColor
        glowLayer.lineWidth    = 3
        glowLayer.shadowColor  = color.cgColor
        glowLayer.shadowOffset = .zero
        glowLayer.shadowRadius = 5
        glowLayer.shadowOpacity = 0.45

        // Heading rotation (plane path points UP = north = 0°)
        let heading = CGFloat(aircraft.heading ?? 0) * .pi / 180.0
        rotationAngle = heading

        let cx2 = totalSize / 2, cy2 = cy
        let rot = CATransform3DMakeRotation(heading, 0, 0, 1)
        let toCenter    = CATransform3DMakeTranslation(-cx2, -cy2, 0)
        let fromCenter  = CATransform3DMakeTranslation(cx2, cy2, 0)
        planeLayer.transform  = CATransform3DConcat(CATransform3DConcat(toCenter, rot), fromCenter)
        glowLayer.transform   = planeLayer.transform

        // Military badge
        milDot.isHidden = !isMil

        // Labels
        callsignLabel.text      = aircraft.displayCallsign
        callsignLabel.textColor = isMil ? UIColor(red: 1, green: 0.702, blue: 0, alpha: 1) : .white

        if isMil {
            infoLabel.text      = aircraft.aircraftClass.militaryInfo?.branch.components(separatedBy: " ").first ?? "MIL"
            infoLabel.textColor = UIColor(red: 1, green: 0.702, blue: 0, alpha: 0.72)
        } else if let fl = aircraft.altitudeFeet {
            infoLabel.text      = "FL\(fl / 100)"
            infoLabel.textColor = color.withAlphaComponent(0.72)
        } else {
            infoLabel.text      = aircraft.onGround ? "GND" : ""
            infoLabel.textColor = UIColor(white: 0.55, alpha: 1)
        }

        // Selection ring colour
        selRingLayer.strokeColor = color.cgColor
    }

    // MARK: Plane path (centered at cx, cy, pointing up = north)

    private func makePlanePath(cx: CGFloat, cy: CGFloat, scale: CGFloat) -> CGPath {
        let s = scale * 1.0
        let path = UIBezierPath()

        // Fuselage
        let fuselage = UIBezierPath(ovalIn: CGRect(
            x: cx - 2.2*s, y: cy - 13*s,
            width: 4.4*s, height: 26*s))
        path.append(fuselage)

        // Main wings (swept-back)
        let wings = UIBezierPath()
        wings.move(to:    CGPoint(x: cx,        y: cy - 5*s))
        wings.addLine(to: CGPoint(x: cx - 20*s, y: cy + 6*s))
        wings.addLine(to: CGPoint(x: cx - 17*s, y: cy + 8*s))
        wings.addLine(to: CGPoint(x: cx,        y: cy + 2*s))
        wings.addLine(to: CGPoint(x: cx + 17*s, y: cy + 8*s))
        wings.addLine(to: CGPoint(x: cx + 20*s, y: cy + 6*s))
        wings.close()
        path.append(wings)

        // Tail stabilizers
        let tail = UIBezierPath()
        tail.move(to:    CGPoint(x: cx,        y: cy + 9*s))
        tail.addLine(to: CGPoint(x: cx - 8.5*s, y: cy + 14*s))
        tail.addLine(to: CGPoint(x: cx - 6.5*s, y: cy + 14*s))
        tail.addLine(to: CGPoint(x: cx,         y: cy + 11*s))
        tail.addLine(to: CGPoint(x: cx + 6.5*s, y: cy + 14*s))
        tail.addLine(to: CGPoint(x: cx + 8.5*s, y: cy + 14*s))
        tail.close()
        path.append(tail)

        return path.cgPath
    }

    // MARK: Selection

    override var isSelected: Bool {
        didSet { applySelection(animated: true) }
    }

    private func applySelection(animated: Bool) {
        let color = (annotation as? AircraftAnnotationModel)?.aircraft.isMilitary == true
            ? UIColor(red: 1, green: 0.702, blue: 0, alpha: 1)
            : UIColor(red: 0, green: 0.784, blue: 0.941, alpha: 1)

        selRingLayer.strokeColor = color.cgColor

        let targetOpacity: Float = isSelected ? 0.7 : 0
        let targetScale: CGFloat = isSelected ? 1.35 : 1.0
        let targetGlow:  Float   = isSelected ? 1.0  : 0

        if animated {
            CATransaction.begin()
            CATransaction.setAnimationDuration(0.3)
            CATransaction.setAnimationTimingFunction(
                CAMediaTimingFunction(controlPoints: 0.34, 1.56, 0.64, 1))
            selRingLayer.opacity = targetOpacity
            glowLayer.opacity    = targetGlow
            CATransaction.commit()

            UIView.animate(withDuration: 0.32,
                           delay: 0,
                           usingSpringWithDamping: 0.6,
                           initialSpringVelocity: 0.4) {
                self.transform = CGAffineTransform(scaleX: targetScale, y: targetScale)
            }
        } else {
            selRingLayer.opacity = targetOpacity
            glowLayer.opacity    = targetGlow
            transform = CGAffineTransform(scaleX: targetScale, y: targetScale)
        }

        // Spin dashes
        if isSelected {
            let spin = CABasicAnimation(keyPath: "transform.rotation.z")
            spin.toValue     = CGFloat.pi * 2
            spin.duration    = 9
            spin.repeatCount = .infinity
            spin.timingFunction = CAMediaTimingFunction(name: .linear)
            selRingLayer.add(spin, forKey: "spin")
        } else {
            selRingLayer.removeAnimation(forKey: "spin")
        }
    }

    private func altColor(_ cat: AltitudeCategory) -> UIColor {
        switch cat {
        case .ground:  return UIColor(white: 0.43, alpha: 1)
        case .low:     return UIColor(red: 1.00, green: 0.44, blue: 0.26, alpha: 1)
        case .medium:  return UIColor(red: 1.00, green: 0.84, blue: 0.00, alpha: 1)
        case .high:    return UIColor(red: 0.00, green: 0.78, blue: 0.94, alpha: 1)
        case .unknown: return UIColor(red: 0.00, green: 0.78, blue: 0.94, alpha: 1)
        }
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        selRingLayer.opacity = 0
        glowLayer.opacity    = 0
        milDot.isHidden      = true
        transform            = .identity
        selRingLayer.removeAllAnimations()
    }
}
