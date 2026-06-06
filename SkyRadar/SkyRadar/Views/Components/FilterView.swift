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

                        // Military section
                        FilterSection(title: "MILITARY AIRCRAFT") {
                            VStack(spacing: 8) {
                                ToggleRow(label: "Show military aircraft",
                                          icon: "shield.fill",
                                          tint: .milAmber,
                                          isOn: $viewModel.showMilitary)
                                ToggleRow(label: "Military only mode",
                                          icon: "scope",
                                          tint: .milAmber,
                                          isOn: $viewModel.onlyMilitary)
                            }
                        }

                        // Ground
                        FilterSection(title: "GROUND TRAFFIC") {
                            ToggleRow(label: "Show aircraft on ground",
                                      icon: "airplane.arrival",
                                      tint: .skyAccent,
                                      isOn: $viewModel.showOnGround)
                        }

                        // Altitude
                        FilterSection(title: "ALTITUDE BAND") {
                            VStack(spacing: 8) {
                                ForEach(AltitudeFilter.allCases) { f in
                                    FilterRow(label: f.rawValue, isSelected: viewModel.altitudeFilter == f) {
                                        viewModel.altitudeFilter = f
                                    }
                                }
                            }
                        }

                        // Country
                        if !viewModel.countries.isEmpty {
                            FilterSection(title: "COUNTRY OF ORIGIN") {
                                VStack(spacing: 8) {
                                    FilterRow(label: "All countries",
                                              isSelected: viewModel.countryFilter.isEmpty) {
                                        viewModel.countryFilter = ""
                                    }
                                    ForEach(viewModel.countries.prefix(25), id: \.self) { c in
                                        FilterRow(label: c, isSelected: viewModel.countryFilter == c) {
                                            viewModel.countryFilter = viewModel.countryFilter == c ? "" : c
                                        }
                                    }
                                }
                            }
                        }

                        // Legend
                        FilterSection(title: "COLOUR LEGEND") {
                            VStack(alignment: .leading, spacing: 10) {
                                AltLegendRow(color: .milAmber,  label: "Military aircraft")
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
                        .foregroundColor(.skyAccent).fontWeight(.semibold)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") {
                        viewModel.altitudeFilter = .all
                        viewModel.showOnGround   = false
                        viewModel.showMilitary   = true
                        viewModel.onlyMilitary   = false
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

// MARK: - Sub-components

struct FilterSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 10, weight: .bold, design: .monospaced))
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
                    .font(.system(size: 14, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? .skyAccent : .skyText)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.skyAccent)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(isSelected ? Color.skyAccent.opacity(0.09) : Color.skyCard)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10)
                .stroke(isSelected ? Color.skyAccent.opacity(0.35) : Color.skyBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct ToggleRow: View {
    let label: String
    let icon: String
    let tint: Color
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(tint)
                .frame(width: 22)
            Toggle(label, isOn: $isOn)
                .font(.system(size: 14))
                .foregroundColor(.skyText)
                .toggleStyle(SwitchToggleStyle(tint: tint))
        }
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
            Image(systemName: "airplane")
                .font(.system(size: 11))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(.skyTextSecondary)
        }
    }
}
