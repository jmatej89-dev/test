import SwiftUI

struct AircraftPhotoView: View {
    let icao24: String
    @State private var photo: AircraftPhoto? = nil
    @State private var state: LoadState = .idle

    enum LoadState { case idle, loading, loaded, failed }

    var body: some View {
        ZStack {
            switch state {
            case .idle, .loading:
                shimmer

            case .loaded:
                if let photo {
                    photoView(photo)
                } else {
                    placeholder
                }

            case .failed:
                placeholder
            }
        }
        .task(id: icao24) {
            await loadPhoto()
        }
    }

    // MARK: Photo loaded
    private func photoView(_ photo: AircraftPhoto) -> some View {
        ZStack(alignment: .bottomLeading) {
            AsyncImage(url: photo.largeURL ?? photo.thumbnailURL) { phase in
                switch phase {
                case .empty:
                    shimmer
                case .success(let img):
                    img.resizable()
                       .aspectRatio(contentMode: .fill)
                       .transition(.opacity.animation(.easeIn(duration: 0.3)))
                case .failure:
                    placeholder
                @unknown default:
                    placeholder
                }
            }

            // Photographer credit
            HStack(spacing: 4) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 9))
                Text("© \(photo.photographer)")
                    .font(.system(size: 10, weight: .medium))
                if let model = photo.aircraftModel {
                    Text("· \(model)")
                        .font(.system(size: 10))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            .foregroundColor(.white.opacity(0.9))
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                LinearGradient(
                    colors: [.clear, .black.opacity(0.7)],
                    startPoint: .top, endPoint: .bottom)
            )
        }
        .clipped()
    }

    // MARK: Shimmer skeleton
    private var shimmer: some View {
        Rectangle()
            .fill(Color.skyCard)
            .overlay(ShimmerView())
    }

    // MARK: Placeholder
    private var placeholder: some View {
        ZStack {
            Color.skyCard
            VStack(spacing: 8) {
                Image(systemName: "airplane.circle")
                    .font(.system(size: 32))
                    .foregroundColor(.skyTextDim)
                Text("No photo available")
                    .font(.system(size: 11))
                    .foregroundColor(.skyTextDim)
            }
        }
    }

    // MARK: Load
    private func loadPhoto() async {
        guard state == .idle else { return }
        state = .loading
        let result = await PhotoService.shared.photo(for: icao24)
        photo = result
        state = result != nil ? .loaded : .failed
    }
}

// MARK: - Shimmer effect

struct ShimmerView: View {
    @State private var phase: CGFloat = -1

    var body: some View {
        GeometryReader { geo in
            LinearGradient(
                colors: [
                    Color.skyBorder.opacity(0.3),
                    Color.skyCardSecondary.opacity(0.6),
                    Color.skyBorder.opacity(0.3)
                ],
                startPoint: UnitPoint(x: phase, y: 0),
                endPoint: UnitPoint(x: phase + 0.8, y: 0)
            )
            .onAppear {
                withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                    phase = 1.4
                }
            }
        }
    }
}
