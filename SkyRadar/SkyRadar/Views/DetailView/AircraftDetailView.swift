import SwiftUI

struct AircraftDetailView: View {
    let aircraft: Aircraft
    @ObservedObject var viewModel: FlightViewModel
    @State private var expanded = false
    @State private var appeared = false

    var isMil:       Bool  { aircraft.isMilitary }
    var accentColor: Color { isMil ? .milAmber : .skyAccent }

    var body: some View {
        VStack(spacing: 0) {
            // ── Drag handle ──────────────────────────────
            Capsule()
                .fill(Color.skyBorder)
                .frame(width: 38, height: 4)
                .padding(.top, 10)
                .onTapGesture { withAnimation(.spring(response: 0.38, dampingFraction: 0.8)) { expanded.toggle() } }

            // ── Photo ────────────────────────────────────
            photoSection
                .frame(height: expanded ? 210 : 140)
                .animation(.spring(response: 0.42, dampingFraction: 0.82), value: expanded)

            // ── Aircraft header ──────────────────────────
            headerSection

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    if isMil { militaryBanner }

                    Divider().overlay(Color.skyBorder).padding(.horizontal, 14)

                    statusRow.padding(.vertical, 10).padding(.horizontal, 14)

                    Divider().overlay(Color.skyBorder).padding(.horizontal, 14)

                    metricsGrid.padding(12)

                    if expanded {
                        Divider().overlay(Color.skyBorder).padding(.horizontal, 14)
                        transponderRow.padding(.horizontal, 14).padding(.vertical, 10)
                    }

                    actionRow.padding(.horizontal, 12).padding(.bottom, 14).padding(.top, 4)
                }
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.skyCard)
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    isMil ? Color.milAmber.opacity(0.35) : Color.skyAccent.opacity(0.2),
                                    Color.skyBorder.opacity(0.6),
                                    Color.skyBorder.opacity(0.3)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing),
                            lineWidth: 1)
                )
        )
        .shadow(color: Color.black.opacity(0.55), radius: 28, y: 12)
        .padding(.horizontal, 8)
        .frame(maxHeight: expanded ? 640 : 420)
        .gesture(
            DragGesture(minimumDistance: 18)
                .onEnded { g in
                    withAnimation(.spring(response: 0.38, dampingFraction: 0.82)) {
                        if g.translation.height < -44 { expanded = true  }
                        else if g.translation.height > 44 {
                            if expanded { expanded = false }
                            else { viewModel.select(nil) }
                        }
                    }
                }
        )
        .padding(.bottom, 16)
        .onAppear {
            withAnimation(.spring(response: 0.55, dampingFraction: 0.75).delay(0.05)) {
                appeared = true
            }
        }
    }

    // MARK: Photo

    private var photoSection: some View {
        ZStack(alignment: .bottomLeading) {
            AircraftPhotoView(icao24: aircraft.id)

            // Gradient overlay
            LinearGradient(
                colors: [Color.skyCard, Color.skyCard.opacity(0)],
                startPoint: .bottom,
                endPoint: .top)
            .frame(height: 70)
            .frame(maxWidth: .infinity, alignment: .bottom)
        }
    }

    // MARK: Header

    private var headerSection: some View {
        HStack(alignment: .center, spacing: 12) {
            // Plane icon with accent ring
            ZStack {
                Circle()
                    .fill(accentColor.opacity(0.1))
                    .frame(width: 48, height: 48)
                Circle()
                    .strokeBorder(
                        LinearGradient(colors: [accentColor.opacity(0.45), accentColor.opacity(0.1)],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
                        lineWidth: 1.2)
                    .frame(width: 48, height: 48)
                Image(systemName: "airplane")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(accentColor)
                    .rotationEffect(.degrees(-45))
                    .scaleEffect(appeared ? 1 : 0.5)
                    .animation(.spring(response: 0.4, dampingFraction: 0.65).delay(0.1), value: appeared)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(aircraft.displayCallsign)
                        .font(.system(size: 20, weight: .heavy, design: .monospaced))
                        .foregroundColor(.skyText)
                        .lineLimit(1)
                    climbBadge
                }
                HStack(spacing: 5) {
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
                        Text("·")
                            .foregroundColor(.skyTextDim)
                        Text("SQK \(sq)")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.skyTextDim)
                    }
                }
            }

            Spacer()

            // Close / expand
            VStack(spacing: 7) {
                Button { viewModel.select(nil) } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.skyTextSecondary)
                        .frame(width: 30, height: 30)
                        .background(Color.skyCardSecondary)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.skyBorder, lineWidth: 1))
                }
                Button { withAnimation(.spring()) { expanded.toggle() } } label: {
                    Image(systemName: expanded ? "chevron.down" : "chevron.up")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.skyTextDim)
                        .frame(width: 30, height: 30)
                        .background(Color.skyCardSecondary)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.skyBorder, lineWidth: 1))
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
    }

    // MARK: Military banner

    private var militaryBanner: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(Color.milAmber.opacity(0.15))
                    .frame(width: 30, height: 30)
                Image(systemName: "shield.fill")
                    .font(.system(size: 13))
                    .foregroundColor(.milAmber)
            }
            if let info = aircraft.aircraftClass.militaryInfo {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(info.flag) \(info.branch)")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.milAmber)
                    Text(info.country)
                        .font(.system(size: 11))
                        .foregroundColor(.milAmber.opacity(0.7))
                }
            }
            Spacer()
            Text("MILITARY AIRCRAFT")
                .font(.system(size: 8.5, weight: .black, design: .monospaced))
                .foregroundColor(.milAmber.opacity(0.7))
                .tracking(1.2)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.milAmber.opacity(0.1))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.milAmber.opacity(0.22), lineWidth: 1))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            LinearGradient(
                colors: [Color.milAmber.opacity(0.09), Color.milAmber.opacity(0.04)],
                startPoint: .leading, endPoint: .trailing)
        )
        .overlay(
            Rectangle().fill(Color.milAmber.opacity(0.25)).frame(height: 1),
            alignment: .bottom)
    }

    // MARK: Status row

    private var statusRow: some View {
        HStack(spacing: 7) {
            StatusPill(
                icon: aircraft.onGround ? "building.2" : "airplane",
                label: aircraft.onGround ? "On Ground" : "Airborne",
                color: aircraft.onGround ? .skyGray : .skyGreen)
            StatusPill(
                icon: aircraft.climbStatus.symbol,
                label: aircraft.climbStatus.label,
                color: climbColor)
            Spacer()
            StatusPill(icon: "clock", label: aircraft.lastContact.relativeShort, color: .skyTextDim)
        }
    }

    // MARK: Metrics grid

    private var metricsGrid: some View {
        LazyVGrid(columns: Array(repeating: .init(.flexible(), spacing: 7), count: 3), spacing: 7) {
            MetricCard(
                icon: "cloud",
                value: aircraft.altitudeFeet.map { "\($0.withCommas)" } ?? "—",
                unit: "ft", label: "Altitude",
                color: isMil ? .milAmber : aircraft.altitudeCategory.color,
                index: 0, appeared: appeared)

            MetricCard(
                icon: "wind",
                value: aircraft.speedKnots.map { "\($0)" } ?? "—",
                unit: "kts", label: "Speed",
                color: accentColor,
                index: 1, appeared: appeared)

            MetricCard(
                icon: "arrow.up.and.down",
                value: aircraft.verticalRateFpm.map { abs($0).withCommas } ?? "—",
                unit: "fpm", label: vLabel,
                color: climbColor,
                index: 2, appeared: appeared)

            HeadingCard(heading: aircraft.heading, index: 3, appeared: appeared)

            MetricCard(
                icon: "flag.checkered",
                value: aircraft.flightLevel,
                unit: "", label: "Flight Level",
                color: .skyText,
                index: 4, appeared: appeared)

            MetricCard(
                icon: "antenna.radiowaves.left.and.right",
                value: aircraft.squawk ?? "—",
                unit: "", label: "Squawk",
                color: .skyTextSecondary,
                index: 5, appeared: appeared)
        }
    }

    // MARK: Transponder row

    private var transponderRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                DataRow(key: "ICAO24", value: aircraft.id.uppercased())
                Spacer()
                if let lat = aircraft.latitude, let lon = aircraft.longitude {
                    DataRow(key: "Position",
                            value: String(format: "%.4f° %.4f°", lat, lon))
                }
            }
        }
    }

    // MARK: Actions

    private var actionRow: some View {
        HStack(spacing: 9) {
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
        case .descending: return "Descent"
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
        HStack(spacing: 4) {
            Image(systemName: aircraft.climbStatus.symbol)
                .font(.system(size: 9.5))
            Text(aircraft.climbStatus.label)
                .font(.system(size: 9.5, weight: .bold))
        }
        .foregroundColor(climbColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(climbColor.opacity(0.12))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(climbColor.opacity(0.2), lineWidth: 1))
    }
}

