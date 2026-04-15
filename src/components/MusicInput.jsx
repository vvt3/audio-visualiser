import { useState } from 'react';

export default function MusicInput() {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = () => {
        if (!file) {
            console.log("No song");
            return
        }

        const url = URL.createObjectURL(file)
        console.log("Loaded:", url)
        // if (file) {
        //     console.log('Uploading:', file.name);
        //     setFile(file);
        //     // do the upload
        // }
    };

    return (
        <div class="flex flex-col items-center gap-3 p-4">
            {file &&
            <span className="text-sm text-gray-400">
                {file.name}
            </span>
            }
            <label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
                Select Audio
                <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                />
            </label>

            <button onClick={handleUpload} className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
                Add to Queue
            </button>
        </div>
    );
}