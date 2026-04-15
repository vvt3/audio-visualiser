import { useState } from 'react';
import { createAudioAnalyser } from '../engine/audio'

export default function MusicInput({ onFileSelect }) {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return

        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        await ctx.resume()
        await ctx.close()

        onFileSelect(file)
    }

    return (
        <div className="flex flex-col items-center gap-3 p-4">
            <label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
                Select Audio
                <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </label>

            {file && <span className="text-sm">{file.name}</span>}

            <button onClick={handleUpload} className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
                Add
            </button>
        </div>
    );
}