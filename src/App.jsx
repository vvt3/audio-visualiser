import VisualizerCanvas from "./components/Canvas"

function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <div className="bg-fuchsia-600 text-white p-4 flex items-center h-20 justify-center">
          Tailwind Test
      </div>
      <VisualizerCanvas />
    </div>
  )
}

export default App