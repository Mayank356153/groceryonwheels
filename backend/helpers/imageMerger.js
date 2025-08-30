 const sharp = require('sharp');
 const fs = require("fs");
 const path = require("path");
async function mergeImages(image1Path, image2Path, options = {}) {
  try {
    // Default options


    console.log(image1Path)
    console.log(await sharp(image1Path).toBuffer())
    const {
      outputPath = 'output.png', // PNG for transparency support
      canvasWidth = 600,
      canvasHeight = 450, // Increased canvas height to accommodate images
      image1Width = 350, // Width for Nirma (first image, in the back)
      image1Height = 400, // Height for Nirma
      image2Width = 250, // Width for Parachute (second image, in the front)
      image2Height = 400, // Height for Parachute (same as Nirma for base alignment)
      overlap = 120, // Overlap for Parachute to appear in front of Nirma
    } = options;

    // Function to remove background and detect the base of the product
    const removeBackground = async (imagePath, width, height) => {
      try {
          
        // Load the image and resize
        const fileBuffer = fs.readFileSync(path.resolve(imagePath));
const image = sharp(fileBuffer)
  .resize({
    width: width,
    height: height,
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toColorspace('srgb');


        // Extract raw pixel data to manipulate
        const { data, info } = await image
          .raw()
          .toBuffer({ resolveWithObject: true });

        // Threshold to remove near-white background
        const threshold = 230; // Adjusted threshold for better background removal
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];     // Red
          const g = data[i + 1]; // Green
          const b = data[i + 2]; // Blue
          const a = data[i + 3]; // Alpha

          // If the pixel is "near white" (close to 255,255,255), make it transparent
          if (r > threshold && g > threshold && b > threshold && a > 0) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }

        // Rebuild the image with the modified pixel data
        const processedImage = await sharp(data, {
          raw: {
            width: info.width,
            height: info.height,
            channels: 4,
          },
        })
          .png()
          .toBuffer();

        // Detect the base of the product by scanning for non-transparent pixels from the bottom
        const { data: finalData, info: finalInfo } = await sharp(processedImage)
          .raw()
          .toBuffer({ resolveWithObject: true });

        let baseRow = finalInfo.height - 1; // Start from the bottom row
        for (let y = finalInfo.height - 1; y >= 0; y--) {
          let foundNonTransparent = false;
          for (let x = 0; x < finalInfo.width; x++) {
            const idx = (y * finalInfo.width + x) * 4;
            const a = finalData[idx + 3]; // Alpha channel
            if (a > 0) {
              foundNonTransparent = true;
              break;
            }
          }
          if (foundNonTransparent) {
            baseRow = y;
            break;
          }
        }

        // Crop the image to remove empty space below the base
        const cropHeight = baseRow + 1;
        const croppedBuffer = await sharp(processedImage)
          .extract({ left: 0, top: 0, width: finalInfo.width, height: cropHeight })
          .png()
          .toBuffer();

        return {
          buffer: croppedBuffer,
          originalHeight: height,
          croppedHeight: cropHeight,
        };
      } catch (error) {
        throw new Error(`Failed to remove background for image: ${error.message}`);
      }
    };

console.log("Checking file:", image1Path);
console.log("Absolute path:", path.resolve(image1Path));
console.log("Exists?", fs.existsSync(image1Path)); // MUST be true
    // Process both images to remove their backgrounds
    const image1Result = await removeBackground(image1Path, image1Width, image1Height); // Nirma
    const image2Result = await removeBackground(image2Path, image2Width, image2Height); // Parachute

    // Create a transparent canvas
    const canvas = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent canvas
      },
    }).png();

    // Calculate positions for the images (aligned at the bottom based on cropped height)
    const leftImagePosition = {
      left: Math.floor((canvasWidth - (image1Width + image2Width - overlap)) / 2), // Center horizontally
      top: canvasHeight - image1Result.croppedHeight, // Align to bottom based on cropped height
    };

    const rightImagePosition = {
      left: leftImagePosition.left + image1Width - overlap, // Overlap with Nirma
      top: canvasHeight - image2Result.croppedHeight, // Align to bottom based on cropped height
    };

    // Composite the images onto the transparent canvas
    const result = await canvas
      .composite([
        { input: image1Result.buffer, ...leftImagePosition }, // First image (Nirma, back)
        { input: image2Result.buffer, ...rightImagePosition }, // Second image (Parachute, front)
      ])
      .toFile(outputPath);
     return outputPath
  } catch (error) {
    console.log(error)
    throw new Error(`Failed to merge images: ${error.message}`);
  }
}

module.exports = { mergeImages };



