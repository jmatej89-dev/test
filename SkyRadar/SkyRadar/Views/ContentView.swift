import SwiftUI
import MapKit

struct ContentView: View {
    @StateObject private var viewModel       = FlightViewModel()
    @StateObject private var locationService = LocationService.shared
    @State private var showSearch   = false
    @State private var showFilter   = false
    @State private var errorVisible = false
    @State private var mapTypeIndex = 0

    let mapTypes: [MKMapType] = [.mutedStandard, .satellite, .hybrid]

    var body: some View {
        ZStack(alignment: .bottom) {

            // ── Map ───────────────────────────────────────
            FlightMapView(viewModel: viewModel)
                .ignoresSafeArea()

            // ── Radar sweep ───────────────────────────────
            RadarSweepView()
                .ignoresSafeArea()
                .allowsHitTesting(false)

            // ── Top bar ───────────────────────────────────
            VStack(spacing: 0) {
                topBar
                    .padding(.top, 54)
                    .padding(.horizontal, 12)
                Spacer()
            }

            // ── Right floating buttons ─────────────────────
            VStack(spacing: 9) {
                Spacer()
                floatButtons
                    .padding(.trailing, 12)
                    .padding(.bottom, viewModel.selectedAircraft == nil ? 118 : 428)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)

            // ── Stats bar ──────────────────────────────────
            if viewModel.selectedAircraft == nil {
                VStack {
                    Spacer()
                    StatsBarView(viewModel: viewModel)
                        .padding(.horizontal, 12)
                        .padding(.bottom, 32)
                }
                .transition(.asymmetric(
                    insertion: .move(edge: .bottom).combined(with: .opacity),
                    removal:   .move(edge: .bottom).combined(with: .opacity)))
            }

            // ── Detail sheet ───────────────────────────────
            if viewModel.selectedAircraft != nil {
                VStack {
                    Spacer()
                    AircraftDetailView(
                        aircraft: viewModel.selectedAircraft!,
                        viewModel: viewModel)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(10)
            }

            // ── First-load spinner ─────────────────────────
            if viewModel.isLoading && viewModel.aircraft.isEmpty {
                loadingOverlay.zIndex(5)
            }

            // ── Error banner ───────────────────────────────
            if let msg = viewModel.errorMessage, errorVisible {
                errorBanner(msg)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 112)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(20)
            }
        }
        .sheet(isPresented: $showSearch) { SearchOverlayView(viewModel: viewModel) }
        .sheet(isPresented: $showFilter) { FilterView(viewModel: viewModel) }
        .onChange(of: viewModel.errorMessage) { msg in
            withAnimation(.spring(response: 0.38, dampingFraction: 0.82)) { errorVisible = msg != nil }
            if msg != nil {
                DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                    withAnimation { errorVisible = false }
                }
            }
        }
        .onAppear {
            locationService.requestAuthorization()
            viewModel.startTracking()
        }
        .onDisappear { viewModel.stopTracking() }
        .preferredColorScheme(.dark)
        .animation(.spring(response: 0.38, dampingFraction: 0.82),
                   value: viewModel.selectedAircraft?.id)
    }

    // MARK: Top bar

    private var topBar: some View {
        HStack(spacing: 9) {
            // Logo
            HStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .fill(LinearGradient(
                            colors: [Color(hex: "#003E99"), Color(hex: "#0078CC")],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 32, height: 32)
                        .shadow(color: Color(hex: "#0055CC").opacity(0.45), radius: 6, y: 2)
                    Image(systemName: "dot.radiowaves.up.forward")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
                Text("SkyRadar")
                    .font(.system(size: 18, weight: .heavy, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.skyText, .skyAccent],
                            startPoint: .leading, endPoint: .trailing))
            }

            Spacer()

            // Live pill
            LiveCountPill(count: viewModel.visibleCount)

            Spacer()

            // Action buttons
            HStack(spacing: 5) {
                MapIconButton(icon: "magnifyingglass") { showSearch = true }
                MapIconButton(icon: "slider.horizontal.3") { showFilter = true }
                MapIconButton(
                    icon: viewModel.isRefreshing ? "arrow.triangle.2.circlepath" : "arrow.clockwise"
                ) {
                    Task { await viewModel.manualRefresh() }
                }
                .rotationEffect(.degrees(viewModel.isRefreshing ? 360 : 0))
                .animation(
                    viewModel.isRefreshing
                        ? .linear(duration: 0.7).repeatForever(autoreverses: false) : .default,
                    value: viewModel.isRefreshing)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [Color.skyAccent.opacity(0.15), Color.skyBorder.opacity(0.5)],
                                startPoint: .topLeading, endPoint: .bottomTrailing),
                            lineWidth: 1))
        )
        .shadow(color: Color.black.opacity(0.4), radius: 16, y: 6)
    }

    // MARK: Floating buttons

    private var floatButtons: some View {
        VStack(spacing: 9) {
            MapIconButton(
                icon: "location.fill",
                tint: viewModel.userLocation != nil ? .skyAccent : .skyTextSecondary,
                glowing: viewModel.userLocation != nil
            ) {
                viewModel.goToUserLocation()
            }

            MapIconButton(
                icon: mapTypeIcons[mapTypeIndex],
                tint: .skyTextSecondary
            ) {
                mapTypeIndex = (mapTypeIndex + 1) % mapTypeIcons.count
            }
        }
    }

    private let mapTypeIcons = ["map", "globe.americas.fill", "map.fill"]

    // MARK: Loading overlay

    private var loadingOverlay: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .stroke(Color.skyBorder, lineWidth: 1.5)
                    .frame(width: 62, height: 62)
                SpinningArc()
                    .stroke(LinearGradient.skyPrimary,
                            style: StrokeStyle(lineWidth: 2.2, lineCap: .round))
                    .frame(width: 62, height: 62)
                    .rotationEffect(.degrees(viewModel.isLoading ? 360 : 0))
                    .animation(.linear(duration: 0.9).repeatForever(autoreverses: false),
                               value: viewModel.isLoading)
                Text("✈")
                    .font(.system(size: 22))
                    .shadow(color: .skyAccent.opacity(0.6), radius: 6)
            }
            Text("Scanning airspace…")
                .font(.system(size: 13, weight: .600))
                .foregroundColor(.skyTextSecondary)
                .tracking(.3)
        }
        .padding(.horizontal, 36)
        .padding(.vertical, 30)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(Color.skyBorder, lineWidth: 1))
        )
        .shadow(color: Color.black.opacity(0.5), radius: 24, y: 8)
    }

    // MARK: Error banner

    private func errorBanner(_ msg: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.skyOrange)
                .font(.system(size: 15))
            Text(msg)
                .font(.system(size: 13))
                .foregroundColor(.skyText)
                .lineLimit(2)
            Spacer()
            Button("Retry") { Task { await viewModel.manualRefresh() } }
                .font(.system(size: 13, weight: .700))
                .foregroundColor(.skyAccent)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.skyCard)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
            .stroke(Color.skyOrange.opacity(0.35), lineWidth: 1))
        .shadow(color: Color.black.opacity(0.35), radius: 12, y: 4)
    }
}

