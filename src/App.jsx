import Canvas from "./components/Canvas"
import MusicInput from "./components/MusicInput"
import { useState } from "react"

function App() {
  const [audioFile, setAudioFile] = useState(null)
  const [volume, setVolume] = useState(0.5)

  return (
     <div className="h-screen w-screen flex flex-col bg-zinc-600 text-white">

      {/* Header */}
      <header className="h-14 flex items-center justify-center px-4 border-b border-gray-800 p-5">
        <h1 className="text-3xl font-semibold flex items-center">
          🎢 Audio Rollercoaster
        </h1>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center overflow-hidden">
        <div>
          <MusicInput onFileSelect={setAudioFile}/>
        </div>
        <div className="w-[90%] max-w-6xl h-[90%] bg-black border border-gray-800 rounded-xl overflow-hidden">
          <Canvas audioFile={audioFile} volume={volume} />
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center gap-2 border-t border-gray-800 bg-zinc-600">
        <button className="px-4 py-2 bg-blue-500 rounded">
          ▶︎
        </button>
        <button className="px-4 py-2 bg-blue-500 rounded">
          ❚❚
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value)
            setVolume(v)
          }}
        />
      </footer>
    </div>
  )
}

export default App