// MARK: - Heading card with mini compass

struct HeadingCard: View {
    let heading:  Double?
    let index:    Int
    let appeared: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 4) {
                Image(systemName: "location.north.fill")
                    .font(.system(size: 9))
                    .foregroundColor(Color.skyYellow.opacity(0.7))
                Text("Heading")
                    .font(.system(size: 8.5, weight: .700))
                    .foregroundColor(.skyTextDim)
            }
            HStack(alignment: .center, spacing: 8) {
                // Compass rose
                ZStack {
                    Circle()
                        .stroke(Color.skyBorder, lineWidth: 1)
                        .frame(width: 30, height: 30)
                    // Cardinal ticks
                    ForEach(0..<8, id: \.self) { i in
                        Rectangle()
                            .fill(i % 2 == 0 ? Color.skyBorder : Color.skyBorder.opacity(0.5))
                            .frame(width: 1, height: i % 2 == 0 ? 4 : 3)
                            .offset(y: -12)
                            .rotationEffect(.degrees(Double(i) * 45))
                    }
                    // Needle
                    if let h = heading {
                        Triangle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.skyYellow, Color.skyOrange],
                                    startPoint: .top, endPoint: .bottom))
                            .frame(width: 4, height: 10)
                            .offset(y: -5)
                            .rotationEffect(.degrees(h))
                            .shadow(color: Color.skyYellow.opacity(0.5), radius: 2)
                    }
                    // Center dot
                    Circle()
                        .fill(Color.skyBorder)
                        .frame(width: 3, height: 3)
                }

                Text(heading.map { String(format: "%.0f°", $0) } ?? "—")
                    .font(.system(size: 14, weight: .800, design: .rounded))
                    .foregroundColor(.skyText)
                    .monospacedDigit()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.skyBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.skyBorder, lineWidth: 1))
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 10)
        .animation(
            .spring(response: 0.42, dampingFraction: 0.78)
                .delay(Double(index) * 0.06 + 0.08),
            value: appeared)
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.midX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        p.closeSubpath()
        return p
    }
}

