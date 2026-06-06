import SwiftUI

struct AircraftDetailView: View {
    let aircraft: Aircraft
    @ObservedObject var viewModel: FlightViewModel
    @State private var expanded = false

    var isMil: Bool { aircraft.isMilitary }
    var accentColor: Color { isMil ? .milAmber : .skyAccent }

    var body: some View {
        VStack(spacing: 0) {
            // Drag handle
            RoundedRectangle(cornerRadius: 3)
                .fill(Color.skyBorder)
                .frame(width: 40, height: 5)
                .padding(.top, 10)
                .onTapGesture { withAnimation(.spring()) { expanded.toggle() } }

            // Photo (collapsed: 130 pt, expanded: 200 pt)
            photoSection
                .frame(height: expanded ? 200 : 130)
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: expanded)

            // Header
            headerSection

            ScrollView {
                VStack(spacing: 0) {
                    if isMil { militaryBanner }

                    Divider().overlay(Color.skyBorder).padding(.horizontal)

                    statusRow
                        .padding(.vertical, 12)
                        .padding(.horizontal, 16)

                    Divider().overlay(Color.skyBorder).padding(.horizontal)

                    metricsGrid
                        .padding(14)

                    if expanded {
                        Divider().overlay(Color.skyBorder).padding(.horizontal)
                        transponderRow
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                    }

                    actionRow
                        .padding(.horizontal, 14)
                        .padding(.bottom, 16)
                        .padding(.top, 6)
                }
            }
        }
        .background(Color.skyCard, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(isMil ? Color.milAmber.opacity(0.3) : Color.skyBorder, lineWidth: 1)
        )
        .padding(.horizontal, 8)
        .frame(maxHeight: expanded ? 620 : 400)
        .gesture(
            DragGesture(minimumDistance: 20)
                .onEnded { g in
                    if g.translation.height < -40 {
                        withAnimation(.spring()) { expanded = true }
                    } else if g.translation.height > 40 {
                        if expanded {
                            withAnimation(.spring()) { expanded = false }
                        } else {
                            viewModel.select(nil)
                        }
                    }
                }
        )
        .padding(.bottom, 16)
    }

    // MARK: Photo
    private var photoSection: some View {
        AircraftPhotoView(icao24: aircraft.id)
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 0,
                    bottomLeadingRadius: 0,
                    bottomTrailingRadius: 0,
                    topTrailingRadius: 0)
            )
    }

    // MARK: Header
    private var headerSection: some View {
        HStack(alignment: .center, spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(accentColor.opacity(0.12))
                    .frame(width: 50, height: 50)
                Circle()
                    .stroke(accentColor.opacity(0.28), lineWidth: 1)
                    .frame(width: 50, height: 50)
                Image(systemName: isMil ? "airplane.departure" : "airplane")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(accentColor)
                    .rotationEffect(.degrees(-45))
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(aircraft.displayCallsign)
                        .font(.system(size: 21, weight: .bold, design: .monospaced))
                        .foregroundColor(.skyText)

                    climbBadge
                }
                HStack(spacing: 6) {
                    if let mil = aircraft.aircraftClass.militaryInfo {
                        Text(mil.flag)
                        Text(mil.country)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.milAmber)
                    } else {
                        Text("🌍")
                        Text(aircraft.originCountry)
                            .font(.system(size: 12))
                            .foregroundColor(.skyTextSecondary)
                    }
                    if let sq = aircraft.squawk {
                        Text("· SQK \(sq)")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.skyTextDim)
                    }
                }
            }

            Spacer()

            // Expand / close
            VStack(spacing: 6) {
                Button { viewModel.select(nil) } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.skyTextSecondary)
                        .frame(width: 30, height: 30)
                        .background(Color.skyCardSecondary)
                        .clipShape(Circle())
                }
                Button { withAnimation(.spring()) { expanded.toggle() } } label: {
                    Image(systemName: expanded ? "chevron.down" : "chevron.up")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.skyTextDim)
                        .frame(width: 30, height: 30)
                        .background(Color.skyCardSecondary)
                        .clipShape(Circle())
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    // MARK: Military banner
    private var militaryBanner: some View {
        HStack(spacing: 10) {
            Image(systemName: "shield.fill")
                .font(.system(size: 13))
                .foregroundColor(.milAmber)

            if let info = aircraft.aircraftClass.militaryInfo {
                Text("\(info.flag) \(info.branch)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.milAmber)
                Spacer()
                Text("MILITARY AIRCRAFT")
                    .font(.system(size: 9, weight: .black, design: .monospaced))
                    .foregroundColor(.milAmber.opacity(0.7))
                    .tracking(1)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 9)
        .background(Color.milAmber.opacity(0.08))
        .overlay(
            Rectangle()
                .fill(Color.milAmber.opacity(0.3))
                .frame(height: 1),
            alignment: .bottom)
    }

    // MARK: Status row
    private var statusRow: some View {
        HStack(spacing: 8) {
            StatusPill(
                icon: aircraft.onGround ? "building.2" : "airplane",
                label: aircraft.onGround ? "On Ground" : "Airborne",
                color: aircraft.onGround ? .skyGray : .skyGreen)
            StatusPill(
                icon: aircraft.climbStatus.symbol,
                label: aircraft.climbStatus.label,
                color: climbColor)
            Spacer()
            StatusPill(
                icon: "clock",
                label: aircraft.lastContact.relativeShort,
                color: .skyTextSecondary)
        }
    }

    // MARK: Metrics
    private var metricsGrid: some View {
        LazyVGrid(columns: Array(repeating: .init(.flexible(), spacing: 8), count: 3), spacing: 8) {
            MetricCard(icon: "cloud",              value: aircraft.altitudeFeet.map { "\($0.withCommas)" } ?? "—",
                       unit: "ft",   label: "Altitude",    color: isMil ? .milAmber : aircraft.altitudeCategory.color)
            MetricCard(icon: "speedometer",        value: aircraft.speedKnots.map { "\($0)" } ?? "—",
                       unit: "kts",  label: "Speed",       color: accentColor)
            MetricCard(icon: "arrow.up.and.down",  value: aircraft.verticalRateFpm.map { abs($0).withCommas } ?? "—",
                       unit: "fpm",  label: vLabel,        color: climbColor)
            MetricCard(icon: "location.north.fill",value: aircraft.heading.map { String(format: "%.0f°", $0) } ?? "—",
                       unit: "",     label: "Heading",     color: .skyYellow)
            MetricCard(icon: "flag.fill",          value: aircraft.flightLevel,
                       unit: "",     label: "Flight Level",color: .skyText)
            MetricCard(icon: "antenna.radiowaves.left.and.right",
                       value: aircraft.squawk ?? "—",      unit: "", label: "Squawk", color: .skyTextSecondary)
        }
    }

    // MARK: Transponder
    private var transponderRow: some View {
        HStack(alignment: .top) {
            DataRow(key: "ICAO24", value: aircraft.id.uppercased())
            Spacer()
            if let lat = aircraft.latitude, let lon = aircraft.longitude {
                DataRow(key: "Position",
                        value: String(format: "%.4f°  %.4f°", lat, lon))
            }
        }
    }

    // MARK: Actions
    private var actionRow: some View {
        HStack(spacing: 10) {
            ActionButton(icon: "location.fill", label: "Centre map", accent: accentColor) {
                viewModel.centerOn(aircraft)
            }
            ActionButton(icon: "arrow.triangle.2.circlepath", label: "Refresh", accent: accentColor) {
                Task { await viewModel.manualRefresh() }
            }
        }
    }

    // MARK: Helpers
    private var vLabel: String {
        switch aircraft.climbStatus {
        case .climbing:   return "Climb Rate"
        case .descending: return "Descent Rate"
        case .level:      return "V/Speed"
        }
    }

    private var climbColor: Color {
        switch aircraft.climbStatus {
        case .climbing:   return .skyGreen
        case .descending: return .skyOrange
        case .level:      return .skyTextSecondary
        }
    }

    private var climbBadge: some View {
        HStack(spacing: 3) {
            Image(systemName: aircraft.climbStatus.symbol)
                .font(.system(size: 10))
            Text(aircraft.climbStatus.label)
                .font(.system(size: 10, weight: .bold))
        }
        .foregroundColor(climbColor)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(climbColor.opacity(0.15))
        .clipShape(Capsule())
    }
}

// MARK: - Shared sub-components

struct MetricCard: View {
    let icon: String
    let value: String
    let unit: String
    let label: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 10))
                    .foregroundColor(color.opacity(0.75))
                Text(label)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.skyTextDim)
                    .lineLimit(1)
            }
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(.skyText)
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(.skyTextSecondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.skyBackground)
        .clipShape(RoundedRectangle(cornerRadius: 11))
        .overlay(RoundedRectangle(cornerRadius: 11).stroke(Color.skyBorder, lineWidth: 1))
    }
}

struct StatusPill: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 10))
            Text(label)
                .font(.system(size: 11, weight: .semibold))
        }
        .foregroundColor(color)
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(color.opacity(0.1))
        .clipShape(Capsule())
    }
}

struct DataRow: View {
    let key: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(key)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.skyTextDim)
            Text(value)
                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                .foregroundColor(.skyText)
        }
    }
}

struct ActionButton: View {
    let icon: String
    let label: String
    let accent: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 7) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
            }
            .foregroundColor(accent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background(accent.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(accent.opacity(0.28), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}
