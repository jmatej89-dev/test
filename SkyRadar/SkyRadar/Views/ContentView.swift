import SwiftUI
import MapKit

struct ContentView: View {
    @StateObject private var viewModel       = FlightViewModel()
    @StateObject private var locationService = LocationService.shared
    @State private var showSearch = false
    @State private var showFilter = false
    @State private var errorVisible = false

    var body: some View {
        ZStack(alignment: .bottom) {

            // ── Map ──────────────────────────────────────────────
            FlightMapView(viewModel: viewModel)
                .ignoresSafeArea()

            // ── Radar sweep (purely visual) ──────────────────────
            RadarSweepView()
                .ignoresSafeArea()
                .allowsHitTesting(false)

            // ── Top bar ──────────────────────────────────────────
            VStack {
                topBar
                    .padding(.top, 54)
                    .padding(.horizontal, 14)
                Spacer()
            }

            // ── Stats bar (hides when a plane is selected) ───────
            if viewModel.selectedAircraft == nil {
                VStack {
                    Spacer()
                    StatsBarView(viewModel: viewModel)
                        .padding(.horizontal, 14)
                        .padding(.bottom, 30)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            // ── Detail sheet ─────────────────────────────────────
            if let _ = viewModel.selectedAircraft {
                VStack {
                    Spacer()
                    AircraftDetailView(
                        aircraft: viewModel.selectedAircraft!,
                        viewModel: viewModel)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(10)
            }

            // ── Loading overlay (first load) ─────────────────────
            if viewModel.isLoading && viewModel.aircraft.isEmpty {
                loadingOverlay
            }

            // ── Error banner ─────────────────────────────────────
            if let msg = viewModel.errorMessage, errorVisible {
                errorBanner(msg)
                    .padding(.horizontal, 14)
                    .padding(.bottom, 110)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(20)
            }
        }
        .sheet(isPresented: $showSearch) {
            SearchOverlayView(viewModel: viewModel)
        }
        .sheet(isPresented: $showFilter) {
            FilterView(viewModel: viewModel)
        }
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
        .onDisappear {
            viewModel.stopTracking()
        }
        .preferredColorScheme(.dark)
        .animation(.spring(response: 0.38, dampingFraction: 0.82), value: viewModel.selectedAircraft?.id)
    }

    // MARK: Top bar
    private var topBar: some View {
        HStack(spacing: 10) {
            // Branding
            HStack(spacing: 7) {
                Image(systemName: "dot.radiowaves.up.forward")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(LinearGradient.skyPrimary)
                Text("SkyRadar")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.skyText)
            }

            Spacer()

            // Live pill
            livePill

            Spacer()

            // Buttons
            HStack(spacing: 6) {
                iconButton("magnifyingglass") { showSearch = true }
                iconButton("slider.horizontal.3") { showFilter = true }
                iconButton(viewModel.isRefreshing ? "arrow.triangle.2.circlepath" : "arrow.clockwise") {
                    Task { await viewModel.manualRefresh() }
                }
                .rotationEffect(.degrees(viewModel.isRefreshing ? 360 : 0))
                .animation(
                    viewModel.isRefreshing
                        ? .linear(duration: 0.8).repeatForever(autoreverses: false)
                        : .default,
                    value: viewModel.isRefreshing)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color.skyBorder, lineWidth: 1)
        )
    }

    @ViewBuilder
    private var livePill: some View {
        HStack(spacing: 5) {
            LiveDot()
            Text("\(viewModel.visibleCount) flights")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(.skyText)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color.skyGreen.opacity(0.12))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.skyGreen.opacity(0.25), lineWidth: 1))
    }

    // MARK: Loading overlay
    private var loadingOverlay: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .stroke(Color.skyBorder, lineWidth: 1.5)
                    .frame(width: 64, height: 64)
                SpinningArc()
                    .stroke(
                        LinearGradient.skyPrimary,
                        style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .frame(width: 64, height: 64)
                Image(systemName: "airplane")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.skyAccent)
                    .rotationEffect(.degrees(-45))
            }
            Text("Scanning airspace…")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.skyTextSecondary)
        }
        .padding(30)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.skyBorder, lineWidth: 1))
    }

    // MARK: Error banner
    private func errorBanner(_ msg: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.skyOrange)
            Text(msg)
                .font(.system(size: 13))
                .foregroundColor(.skyText)
                .lineLimit(2)
            Spacer()
            Button("Retry") {
                Task { await viewModel.manualRefresh() }
            }
            .font(.system(size: 13, weight: .bold))
            .foregroundColor(.skyAccent)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.skyCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.skyOrange.opacity(0.4), lineWidth: 1))
    }

    // MARK: Helpers
    private func iconButton(_ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.skyTextSecondary)
                .frame(width: 34, height: 34)
                .background(Color.skyCardSecondary)
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.skyBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Live dot animation

struct LiveDot: View {
    @State private var ring = false

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.skyGreen.opacity(0.3))
                .frame(width: 14, height: 14)
                .scaleEffect(ring ? 1.8 : 1)
                .opacity(ring ? 0 : 0.8)
                .animation(.easeOut(duration: 1.4).repeatForever(autoreverses: false), value: ring)
            Circle()
                .fill(Color.skyGreen)
                .frame(width: 7, height: 7)
        }
        .onAppear { ring = true }
    }
}

// MARK: - Spinning arc shape

struct SpinningArc: Shape {
    var animatableData: Double = 0

    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.addArc(center: CGPoint(x: rect.midX, y: rect.midY),
                 radius: rect.width / 2,
                 startAngle: .degrees(-90),
                 endAngle: .degrees(-90 + 110),
                 clockwise: false)
        return p
    }
}