// MARK: - Shared sub-components

struct MetricCard: View {
    let icon:     String
    let value:    String
    let unit:     String
    let label:    String
    let color:    Color
    let index:    Int
    let appeared: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 9))
                    .foregroundColor(color.opacity(0.7))
                Text(label)
                    .font(.system(size: 8.5, weight: .700))
                    .foregroundColor(.skyTextDim)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 15, weight: .800, design: .rounded))
                    .foregroundColor(color)
                    .monospacedDigit()
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 9, weight: .600))
                        .foregroundColor(.skyTextDim)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.skyBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(color.opacity(0.18), lineWidth: 1))
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 10)
        .animation(
            .spring(response: 0.42, dampingFraction: 0.78)
                .delay(Double(index) * 0.06 + 0.08),
            value: appeared)
    }
}

struct StatusPill: View {
    let icon:  String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 10))
            Text(label).font(.system(size: 11, weight: .700))
        }
        .foregroundColor(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(color.opacity(0.1))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(color.opacity(0.2), lineWidth: 1))
    }
}

struct DataRow: View {
    let key:   String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(key)
                .font(.system(size: 9.5, weight: .600))
                .foregroundColor(.skyTextDim)
                .tracking(.5)
                .textCase(.uppercase)
            Text(value)
                .font(.system(size: 13, weight: .700, design: .monospaced))
                .foregroundColor(.skyText)
        }
    }
}

struct ActionButton: View {
    let icon:   String
    let label:  String
    let accent: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 7) {
                Image(systemName: icon).font(.system(size: 13))
                Text(label).font(.system(size: 13, weight: .700))
            }
            .foregroundColor(accent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                LinearGradient(
                    colors: [accent.opacity(0.12), accent.opacity(0.07)],
                    startPoint: .top, endPoint: .bottom))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .overlay(RoundedRectangle(cornerRadius: 11).stroke(accent.opacity(0.28), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}
