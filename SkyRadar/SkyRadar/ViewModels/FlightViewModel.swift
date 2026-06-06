import Foundation
import Combine
import CoreLocation
import MapKit

@MainActor
final class FlightViewModel: ObservableObject {

    // MARK: - Published
    @Published var aircraft: [Aircraft] = []
    @Published var filteredAircraft: [Aircraft] = []
    @Published var selectedAircraft: Aircraft?
    @Published var isLoading     = false
    @Published var isRefreshing  = false
    @Published var errorMessage: String?
    @Published var lastUpdate: Date?

    // Filters
    @Published var searchQuery    = ""
    @Published var showOnGround   = false
    @Published var showMilitary   = true
    @Published var onlyMilitary   = false
    @Published var altitudeFilter: AltitudeFilter = .all
    @Published var countryFilter  = ""

    // Map
    @Published var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 48.5, longitude: 12.0),
        span: MKCoordinateSpan(latitudeDelta: 18, longitudeDelta: 22))

    // MARK: - Stats
    var visibleCount:        Int { filteredAircraft.count }
    var militaryCount:       Int { filteredAircraft.filter { $0.isMilitary }.count }
    var climbingCount:       Int { filteredAircraft.filter { $0.climbStatus == .climbing }.count }
    var descendingCount:     Int { filteredAircraft.filter { $0.climbStatus == .descending }.count }

    var averageAltitudeFt: Int {
        let a = filteredAircraft.compactMap { $0.altitudeFeet }
        return a.isEmpty ? 0 : a.reduce(0, +) / a.count
    }
    var averageSpeedKts: Int {
        let s = filteredAircraft.compactMap { $0.speedKnots }
        return s.isEmpty ? 0 : s.reduce(0, +) / s.count
    }

    var countries: [String] {
        Array(Set(aircraft.map { $0.originCountry })).sorted()
    }

    // MARK: - Private
    private var refreshTimer: Timer?
    private var cancellables = Set<AnyCancellable>()

    init() { setupFilterPipeline() }

    // MARK: - Tracking
    func startTracking() {
        Task { await fetchFlights() }
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 12, repeats: true) { [weak self] _ in
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

    // MARK: - Selection & navigation
    func select(_ aircraft: Aircraft?) {
        withAnimation(.spring(response: 0.38, dampingFraction: 0.82)) {
            selectedAircraft = aircraft
        }
    }

    func centerOn(_ aircraft: Aircraft) {
        guard let coord = aircraft.coordinate else { return }
        withAnimation(.easeInOut(duration: 0.6)) {
            mapRegion = MKCoordinateRegion(
                center: coord,
                span: MKCoordinateSpan(latitudeDelta: 4, longitudeDelta: 4))
        }
    }

    func updateRegion(_ region: MKCoordinateRegion) {
        mapRegion = region
        Task { await fetchFlights() }
    }

    // MARK: - Private
    private func fetchFlights() async {
        guard !isLoading else { return }
        isLoading     = true
        errorMessage  = nil

        do {
            let box = BoundingBox(
                center:  mapRegion.center,
                latSpan: mapRegion.span.latitudeDelta  * 0.6,
                lonSpan: mapRegion.span.longitudeDelta * 0.6)
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
        Publishers.MergeMany(
            $searchQuery.map { _ in () }.eraseToAnyPublisher(),
            $showOnGround.map { _ in () }.eraseToAnyPublisher(),
            $showMilitary.map { _ in () }.eraseToAnyPublisher(),
            $onlyMilitary.map { _ in () }.eraseToAnyPublisher(),
            $altitudeFilter.map { _ in () }.eraseToAnyPublisher(),
            $countryFilter.map { _ in () }.eraseToAnyPublisher()
        )
        .debounce(for: .milliseconds(150), scheduler: RunLoop.main)
        .sink { [weak self] in self?.applyFilters() }
        .store(in: &cancellables)
    }

    func applyFilters() {
        var result = aircraft

        if !showOnGround  { result = result.filter { !$0.onGround } }
        if !showMilitary  { result = result.filter { !$0.isMilitary } }
        if  onlyMilitary  { result = result.filter {  $0.isMilitary } }

        switch altitudeFilter {
        case .all:    break
        case .low:    result = result.filter { ($0.altitudeFeet ?? 0) < 10_000 }
        case .medium: result = result.filter { let a = $0.altitudeFeet ?? 0; return a >= 10_000 && a < 35_000 }
        case .high:   result = result.filter { ($0.altitudeFeet ?? 0) >= 35_000 }
        }

        if !countryFilter.isEmpty {
            result = result.filter { $0.originCountry == countryFilter }
        }

        if !searchQuery.isEmpty {
            let q = searchQuery.lowercased()
            result = result.filter {
                $0.displayCallsign.lowercased().contains(q) ||
                $0.id.lowercased().contains(q)              ||
                $0.originCountry.lowercased().contains(q)   ||
                ($0.aircraftClass.militaryInfo?.branch.lowercased().contains(q) ?? false)
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
