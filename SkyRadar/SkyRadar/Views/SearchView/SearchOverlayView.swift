import SwiftUI

struct SearchOverlayView: View {
    @ObservedObject var viewModel: FlightViewModel
    @Environment(\.dismiss) private var dismiss
    @FocusState private var focused: Bool

    var searchResults: [Aircraft] {
        guard !viewModel.searchQuery.isEmpty else {
            return Array(viewModel.filteredAircraft.prefix(40))
        }
        return viewModel.filteredAircraft
    }

    var body: some View {
        NavigationView {
            ZStack {
                Color.skyBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    searchBar
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        .padding(.bottom, 4)

                    // Section header
                    HStack {
                        Text(viewModel.searchQuery.isEmpty
                             ? "NEARBY AIRCRAFT"
                             : "\(searchResults.count) RESULT\(searchResults.count == 1 ? "" : "S")")
                            .font(.system(size: 10, weight: .800, design: .monospaced))
                            .foregroundColor(.skyTextDim)
                            .tracking(2)
                        Spacer()
                        if !viewModel.searchQuery.isEmpty {
                            Button { viewModel.searchQuery = "" } label: {
                                Text("Clear")
                                    .font(.system(size: 12, weight: .600))
                                    .foregroundColor(.skyAccent)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)

                    if searchResults.isEmpty {
                        emptyState
                    } else {
                        resultsList
                    }
                }
            }
            .navigationTitle("Search Flights")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        viewModel.searchQuery = ""
                        dismiss()
                    }
                    .font(.system(size: 14, weight: .700))
                    .foregroundColor(.skyAccent)
                }
            }
            .toolbarBackground(Color.skyCard, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .preferredColorScheme(.dark)
        .onAppear { focused = true }
    }

    // MARK: Search bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.skyTextSecondary)
                .font(.system(size: 15))
            TextField("Callsign, ICAO24, country…", text: $viewModel.searchQuery)
                .font(.system(size: 15))
                .foregroundColor(.skyText)
                .tint(.skyAccent)
                .focused($focused)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.characters)
            if !viewModel.searchQuery.isEmpty {
                Button {
                    withAnimation(.spring(response: 0.25)) { viewModel.searchQuery = "" }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.skyTextDim)
                        .font(.system(size: 16))
                }
            }
        }
        .padding(12)
        .background(Color.skyCard)
        .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous)
            .stroke(Color.skyBorder, lineWidth: 1))
    }

    // MARK: Results list

    private var resultsList: some View {
        List(searchResults) { aircraft in
            SearchResultRow(aircraft: aircraft, query: viewModel.searchQuery)
                .listRowBackground(Color.skyCard)
                .listRowSeparatorTint(Color.skyBorder)
                .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
                .onTapGesture {
                    viewModel.select(aircraft)
                    viewModel.centerOn(aircraft)
                    viewModel.searchQuery = ""
                    dismiss()
                }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
    }

    // MARK: Empty state

    private var emptyState: some View {
        VStack(spacing: 18) {
            Spacer()
            ZStack {
                Circle()
                    .fill(Color.skyAccent.opacity(0.07))
                    .frame(width: 80, height: 80)
                Image(systemName: "airplane.circle")
                    .font(.system(size: 44))
                    .foregroundColor(.skyTextDim)
            }
            VStack(spacing: 6) {
                Text("No flights found")
                    .font(.system(size: 17, weight: .700))
                    .foregroundColor(.skyTextSecondary)
                Text("Try a different callsign, ICAO or country")
                    .font(.system(size: 14))
                    .foregroundColor(.skyTextDim)
                    .multilineTextAlignment(.center)
            }
            Spacer()
        }
        .padding()
    }
}

// MARK: - Search result row

struct SearchResultRow: View {
    let aircraft: Aircraft
    let query:    String

    var body: some View {
        HStack(spacing: 13) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(aircraft.altitudeCategory.color.opacity(0.12))
                    .frame(width: 42, height: 42)
                Image(systemName: "airplane")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(aircraft.altitudeCategory.color)
                    .rotationEffect(.degrees(-45))
                if aircraft.isMilitary {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.milAmber)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                        .padding(4)
                }
            }
            .frame(width: 42, height: 42)

            // Info
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 7) {
                    Text(aircraft.displayCallsign)
                        .font(.system(size: 15, weight: .800, design: .monospaced))
                        .foregroundColor(aircraft.isMilitary ? .milAmber : .skyText)
                    if aircraft.isMilitary {
                        Text("MIL")
                            .font(.system(size: 8.5, weight: .900))
                            .foregroundColor(.milAmber)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color.milAmber.opacity(0.12))
                            .clipShape(Capsule())
                    }
                    if aircraft.onGround {
                        Text("GND")
                            .font(.system(size: 8.5, weight: .900))
                            .foregroundColor(.skyGray)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color.skyGray.opacity(0.12))
                            .clipShape(Capsule())
                    }
                }
                HStack(spacing: 8) {
                    Label(aircraft.originCountry, systemImage: "globe")
                        .font(.system(size: 12))
                        .foregroundColor(.skyTextSecondary)
                        .lineLimit(1)
                    if aircraft.altitudeFeet != nil {
                        Text(aircraft.flightLevel)
                            .font(.system(size: 12, weight: .600, design: .monospaced))
                            .foregroundColor(aircraft.altitudeCategory.color)
                    }
                }
            }

            Spacer()

            // Speed + climb
            VStack(alignment: .trailing, spacing: 4) {
                if let spd = aircraft.speedKnots {
                    Text("\(spd) kts")
                        .font(.system(size: 12, weight: .700, design: .monospaced))
                        .foregroundColor(.skyText)
                }
                Image(systemName: aircraft.climbStatus.symbol)
                    .font(.system(size: 12))
                    .foregroundColor(climbColor)
            }
        }
        .padding(.vertical, 10)
    }

    private var climbColor: Color {
        switch aircraft.climbStatus {
        case .climbing:   return .skyGreen
        case .descending: return .skyOrange
        case .level:      return .skyTextDim
        }
    }
}
