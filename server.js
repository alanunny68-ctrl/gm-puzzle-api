import express from "express";
import cors from "cors";
import multer from "multer";
import { createCanvas, loadImage } from "canvas";
import cv from "opencv4nodejs";
import fs from "fs";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

// Convert buffer to OpenCV Mat
function bufferToMat(buffer) {
  const image = cv.imdecode(buffer);
  return image;
}

// Dummy ghost filtering using threshold + contours
function filterGhostPieces(mat) {
  const gray = mat.bgrToGray();
  const blurred = gray.gaussianBlur(new cv.Size(5, 5), 0);
  const thresh = blurred.threshold(150, 255, cv.THRESH_BINARY_INV);

  const contours = thresh.findContours(
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  console.log("Contours found:", contours.length);

  return contours.length; // Just returning contour count for now
}

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    const mat = bufferToMat(req.file.buffer);
    const ghostCount = filterGhostPieces(mat);

    res.json({ message: "Image processed", ghostContours: ghostCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));