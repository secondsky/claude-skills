import SwiftUI
import ElevenLabs

struct VoiceAgentView: View {
    @State private var isConnected = false
    @State private var transcript: [(role: String, text: String)] = []
    
    private let agentID = "your-agent-id"
    private let apiKey = "your-api-key" // Use environment variable in production
    
    var body: some View {
        VStack {
            Text("Voice Agent")
                .font(.largeTitle)
                .padding()
            
            HStack {
                Button("Start Conversation") {
                    startConversation()
                }
                .disabled(isConnected)
                
                Button("Stop") {
                    stopConversation()
                }
                .disabled(!isConnected)
            }
            .padding()
            
            Text("Status: \(isConnected ? "Connected" : "Disconnected")")
                .padding()
            
            ScrollView {
                ForEach(transcript.indices, id: \.self) { index in
                    let message = transcript[index]
                    HStack {
                        VStack(alignment: .leading) {
                            Text(message.role == "user" ? "You" : "Agent")
                                .font(.caption)
                                .fontWeight(.bold)
                            Text(message.text)
                        }
                        .padding()
                        .background(message.role == "user" ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1))
                        .cornerRadius(8)
                        Spacer()
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
    
    private func startConversation() {
        // Initialize ElevenLabs conversation
        // Implementation would use the ElevenLabs Swift SDK
        isConnected = true
    }
    
    private func stopConversation() {
        isConnected = false
    }
}

#Preview {
    VoiceAgentView()
}

// Note: This is a placeholder. Full Swift SDK documentation available at:
// https://github.com/elevenlabs/elevenlabs-swift-sdk
