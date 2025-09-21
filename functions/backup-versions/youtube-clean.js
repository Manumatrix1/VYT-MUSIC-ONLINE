// youtube-clean.js - Módulo YouTube sin secretos para deployment exitoso
const { onRequest } = require("firebase-functions/v2/https");

// Función placeholder para obtener video de YouTube
const getYouTubeVideo = onRequest(async (req, res) => {
  res.status(503).json({
    error: "YouTube module temporarily disabled",
    message: "La funcionalidad de YouTube está temporalmente deshabilitada para permitir el deployment"
  });
});

// Función placeholder para actualizar video de YouTube
const updateYouTubeVideo = onRequest(async (req, res) => {
  res.status(503).json({
    error: "YouTube module temporarily disabled",
    message: "La funcionalidad de YouTube está temporalmente deshabilitada para permitir el deployment"
  });
});

// Función placeholder para eliminar video de YouTube
const deleteYouTubeVideo = onRequest(async (req, res) => {
  res.status(503).json({
    error: "YouTube module temporarily disabled",
    message: "La funcionalidad de YouTube está temporalmente deshabilitada para permitir el deployment"
  });
});

// Función placeholder para obtener todos los videos de YouTube
const getAllYouTubeVideos = onRequest(async (req, res) => {
  res.status(503).json({
    error: "YouTube module temporarily disabled",
    message: "La funcionalidad de YouTube está temporalmente deshabilitada para permitir el deployment"
  });
});

// Función placeholder para procesar video inicial
const processInitialVideo = onRequest(async (req, res) => {
  res.status(503).json({
    error: "YouTube module temporarily disabled",
    message: "La funcionalidad de YouTube está temporalmente deshabilitada para permitir el deployment"
  });
});

// Función placeholder para procesar pago y video final
const processPaymentAndFinalVideo = onRequest(async (req, res) => {
  res.status(503).json({
    error: "YouTube module temporarily disabled",
    message: "La funcionalidad de YouTube está temporalmente deshabilitada para permitir el deployment"
  });
});

// Función placeholder para aprobación final
const processFinalApproval = onRequest(async (req, res) => {
  res.status(503).json({
    error: "YouTube module temporarily disabled",
    message: "La funcionalidad de YouTube está temporalmente deshabilitada para permitir el deployment"
  });
});

// Export all YouTube functions as placeholders
module.exports = {
  getYouTubeVideo,
  updateYouTubeVideo,
  deleteYouTubeVideo,
  getAllYouTubeVideos,
  processInitialVideo,
  processPaymentAndFinalVideo,
  processFinalApproval
};