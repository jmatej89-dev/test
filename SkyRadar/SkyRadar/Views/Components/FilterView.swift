import SwiftUI

struct FilterView: View {
    @ObservedObject var viewModel: FlightViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Color.skyBackground.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 22) {

                        // ── Military ──────────────────────────────
                        FilterSection(
                            title: "MILITARY AIRCRAFT",
                            icon: "shield.fill",
                            iconColor: .milAmber
                        ) {
                            VStack(spacing: 1) {
                                ToggleRow(label: "Show military aircraft",
                                          icon: "shield.fill",
                                          tint: .milAmber,
                                          isOn: $viewModel.showMilitary)
                                Divider().overlay(Color.skyBorder).padding(.leading, 44)
                                ToggleRow(label: "Military only mode",
                                          icon: "scope",
                                          tint: .milAmber,
                                          isOn: $viewModel.onlyMilitary)
                            }
                            .background(Color.skyCard)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.skyBorder, lineWidth: 1))
                        }

                        // ── Ground ────────────────────────────────
                        FilterSection(
                            title: "GROUND TRAFFIC",
                            icon: "airplane.arrival",
                            iconColor: .skyAccent
                        ) {
                            ToggleRow(label: "Show aircraft on ground",
                                      icon: "airplane.arrival",
                                      tint: .skyAccent,
                                      isOn: $viewModel.showOnGround)
                            .background(Color.skyCard)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.skyBorder, lineWidth: 1))
                        }

                        // ── Altitude ──────────────────────────────
                        FilterSection(
                            title: "ALTITUDE BAND",
                            icon: "cloud",
                            iconColor: .skyAccent
                        ) {
                            VStack(spacing: 1) {
                                ForEach(Array(AltitudeFilter.allCases.enumerated()),
                                        id: \.element.id) { i, f in
                                    FilterRow(
                                        label: f.rawValue,
                                        dot:   altBandColor(f),
                                        isSelected: viewModel.altitudeFilter == f
                                    ) { viewModel.altitudeFilter = f }

                                    if i < AltitudeFilter.allCases.count - 1 {
                                        Divider().overlay(Color.skyBorder).padding(.leading, 44)
                                    }
                                }
                            }
                            .background(Color.skyCard)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.skyBorder, lineWidth: 1))
                        }

                        // ── Country ───────────────────────────────
                        if !viewModel.countries.isEmpty {
                            FilterSection(
                                title: "COUNTRY OF ORIGIN",
                                icon: "globe",
                                iconColor: .skyAccent
                            ) {
                                VStack(spacing: 1) {
                                    FilterRow(label: "All countries",
                                              dot: nil,
                                              isSelected: viewModel.countryFilter.isEmpty) {
                                        viewModel.countryFilter = ""
                                    }
                                    ForEach(viewModel.countries.prefix(25), id: \.self) { c in
                                        Divider().overlay(Color.skyBorder).padding(.leading, 44)
                                        FilterRow(label: c, dot: nil,
                                                  isSelected: viewModel.countryFilter == c) {
                                            viewModel.countryFilter = viewModel.countryFilter == c ? "" : c
                                        }
                                    }
                                }
                                .background(Color.skyCard)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color.skyBorder, lineWidth: 1))
                            }
                        }

                        // ── Legend ────────────────────────────────
                        FilterSection(
                            title: "COLOUR LEGEND",
                            icon: "paintpalette",
                            iconColor: .skyTextSecondary
                        ) {
                            VStack(alignment: .leading, spacing: 0) {
                                legendItem(color: .milAmber,  icon: "shield.fill",   label: "Military aircraft")
                                Divider().overlay(Color.skyBorder).padding(.leading, 44)
                                legendItem(color: .skyGray,   icon: "building.2",    label: "Ground / parked")
                                Divider().overlay(Color.skyBorder).padding(.leading, 44)
                                legendItem(color: .skyOrange, icon: "arrow.down.to.line", label: "Low  < 10 000 ft")
                                Divider().overlay(Color.skyBorder).padding(.leading, 44)
                                legendItem(color: .skyYellow, icon: "minus",         label: "Mid  10–35 000 ft")
                                Divider().overlay(Color.skyBorder).padding(.leading, 44)
                                legendItem(color: .skyAccent, icon: "arrow.up.to.line", label: "High  > 35 000 ft")
                            }
                            .background(Color.skyCard)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.skyBorder, lineWidth: 1))
                        }
                    }
                    .padding()
                    .padding(.bottom, 8)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 14, weight: .700))
                        .foregroundColor(.skyAccent)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") {
                        viewModel.altitudeFilter = .all
                        viewModel.showOnGround   = false
                        viewModel.showMilitary   = true
                        viewModel.onlyMilitary   = false
                        viewModel.countryFilter  = ""
                    }
                    .font(.system(size: 14))
                    .foregroundColor(.skyTextSecondary)
                }
            }
            .toolbarBackground(Color.skyCard, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .preferredColorScheme(.dark)
    }

    // MARK: Legend row

    private func legendItem(color: Color, icon: String, label: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.14))
                    .frame(width: 30, height: 30)
                Image(systemName: "airplane")
                    .font(.system(size: 14))
                    .foregroundColor(color)
                    .rotationEffect(.degrees(-45))
            }
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.skyText)
            Spacer()
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
                .shadow(color: color.opacity(0.6), radius: 3)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
    }

    // MARK: Altitude band colour

    private func altBandColor(_ f: AltitudeFilter) -> Color? {
        switch f {
        case .all:    return nil
        case .low:    return .skyOrange
        case .medium: return .skyYellow
        case .high:   return .skyAccent
        }
    }
}

// MARK: - Sub-components

struct FilterSection<Content: View>: View {
    let title:      String
    let icon:       String
    let iconColor:  Color
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 7) {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(iconColor)
                Text(title)
                    .font(.system(size: 10, weight: .800, design: .monospaced))
                    .foregroundColor(.skyTextDim)
                    .tracking(1.8)
            }
            content
        }
    }
}

struct FilterRow: View {
    let label:      String
    let dot:        Color?
    let isSelected: Bool
    let action:     () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                // Radio circle
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.skyAccent : Color.skyBorder, lineWidth: 1.5)
                        .frame(width: 20, height: 20)
                    if isSelected {
                        Circle()
                            .fill(Color.skyAccent)
                            .frame(width: 10, height: 10)
                    }
                }

                if let c = dot {
                    Circle()
                        .fill(c)
                        .frame(width: 8, height: 8)
                        .shadow(color: c.opacity(0.6), radius: 2)
                }

                Text(label)
                    .font(.system(size: 14, weight: isSelected ? .600 : .regular))
                    .foregroundColor(isSelected ? .skyAccent : .skyText)

                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
        .background(isSelected ? Color.skyAccent.opacity(0.06) : Color.clear)
    }
}

struct ToggleRow: View {
    let label: String
    let icon:  String
    let tint:  Color
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(tint.opacity(0.12))
                    .frame(width: 30, height: 30)
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(tint)
            }
            Toggle(label, isOn: $isOn)
                .font(.system(size: 14))
                .foregroundColor(.skyText)
                .tint(tint)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }
}
