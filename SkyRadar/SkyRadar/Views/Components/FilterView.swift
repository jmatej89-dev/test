import SwiftUI

struct FilterView: View {
    @ObservedObject var viewModel: FlightViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Color.skyBackground.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {

                        // Altitude filter
                        FilterSection(title: "ALTITUDE") {
                            VStack(spacing: 8) {
                                ForEach(AltitudeFilter.allCases) { filter in
                                    FilterRow(
                                        label: filter.rawValue,
                                        isSelected: viewModel.altitudeFilter == filter
                                    ) {
                                        viewModel.altitudeFilter = filter
                                    }
                                }
                            }
                        }

                        // Ground traffic
                        FilterSection(title: "GROUND TRAFFIC") {
                            ToggleRow(
                                label: "Show aircraft on ground",
                                isOn: $viewModel.showOnGround)
                        }

                        // Country filter
                        if !viewModel.countries.isEmpty {
                            FilterSection(title: "COUNTRY OF ORIGIN") {
                                VStack(spacing: 8) {
                                    FilterRow(
                                        label: "All countries",
                                        isSelected: viewModel.countryFilter.isEmpty
                                    ) {
                                        viewModel.countryFilter = ""
                                    }

                                    ForEach(viewModel.countries.prefix(20), id: \.self) { country in
                                        FilterRow(
                                            label: country,
                                            isSelected: viewModel.countryFilter == country
                                        ) {
                                            viewModel.countryFilter =
                                                viewModel.countryFilter == country ? "" : country
                                        }
                                    }
                                }
                            }
                        }

                        // Legend
                        FilterSection(title: "ALTITUDE COLOURS") {
                            VStack(alignment: .leading, spacing: 10) {
                                AltLegendRow(color: .skyGray,   label: "Ground / parked")
                                AltLegendRow(color: .skyOrange, label: "Low   < 10 000 ft")
                                AltLegendRow(color: .skyYellow, label: "Mid   10–35 000 ft")
                                AltLegendRow(color: .skyAccent, label: "High  > 35 000 ft")
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.skyAccent)
                        .fontWeight(.semibold)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") {
                        viewModel.altitudeFilter = .all
                        viewModel.showOnGround   = false
                        viewModel.countryFilter  = ""
                    }
                    .foregroundColor(.skyTextSecondary)
                }
            }
            .toolbarBackground(Color.skyCard, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - Subviews

struct FilterSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundColor(.skyTextDim)
                .tracking(1.5)
            content
        }
    }
}

struct FilterRow: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Text(label)
                    .font(.system(size: 15, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? .skyAccent : .skyText)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.skyAccent)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(isSelected ? Color.skyAccent.opacity(0.1) : Color.skyCard)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isSelected ? Color.skyAccent.opacity(0.4) : Color.skyBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct ToggleRow: View {
    let label: String
    @Binding var isOn: Bool

    var body: some View {
        Toggle(label, isOn: $isOn)
            .font(.system(size: 15))
            .foregroundColor(.skyText)
            .toggleStyle(SwitchToggleStyle(tint: .skyAccent))
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.skyCard)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.skyBorder, lineWidth: 1))
    }
}

struct AltLegendRow: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(.skyTextSecondary)
        }
    }
}
