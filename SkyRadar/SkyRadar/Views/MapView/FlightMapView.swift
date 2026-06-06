import SwiftUI
import MapKit

struct FlightMapView: UIViewRepresentable {
    @ObservedObject var viewModel: FlightViewModel

    func makeCoordinator() -> Coordinator { Coordinator(viewModel: viewModel) }

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView()
        map.delegate                     = context.coordinator
        map.showsUserLocation            = true
        map.mapType                      = .mutedStandard
        map.overrideUserInterfaceStyle   = .dark
        map.showsCompass                 = false
        map.showsScale                   = false
        map.showsTraffic                 = false
        map.isRotateEnabled              = true
        map.isPitchEnabled               = false

        map.setRegion(viewModel.mapRegion, animated: false)

        map.register(AircraftAnnotationView.self,
                     forAnnotationViewWithReuseIdentifier: AircraftAnnotationView.reuseID)

        context.coordinator.mapView = map
        return map
    }

    func updateUIView(_ map: MKMapView, context: Context) {
        context.coordinator.syncAnnotations(map, aircraft: viewModel.filteredAircraft)

        // Follow user location
        if viewModel.followUserLocation,
           let loc = viewModel.mapRegion.center as CLLocationCoordinate2D? {
            map.setCenter(loc, animated: true)
        }
    }

    // MARK: - Coordinator
    final class Coordinator: NSObject, MKMapViewDelegate, UIGestureRecognizerDelegate {
        let viewModel: FlightViewModel
        weak var mapView: MKMapView?
        private var lastSyncTime = Date.distantPast

        init(viewModel: FlightViewModel) {
            self.viewModel = viewModel
        }

        func syncAnnotations(_ map: MKMapView, aircraft: [Aircraft]) {
            guard Date().timeIntervalSince(lastSyncTime) >= 3 else { return }
            lastSyncTime = Date()

            let existing  = map.annotations.compactMap { $0 as? AircraftAnnotationModel }
            let existIDs  = Set(existing.map { $0.aircraft.id })
            let newIDs    = Set(aircraft.map { $0.id })

            // Remove
            let gone = existing.filter { !newIDs.contains($0.aircraft.id) }
            map.removeAnnotations(gone)

            // Update positions smoothly
            for ann in existing where newIDs.contains(ann.aircraft.id) {
                guard let updated = aircraft.first(where: { $0.id == ann.aircraft.id }),
                      let coord = updated.coordinate else { continue }
                UIView.animate(withDuration: 4.0, delay: 0,
                               options: [.curveLinear, .allowUserInteraction]) {
                    ann.coordinate = coord
                }
                ann.aircraft = updated
                if let view = map.view(for: ann) as? AircraftAnnotationView {
                    view.configure(with: updated)
                }
            }

            // Add new
            let toAdd = aircraft
                .filter { !existIDs.contains($0.id) && $0.coordinate != nil }
                .map { AircraftAnnotationModel(aircraft: $0) }
            map.addAnnotations(toAdd)
        }

        // MARK: MKMapViewDelegate
        func mapView(_ map: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard let model = annotation as? AircraftAnnotationModel else { return nil }
            let view = map.dequeueReusableAnnotationView(
                withIdentifier: AircraftAnnotationView.reuseID,
                for: model) as! AircraftAnnotationView
            view.configure(with: model.aircraft)
            return view
        }

        func mapView(_ map: MKMapView, didSelect annotation: MKAnnotation) {
            guard let model = annotation as? AircraftAnnotationModel else { return }
            Task { @MainActor in viewModel.select(model.aircraft) }
        }

        func mapView(_ map: MKMapView, didDeselect annotation: MKAnnotation) {
            guard annotation is AircraftAnnotationModel else { return }
            Task { @MainActor in viewModel.select(nil) }
        }

        func mapView(_ map: MKMapView, regionDidChangeAnimated animated: Bool) {
            Task { @MainActor in viewModel.updateRegion(map.region) }
        }

        func gestureRecognizer(
            _ g: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }
    }
}
