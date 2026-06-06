import SwiftUI

struct StatsBarView: View {
    @ObservedObject var viewModel: FlightViewModel
    @State private var pulse = false

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                // Live badge
                liveBadge

                Divider()
                    .frame(height: 28)
                    .overlay(Color.skyBorder)

                StatChip(
                    icon: "airplane",
                    value: "\(viewModel.visibleCount)",
                    label: "Airborne",
                    color: .skyAccent)

                StatChip(
                    icon: "arrow.up.right",
                    value: "\(viewModel.climbingCount)",
                    label: "Climbing",
                    color: .skyGreen)

                StatChip(
                    icon: "arrow.down.right",
                    value: "\(viewModel.descendingCount)",
                    label: "Descending",
                    color: .skyOrange)

                StatChip(
                    icon: "speedometer",
                    value: "\(viewModel.averageSpeedKts)",
                    label: "Avg kts",
                    color: .skyYellow)

                StatChip(
                    icon: "cloud",
                    value: "\(viewModel.averageAltitudeFt.withCommas)",
                    label: "Avg ft",
                    color: .skyTextSecondary)

                if let t = viewModel.lastUpdate {
                    Divider()
                        .frame(height: 28)
                        .overlay(Color.skyBorder)

                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                            .foregroundColor(.skyTextDim)
                        Text(t.relativeShort)
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundColor(.skyTextDim)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
        }
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.skyBorder, lineWidth: 1))
    }

    private var liveBadge: some View {
        HStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(Color.skyGreen.opacity(0.25))
                    .frame(width: 16, height: 16)
                    .scaleEffect(pulse ? 1.6 : 1.0)
                    .opacity(pulse ? 0 : 0.6)
                    .animation(.easeOut(duration: 1.2).repeatForever(autoreverses: false), value: pulse)
                Circle()
                    .fill(Color.skyGreen)
                    .frame(width: 7, height: 7)
            }
            Text("LIVE")
                .font(.system(size: 10, weight: .black, design: .monospaced))
                .foregroundColor(.skyGreen)
                .tracking(1.5)
        }
        .onAppear { pulse = true }
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
