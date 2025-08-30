import React, { useState } from 'react';
import axios from 'axios';

const ImageMerger = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('overlay');
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const [opacity, setOpacity] = useState(1.0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Image1:', image1, 'Image2:', image2); // Debug: Check files
    if (!image1 || !image2) {
      setError('Please select two images');
      return;
    }

    const formData = new FormData();
    formData.append('images', image1);
    formData.append('images', image2);
    formData.append('mode', mode);
    formData.append('top', top);
    formData.append('left', left);
    formData.append('opacity', opacity);

    // Debug: Log FormData entries
    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key} =`, value);
    }

    try {
      const response = await axios.post('http://localhost:3001/api/merge-images', formData);
      console.log(response)
      setResult(response.data);
      setError(null);
    } catch (err) {
      console.error('Axios Error:', err); // Log full error
      setError(err.response?.data?.error || err.message || 'An error occurred');
      setResult(null);
    }
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Merge Images</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">First Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage1(e.target.files[0])}
            className="p-2 border"
          />
        </div>
        <div>
          <label className="block">Second Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage2(e.target.files[0])}
            className="p-2 border"
          />
        </div>
        <div>
          <label className="block">Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="p-2 border"
          >
            <option value="overlay">Overlay</option>
            <option value="blend">Blend</option>
          </select>
        </div>
        <div>
          <label className="block">Top Offset (px):</label>
          <input
            type="number"
            value={top}
            onChange={(e) => setTop(e.target.value)}
            className="p-2 border"
          />
        </div>
        <div>
          <label className="block">Left Offset (px):</label>
          <input
            type="number"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            className="p-2 border"
          />
        </div>
        <div>
          <label className="block">Opacity (0 to 1):</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={opacity}
            onChange={(e) => setOpacity(e.target.value)}
            className="p-2 border"
          />
        </div>
        <button type="submit" className="p-2 text-white bg-blue-500 rounded">
          Merge Images
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {result && (
        <div className="mt-4">
          <p>{result.message}</p>
          <img src={`http://localhost:3001/${result.outputPath}`} alt="Merged" className="max-w-full mt-2" />
        </div>
      )}
    </div>
  );
};

export default ImageMerger;