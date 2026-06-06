import SwiftUI
import MapKit

struct ContentView: View {
    @StateObject private var viewModel       = FlightViewModel()
    @StateObject private var locationService = LocationService.shared
    @State private var showSearch  = false
    @State private var showFilter  = false
    @State private var errorVisible = false

    var body: some View {
        ZStack(alignment: .bottom) {

            // ── Map ────────────────────────────────────────
            FlightMapView(viewModel: viewModel)
                .ignoresSafeArea()

            // ── Radar sweep ────────────────────────────────
            RadarSweepView()
                .ignoresSafeArea()
                .allowsHitTesting(false)

            // ── Top bar ────────────────────────────────────
            VStack {
                topBar.padding(.top, 54).padding(.horizontal, 12)
                Spacer()
            }

            // ── Right floating buttons ─────────────────────
            VStack(spacing: 10) {
                Spacer()
                floatButtons
                    .padding(.trailing, 12)
                    .padding(.bottom, viewModel.selectedAircraft == nil ? 112 : 420)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)

            // ── Stats bar ──────────────────────────────────
            if viewModel.selectedAircraft == nil {
                VStack {
                    Spacer()
                    StatsBarView(viewModel: viewModel)
                        .padding(.horizontal, 12)
                        .padding(.bottom, 28)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
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
                    .padding(.bottom, 108)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(20)
            }
        }
        .sheet(isPresented: $showSearch) { SearchOverlayView(viewModel: viewModel) }
        .sheet(isPresented: $showFilter) { FilterView(viewModel: viewModel) }
        .onChange(of: viewModel.errorMessage) { msg in
            withAnimation { errorVisible = msg != nil }
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
            HStack(spacing: 7) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(LinearGradient.skyPrimary)
                        .frame(width: 30, height: 30)
                    Image(systemName: "dot.radiowaves.up.forward")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
                Text("SkyRadar")
                    .font(.system(size: 19, weight: .800, design: .rounded))
                    .foregroundColor(.skyText)
            }

            Spacer()

            // Live pill
            LivePill(count: viewModel.visibleCount)

            Spacer()

            // Buttons
            HStack(spacing: 6) {
                MapIconButton(icon: "magnifyingglass") { showSearch = true }
                MapIconButton(icon: "slider.horizontal.3") { showFilter = true }
                MapIconButton(
                    icon: viewModel.isRefreshing
                        ? "arrow.triangle.2.circlepath"
                        : "arrow.clockwise"
                ) {
                    Task { await viewModel.manualRefresh() }
                }
                .rotationEffect(.degrees(viewModel.isRefreshing ? 360 : 0))
                .animation(
                    viewModel.isRefreshing
                        ? .linear(duration: 0.7).repeatForever(autoreverses: false)
                        : .default,
                    value: viewModel.isRefreshing)
            }
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.skyBorder, lineWidth: 1))
    }

    // MARK: Floating right buttons
    private var floatButtons: some View {
        VStack(spacing: 8) {
            // My location
            MapIconButton(
                icon: "location.fill",
                tint: viewModel.userLocation != nil ? .skyAccent : .skyTextSecondary
            ) {
                viewModel.goToUserLocation()
            }

            // Map type toggle (placeholder visual)
            MapIconButton(icon: "map") {}
        }
    }

    // MARK: Loading overlay
    private var loadingOverlay: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color.skyBorder, lineWidth: 1.5)
                    .frame(width: 60, height: 60)
                SpinningArc()
                    .stroke(LinearGradient.skyPrimary,
                            style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .frame(width: 60, height: 60)
                    .rotationEffect(.degrees(viewModel.isLoading ? 360 : 0))
                    .animation(.linear(duration: 0.9).repeatForever(autoreverses: false),
                               value: viewModel.isLoading)
                Image(systemName: "airplane")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(.skyAccent)
                    .rotationEffect(.degrees(-45))
            }
            Text("Scanning airspace…")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.skyTextSecondary)
        }
        .padding(28)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.skyBorder, lineWidth: 1))
    }

    // MARK: Error banner
    private func errorBanner(_ msg: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.skyOrange)
            Text(msg)
                .font(.system(size: 13)).foregroundColor(.skyText).lineLimit(2)
            Spacer()
            Button("Retry") { Task { await viewModel.manualRefresh() } }
                .font(.system(size: 13, weight: .bold)).foregroundColor(.skyAccent)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(Color.skyCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.skyOrange.opacity(0.4), lineWidth: 1))
    }
}

// MARK: - Sub-components

struct LivePill: View {
    let count: Int
    @State private var ring = false

    var body: some View {
        HStack(spacing: 5) {
            ZStack {
                Circle()
                    .fill(Color.skyGreen.opacity(0.3))
                    .frame(width: 14, height: 14)
                    .scaleEffect(ring ? 1.9 : 1)
                    .opacity(ring ? 0 : 0.6)
                    .animation(.easeOut(duration: 1.5).repeatForever(autoreverses: false), value: ring)
                Circle()
                    .fill(Color.skyGreen)
                    .frame(width: 7, height: 7)
            }
            Text("\(count) flights")
                .font(.system(size: 12, weight: .600, design: .rounded))
                .foregroundColor(.skyText)
        }
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(Color.skyGreen.opacity(0.1))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.skyGreen.opacity(0.22), lineWidth: 1))
        .onAppear { ring = true }
    }
}

struct MapIconButton: View {
    let icon: String
    var tint: Color = .skyTextSecondary
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(tint)
                .frame(width: 36, height: 36)
                .background(.ultraThinMaterial)
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.skyBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct SpinningArc: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.addArc(center: CGPoint(x: rect.midX, y: rect.midY),
                 radius: rect.width / 2,
                 startAngle: .degrees(-90),
                 endAngle: .degrees(20),
                 clockwise: false)
        return p
    }
}
