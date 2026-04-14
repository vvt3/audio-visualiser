import { useState } from 'react';

export default function MusicInput() {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = () => {
        if (file) {
            console.log('Uploading:', file.name);
            // Add your upload logic here
        }
    };

    return (
        <div>
            <input
                type="file"
                accept=".mp3"
                onChange={handleFileChange}
            />
            <button onClick={handleUpload}>
                Upload
            </button>
            {file && <p>Selected: {file.name}</p>}
        </div>
    );
}