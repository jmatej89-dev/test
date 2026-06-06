import SwiftUI

struct RadarSweepView: View {
    @State private var rotation: Double = 0
    @State private var opacity: Double  = 0

    var body: some View {
        GeometryReader { geo in
            let size = max(geo.size.width, geo.size.height) * 2.2
            ZStack {
                // Sweep wedge
                SweepWedge()
                    .fill(
                        AngularGradient(
                            colors: [
                                Color.radarGreen.opacity(0),
                                Color.radarGreen.opacity(0.0),
                                Color.radarGreen.opacity(0.12),
                                Color.radarGreen.opacity(0.0)
                            ],
                            center: .center,
                            startAngle: .degrees(-4),
                            endAngle: .degrees(50)
                        )
                    )
                    .frame(width: size, height: size)
                    .position(x: geo.size.width / 2, y: geo.size.height / 2)
                    .rotationEffect(.degrees(rotation))
                    .blendMode(.screen)

                // Leading edge line
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.radarGreen.opacity(0),
                                Color.radarGreen.opacity(0.5),
                                Color.radarGreen.opacity(0)
                            ],
                            startPoint: .center,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: size / 2, height: 1)
                    .position(x: geo.size.width / 2 + size / 4, y: geo.size.height / 2)
                    .rotationEffect(.degrees(rotation), anchor: .init(x: (geo.size.width / 2) / (size / 2 + geo.size.width / 2), y: 0.5))
                    .blendMode(.screen)
            }
        }
        .ignoresSafeArea()
        .opacity(opacity)
        .onAppear {
            withAnimation(.easeIn(duration: 2)) { opacity = 1 }
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}

struct SweepWedge: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = max(rect.width, rect.height) / 2
        path.move(to: center)
        path.addArc(center: center,
                    radius: radius,
                    startAngle: .degrees(-2),
                    endAngle: .degrees(48),
                    clockwise: false)
        path.closeSubpath()
        return path
    }
}
