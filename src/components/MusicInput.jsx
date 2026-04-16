import { useState } from 'react';

export default function MusicInput({ onFileSelect }) {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (!selected) return
        //setFile(selected)
        onFileSelect(selected) // File goes to App
    }

    return (
        <div className="flex flex-col items-center gap-3 p-4">
            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full cursor-pointer">
                Select Audio
                <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </label>
        </div>
    );
}