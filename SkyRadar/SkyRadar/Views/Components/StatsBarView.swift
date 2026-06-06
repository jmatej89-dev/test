import SwiftUI

struct StatsBarView: View {
    @ObservedObject var viewModel: FlightViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                LiveBadge()

                divider

                StatChip(icon: "airplane",      value: "\(viewModel.visibleCount)",
                         label: "Airborne",  color: .skyAccent)

                if viewModel.militaryCount > 0 {
                    StatChip(icon: "shield.fill", value: "\(viewModel.militaryCount)",
                             label: "Military", color: .milAmber)
                }

                divider

                StatChip(icon: "arrow.up.right", value: "\(viewModel.climbingCount)",
                         label: "Climb",     color: .skyGreen)

                StatChip(icon: "arrow.down.right", value: "\(viewModel.descendingCount)",
                         label: "Descend",   color: .skyOrange)

                divider

                StatChip(icon: "speedometer",   value: "\(viewModel.averageSpeedKts)",
                         label: "Avg kts",   color: .skyYellow)

                StatChip(icon: "cloud",         value: "\(viewModel.averageAltitudeFt.withCommas)",
                         label: "Avg ft",    color: .skyTextSecondary)

                if let t = viewModel.lastUpdate {
                    divider
                    HStack(spacing: 4) {
                        Image(systemName: "clock").font(.system(size: 10))
                        Text(t.relativeShort)
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                    }
                    .foregroundColor(.skyTextDim)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
        }
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.skyBorder, lineWidth: 1))
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.skyBorder)
            .frame(width: 1, height: 26)
    }
}

struct LiveBadge: View {
    @State private var ring = false

    var body: some View {
        HStack(spacing: 5) {
            ZStack {
                Circle()
                    .fill(Color.skyGreen.opacity(0.3))
                    .frame(width: 14, height: 14)
                    .scaleEffect(ring ? 1.9 : 1)
                    .opacity(ring ? 0 : 0.7)
                    .animation(.easeOut(duration: 1.5).repeatForever(autoreverses: false), value: ring)
                Circle()
                    .fill(Color.skyGreen)
                    .frame(width: 7, height: 7)
            }
            Text("LIVE")
                .font(.system(size: 10, weight: .black, design: .monospaced))
                .foregroundColor(.skyGreen)
                .tracking(1.5)
        }
        .onAppear { ring = true }
    }
}

struct StatChip: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(color)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(.skyText)
                Text(label)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.skyTextDim)
            }
        }
    }
}