// MARK: - Live count pill

struct LiveCountPill: View {
    let count: Int
    @State private var pulse = false

    var body: some View {
        HStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(Color.skyGreen.opacity(0.28))
                    .frame(width: 14, height: 14)
                    .scaleEffect(pulse ? 2.0 : 1)
                    .opacity(pulse ? 0 : 0.65)
                    .animation(.easeOut(duration: 1.6).repeatForever(autoreverses: false), value: pulse)
                Circle()
                    .fill(Color.skyGreen)
                    .frame(width: 7, height: 7)
                    .shadow(color: Color.skyGreen.opacity(0.7), radius: 3)
            }
            Text("\(count)")
                .font(.system(size: 13, weight: .700, design: .rounded))
                .foregroundColor(.skyText)
                .monospacedDigit()
                .contentTransition(.numericText())
            Text("flights")
                .font(.system(size: 12, weight: .500))
                .foregroundColor(.skyTextSecondary)
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 6)
        .background(Color.skyGreen.opacity(0.08))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.skyGreen.opacity(0.2), lineWidth: 1))
        .onAppear { pulse = true }
    }
}

// MARK: - Map icon button

struct MapIconButton: View {
    let icon:    String
    var tint:    Color = .skyTextSecondary
    var glowing: Bool  = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(tint)
                .frame(width: 38, height: 38)
                .background(.ultraThinMaterial)
                .clipShape(Circle())
                .overlay(Circle().stroke(
                    glowing ? tint.opacity(0.35) : Color.skyBorder,
                    lineWidth: 1))
                .shadow(
                    color: glowing ? tint.opacity(0.4) : Color.black.opacity(0.25),
                    radius: glowing ? 8 : 4, y: 2)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Spinning arc shape

struct SpinningArc: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.addArc(center: CGPoint(x: rect.midX, y: rect.midY),
                 radius: rect.width / 2,
                 startAngle: .degrees(-90),
                 endAngle:   .degrees(25),
                 clockwise:  false)
        return p
    }
}
