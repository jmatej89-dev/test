import SwiftUI

struct StatsBarView: View {
    @ObservedObject var viewModel: FlightViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                LiveBadge()

                divider

                StatChip(
                    icon: "airplane",
                    value: "\(viewModel.visibleCount)",
                    label: "Airborne",
                    color: .skyAccent,
                    glow: true)

                if viewModel.militaryCount > 0 {
                    StatChip(
                        icon: "shield.fill",
                        value: "\(viewModel.militaryCount)",
                        label: "Military",
                        color: .milAmber,
                        glow: true)
                }

                divider

                StatChip(
                    icon: "arrow.up.right",
                    value: "\(viewModel.climbingCount)",
                    label: "Climb",
                    color: .skyGreen)

                StatChip(
                    icon: "arrow.down.right",
                    value: "\(viewModel.descendingCount)",
                    label: "Descend",
                    color: .skyOrange)

                divider

                StatChip(
                    icon: "wind",
                    value: "\(viewModel.averageSpeedKts)",
                    label: "Avg kts",
                    color: .skyYellow)

                StatChip(
                    icon: "cloud",
                    value: viewModel.averageAltitudeFt > 0
                           ? viewModel.averageAltitudeFt.withCommas : "—",
                    label: "Avg ft",
                    color: .skyGray)

                if let t = viewModel.lastUpdate {
                    divider
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 9))
                            .foregroundColor(.skyTextDim)
                        Text(t.relativeShort)
                            .font(.system(size: 10, weight: .600, design: .monospaced))
                            .foregroundColor(.skyTextDim)
                    }
                    .padding(.horizontal, 4)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [Color.skyAccent.opacity(0.18),
                                         Color.skyBorder.opacity(0.6),
                                         Color.skyBorder.opacity(0.3)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing),
                            lineWidth: 1)
                )
        )
        .shadow(color: Color.black.opacity(0.4), radius: 18, y: 8)
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.skyBorder)
            .frame(width: 1, height: 24)
    }
}

// MARK: - Live badge

struct LiveBadge: View {
    @State private var pulse = false

    var body: some View {
        HStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(Color.skyGreen.opacity(0.28))
                    .frame(width: 16, height: 16)
                    .scaleEffect(pulse ? 2.2 : 1)
                    .opacity(pulse ? 0 : 0.6)
                    .animation(.easeOut(duration: 1.6).repeatForever(autoreverses: false), value: pulse)
                Circle()
                    .fill(Color.skyGreen)
                    .frame(width: 7, height: 7)
                    .shadow(color: Color.skyGreen.opacity(0.7), radius: 3)
            }
            Text("LIVE")
                .font(.system(size: 10, weight: .900, design: .monospaced))
                .foregroundColor(.skyGreen)
                .tracking(2)
        }
        .onAppear { pulse = true }
    }
}

// MARK: - Stat chip

struct StatChip: View {
    let icon:  String
    let value: String
    let label: String
    let color: Color
    var glow:  Bool = false

    var body: some View {
        HStack(spacing: 7) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.12))
                    .frame(width: 26, height: 26)
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(color)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.system(size: 14, weight: .800, design: .rounded))
                    .foregroundColor(.skyText)
                    .monospacedDigit()
                    .contentTransition(.numericText())
                    .animation(.spring(response: 0.4, dampingFraction: 0.75), value: value)
                Text(label)
                    .font(.system(size: 9, weight: .600))
                    .foregroundColor(.skyTextDim)
                    .tracking(.5)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(
            RoundedRectangle(cornerRadius: 9)
                .fill(color.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 9)
                        .stroke(color.opacity(glow ? 0.22 : 0.1), lineWidth: 1)
                )
        )
        .shadow(color: glow ? color.opacity(0.2) : .clear, radius: 6)
    }
}
