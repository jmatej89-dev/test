import Foundation
import Combine
import CoreLocation
import MapKit

@MainActor
final class FlightViewModel: ObservableObject {

    // MARK: - Published State
    @Published var aircraft: [Aircraft] = []
    @Published var filteredAircraft: [Aircraft] = []
    @Published var selectedAircraft: Aircraft?
    @Published var isLoading = false
    @Published var isRefreshing = false
    @Published var errorMessage: String?
    @Published var lastUpdate: Date?

    // Filters
    @Published var searchQuery = ""
    @Published var showOnGround = false
    @Published var altitudeFilter: AltitudeFilter = .all
    @Published var countryFilter: String = ""

    // Map state
    @Published var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 48.5, longitude: 12.0),
        span: MKCoordinateSpan(latitudeDelta: 18, longitudeDelta: 22)
    )
    @Published var followUserLocation = false

    // MARK: - Computed Stats
    var visibleCount: Int { filteredAircraft.count }

    var averageAltitudeFt: Int {
        let alts = filteredAircraft.compactMap { $0.altitudeFeet }
        guard !alts.isEmpty else { return 0 }
        return alts.reduce(0, +) / alts.count
    }

    var averageSpeedKts: Int {
        let spds = filteredAircraft.compactMap { $0.speedKnots }
        guard !spds.isEmpty else { return 0 }
        return spds.reduce(0, +) / spds.count
    }

    var climbingCount: Int {
        filteredAircraft.filter { $0.climbStatus == .climbing }.count
    }

    var descendingCount: Int {
        filteredAircraft.filter { $0.climbStatus == .descending }.count
    }

    var countries: [String] {
        let all = aircraft.map { $0.originCountry }
        return Array(Set(all)).sorted()
    }

    // MARK: - Private
    private var refreshTimer: Timer?
    private var cancellables = Set<AnyCancellable>()
    private let refreshInterval: TimeInterval = 12

    init() {
        setupFilterPipeline()
    }

    // MARK: - Lifecycle
    func startTracking() {
        Task { await fetchFlights() }
        refreshTimer = Timer.scheduledTimer(withTimeInterval: refreshInterval, repeats: true) { [weak self] _ in
            Task { await self?.fetchFlights() }
        }
    }

    func stopTracking() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }

    func manualRefresh() async {
        isRefreshing = true
        await fetchFlights()
        isRefreshing = false
    }

    // MARK: - Selection
    func select(_ aircraft: Aircraft?) {
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            selectedAircraft = aircraft
        }
    }

    func centerOn(_ aircraft: Aircraft) {
        guard let coord = aircraft.coordinate else { return }
        withAnimation(.easeInOut(duration: 0.6)) {
            mapRegion = MKCoordinateRegion(
                center: coord,
                span: MKCoordinateSpan(latitudeDelta: 4, longitudeDelta: 4)
            )
        }
    }

    func updateRegion(_ region: MKCoordinateRegion) {
        mapRegion = region
        Task { await fetchFlights() }
    }

    func nearbyAircraft(to location: CLLocationCoordinate2D, limit: Int = 8) -> [Aircraft] {
        filteredAircraft
            .compactMap { a -> (Aircraft, Double)? in
                guard let c = a.coordinate else { return nil }
                let d = CLLocation(latitude: c.latitude, longitude: c.longitude)
                    .distance(from: CLLocation(latitude: location.latitude, longitude: location.longitude))
                return (a, d)
            }
            .sorted { $0.1 < $1.1 }
            .prefix(limit)
            .map { $0.0 }
    }

    // MARK: - Private
    private func fetchFlights() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil

        do {
            let box = BoundingBox(
                center: mapRegion.center,
                latSpan: mapRegion.span.latitudeDelta * 0.6,
                lonSpan: mapRegion.span.longitudeDelta * 0.6
            )
            let fetched = try await OpenSkyService.shared.fetchAircraft(in: box)
            aircraft = fetched
            applyFilters()
            lastUpdate = Date()
        } catch {
            errorMessage = (error as? FlightError)?.errorDescription ?? error.localizedDescription
        }

        isLoading = false
    }

    private func setupFilterPipeline() {
        Publishers.CombineLatest4($searchQuery, $showOnGround, $altitudeFilter, $countryFilter)
            .debounce(for: .milliseconds(200), scheduler: RunLoop.main)
            .sink { [weak self] _, _, _, _ in self?.applyFilters() }
            .store(in: &cancellables)
    }

    private func applyFilters() {
        var result = aircraft

        if !showOnGround {
            result = result.filter { !$0.onGround }
        }

        switch altitudeFilter {
        case .all: break
        case .low:    result = result.filter { ($0.altitudeFeet ?? 0) < 10_000 }
        case .medium: result = result.filter { let a = ($0.altitudeFeet ?? 0); return a >= 10_000 && a < 35_000 }
        case .high:   result = result.filter { ($0.altitudeFeet ?? 0) >= 35_000 }
        }

        if !countryFilter.isEmpty {
            result = result.filter { $0.originCountry == countryFilter }
        }

        if !searchQuery.isEmpty {
            let q = searchQuery.lowercased()
            result = result.filter {
                $0.displayCallsign.lowercased().contains(q) ||
                $0.id.lowercased().contains(q) ||
                $0.originCountry.lowercased().contains(q)
            }
        }

        filteredAircraft = result
    }
}

enum AltitudeFilter: String, CaseIterable, Identifiable {
    case all    = "All altitudes"
    case low    = "Low  < 10 000 ft"
    case medium = "Mid  10–35 000 ft"
    case high   = "High > 35 000 ft"

    var id: String { rawValue }
}
