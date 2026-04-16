import Canvas from "./components/Canvas"
import MusicInput from "./components/MusicInput"
import { useState, useEffect} from "react"
import { createAudioEngine } from "./engine/audio"

function App() {
  const [audioEngine, setAudioEngine] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [file, setFile] = useState(null)
  const [volume, setVolume] = useState(1)

  const handleFileSelect = async (file) => {
    // Destroy engine if it exsists
    if (audioEngine) {
      audioEngine.destroy()
    }
    // create new
    const engine = await createAudioEngine(file)
    setAudioEngine(engine)
    setFile(file)
    setIsPlaying(false)
  }

  // Volume control
  useEffect(() => {
    audioEngine?.setVolume?.(volume)
  }, [volume, audioEngine])

  // Play pause
  const handleToggle = async () => {
    if (!audioEngine) return

    // toggle behavior
    if (isPlaying) {
      audioEngine.pause()
      setIsPlaying(false)
    } else {
      audioEngine.play()
      setIsPlaying(true)
    }
  }

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

        <MusicInput onFileSelect={handleFileSelect} />

        <div className="w-[90%] max-w-4xl h-[90%] bg-black border border-gray-800 rounded-xl overflow-hidden">
          <p className="text-sm">{file ? file.name : ""}</p>
          <Canvas audioEngine={audioEngine} volume={volume} />
        </div>

        {/* Controls */}
        <div className="flex flex-row gap-4 mt-4">
            <button
              className="px-4 py-2 bg-blue-600 rounded-full hover:bg-blue-500"
              onClick={() => {
                if (!audioEngine) return

                audioEngine.restart()
                setIsPlaying(true)
              }}
            >
              ↺
            </button>
            <button
              className="px-4 py-2 bg-blue-600 rounded-full hover:bg-blue-500"
              onClick={handleToggle}
            >
              {isPlaying ? "❚❚" : "▶︎"}
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
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center gap-2 border-t border-gray-800 bg-zinc-600">
      </footer>
    </div>
  )
}

export default App