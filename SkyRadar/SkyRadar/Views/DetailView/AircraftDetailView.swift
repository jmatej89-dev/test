import SwiftUI
import MapKit

struct AircraftDetailView: View {
    let aircraft: Aircraft
    @ObservedObject var viewModel: FlightViewModel
    @State private var sheetHeight: SheetHeight = .partial
    @State private var dragOffset: CGFloat = 0

    enum SheetHeight { case partial, full }

    var body: some View {
        VStack(spacing: 0) {
            // Drag handle
            Capsule()
                .fill(Color.skyBorder)
                .frame(width: 36, height: 4)
                .padding(.top, 10)
                .padding(.bottom, 4)

            // Header
            headerSection

            ScrollView {
                VStack(spacing: 16) {
                    flightStatusRow
                    Divider().overlay(Color.skyBorder)
                    metricsGrid
                    Divider().overlay(Color.skyBorder)
                    transponderSection
                    actionButtons
                }
                .padding()
            }
        }
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.skyBorder, lineWidth: 1)
        )
        .padding(.horizontal, 8)
        .frame(maxHeight: sheetHeight == .full ? 520 : 340)
        .gesture(
            DragGesture()
                .onEnded { g in
                    if g.translation.height < -40 {
                        withAnimation(.spring()) { sheetHeight = .full }
                    } else if g.translation.height > 40 {
                        if sheetHeight == .partial {
                            viewModel.select(nil)
                        } else {
                            withAnimation(.spring()) { sheetHeight = .partial }
                        }
                    }
                }
        )
        .padding(.bottom, 20)
    }

    // MARK: Header
    private var headerSection: some View {
        HStack(alignment: .center, spacing: 14) {
            // Animated plane icon
            ZStack {
                Circle()
                    .fill(aircraft.altitudeCategory.color.opacity(0.15))
                    .frame(width: 52, height: 52)
                Circle()
                    .stroke(aircraft.altitudeCategory.color.opacity(0.3), lineWidth: 1)
                    .frame(width: 52, height: 52)
                Image(systemName: "airplane")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(aircraft.altitudeCategory.color)
                    .rotationEffect(.degrees(-45))
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(aircraft.displayCallsign)
                        .font(.system(size: 22, weight: .bold, design: .monospaced))
                        .foregroundColor(.skyText)
                    climbBadge
                }
                HStack(spacing: 6) {
                    Image(systemName: "globe")
                        .font(.system(size: 11))
                        .foregroundColor(.skyTextDim)
                    Text(aircraft.originCountry)
                        .font(.system(size: 13))
                        .foregroundColor(.skyTextSecondary)
                    if let sq = aircraft.squawk {
                        Text("·")
                            .foregroundColor(.skyTextDim)
                        Text("SQK \(sq)")
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(.skyTextDim)
                    }
                }
            }

            Spacer()

            Button {
                viewModel.select(nil)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.skyTextSecondary)
                    .frame(width: 32, height: 32)
                    .background(Color.skyCard)
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    // MARK: Status row
    private var flightStatusRow: some View {
        HStack(spacing: 0) {
            StatusPill(
                icon: aircraft.onGround ? "building.2" : "airplane",
                label: aircraft.onGround ? "On Ground" : "Airborne",
                color: aircraft.onGround ? .skyGray : .skyGreen)
            Spacer()
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
        .padding(.horizontal, 4)
    }

    // MARK: Metrics grid
    private var metricsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            MetricCard(
                icon: "cloud",
                value: aircraft.altitudeFeet.map { "\($0.withCommas)" } ?? "—",
                unit: "ft",
                label: "Altitude",
                color: aircraft.altitudeCategory.color)

            MetricCard(
                icon: "speedometer",
                value: aircraft.speedKnots.map { "\($0)" } ?? "—",
                unit: "kts",
                label: "Speed",
                color: .skyAccent)

            MetricCard(
                icon: "arrow.up.and.down",
                value: aircraft.verticalRateFpm.map { abs($0).withCommas } ?? "—",
                unit: "fpm",
                label: aircraft.climbStatus == .climbing ? "Climb" : aircraft.climbStatus == .descending ? "Descent" : "V/Speed",
                color: climbColor)

            MetricCard(
                icon: "location.north",
                value: aircraft.heading.map { String(format: "%.0f°", $0) } ?? "—",
                unit: "",
                label: "Heading",
                color: .skyYellow)

            MetricCard(
                icon: "flag",
                value: aircraft.flightLevel,
                unit: "",
                label: "Flight Level",
                color: .skyText)

            MetricCard(
                icon: "antenna.radiowaves.left.and.right",
                value: aircraft.squawk ?? "—",
                unit: "",
                label: "Squawk",
                color: .skyTextSecondary)
        }
    }

    // MARK: Transponder section
    private var transponderSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("TRANSPONDER")
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundColor(.skyTextDim)
                .tracking(1.5)

            HStack(spacing: 16) {
                DataRow(key: "ICAO24", value: aircraft.id.uppercased())
                Spacer()
                if let lat = aircraft.latitude, let lon = aircraft.longitude {
                    DataRow(key: "Position", value: String(format: "%.3f° %.3f°", lat, lon))
                }
            }
        }
    }

    // MARK: Action buttons
    private var actionButtons: some View {
        HStack(spacing: 12) {
            ActionButton(icon: "location.fill", label: "Centre") {
                viewModel.centerOn(aircraft)
            }

            ActionButton(icon: "arrow.triangle.2.circlepath", label: "Track") {
                viewModel.followUserLocation.toggle()
            }
        }
        .padding(.bottom, 4)
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
                .font(.system(size: 10, weight: .semibold))
        }
        .foregroundColor(climbColor)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(climbColor.opacity(0.15))
        .clipShape(Capsule())
    }
}

// MARK: - Sub-components

struct MetricCard: View {
    let icon: String
    let value: String
    let unit: String
    let label: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 11))
                    .foregroundColor(color.opacity(0.8))
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.skyTextDim)
            }
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundColor(.skyText)
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.skyTextSecondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.skyCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.skyBorder, lineWidth: 1))
    }
}

struct StatusPill: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11))
            Text(label)
                .font(.system(size: 12, weight: .semibold))
        }
        .foregroundColor(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color.opacity(0.12))
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
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundColor(.skyAccent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.skyAccent.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.skyAccent.opacity(0.3), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}
