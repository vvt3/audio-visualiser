import VisualizerCanvas from "./components/Canvas"

function App() {
  return (
     <div className="h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="h-14 flex items-center justify-center px-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold flex items-center p-20">
          🎢 Audio Rollercoaster
        </h1>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 relative">
        <VisualizerCanvas />
      </main>

      {/* Footer / Controls */}
      <footer className="h-16 flex items-center justify-center gap-4 border-t border-gray-800">
        <button className="px-4 py-2 bg-blue-500 rounded">
          Play
        </button>
        <button className="px-4 py-2 bg-gray-700 rounded">
          Pause
        </button>
      </footer>
      
    </div>
  )
}

export default App