import SwiftUI

struct SearchOverlayView: View {
    @ObservedObject var viewModel: FlightViewModel
    @Environment(\.dismiss) private var dismiss
    @FocusState private var focused: Bool

    var searchResults: [Aircraft] {
        guard !viewModel.searchQuery.isEmpty else {
            return Array(viewModel.filteredAircraft.prefix(30))
        }
        return viewModel.filteredAircraft
    }

    var body: some View {
        NavigationView {
            ZStack {
                Color.skyBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Search bar
                    searchBar

                    if viewModel.searchQuery.isEmpty {
                        sectionHeader("NEARBY AIRCRAFT")
                    } else {
                        sectionHeader("\(searchResults.count) RESULTS")
                    }

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
                    .foregroundColor(.skyAccent)
                    .fontWeight(.semibold)
                }
            }
            .toolbarBackground(Color.skyCard, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .preferredColorScheme(.dark)
        .onAppear { focused = true }
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.skyTextSecondary)
                .font(.system(size: 16))
            TextField("Callsign, ICAO24, country…", text: $viewModel.searchQuery)
                .font(.system(size: 16))
                .foregroundColor(.skyText)
                .tint(.skyAccent)
                .focused($focused)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.characters)
            if !viewModel.searchQuery.isEmpty {
                Button { viewModel.searchQuery = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.skyTextDim)
                }
            }
        }
        .padding(12)
        .background(Color.skyCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.skyBorder, lineWidth: 1))
        .padding()
    }

    private func sectionHeader(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundColor(.skyTextDim)
                .tracking(1.5)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.bottom, 6)
    }

    private var resultsList: some View {
        List(searchResults) { aircraft in
            SearchResultRow(aircraft: aircraft)
                .listRowBackground(Color.skyCard)
                .listRowSeparatorTint(Color.skyBorder)
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

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "airplane.circle")
                .font(.system(size: 52))
                .foregroundColor(.skyTextDim)
            Text("No flights found")
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.skyTextSecondary)
            Text("Try a different callsign or country")
                .font(.system(size: 14))
                .foregroundColor(.skyTextDim)
            Spacer()
        }
    }
}

struct SearchResultRow: View {
    let aircraft: Aircraft

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(aircraft.altitudeCategory.color.opacity(0.15))
                    .frame(width: 40, height: 40)
                Image(systemName: "airplane")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(aircraft.altitudeCategory.color)
                    .rotationEffect(.degrees(-45))
            }

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 8) {
                    Text(aircraft.displayCallsign)
                        .font(.system(size: 15, weight: .bold, design: .monospaced))
                        .foregroundColor(.skyText)
                    if aircraft.onGround {
                        Text("GND")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.skyGray)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color.skyGray.opacity(0.15))
                            .clipShape(Capsule())
                    }
                }
                HStack(spacing: 10) {
                    Label(aircraft.originCountry, systemImage: "globe")
                        .font(.system(size: 12))
                        .foregroundColor(.skyTextSecondary)
                    if let alt = aircraft.altitudeFeet {
                        Text(aircraft.flightLevel)
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(aircraft.altitudeCategory.color)
                    }
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                if let spd = aircraft.speedKnots {
                    Text("\(spd) kts")
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .foregroundColor(.skyText)
                }
                Image(systemName: aircraft.climbStatus.symbol)
                    .font(.system(size: 12))
                    .foregroundColor(climbColor)
            }
        }
        .padding(.vertical, 4)
    }

    private var climbColor: Color {
        switch aircraft.climbStatus {
        case .climbing:   return .skyGreen
        case .descending: return .skyOrange
        case .level:      return .skyTextDim
        }
    }
}
