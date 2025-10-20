import * as bodySegmentation from "@tensorflow-models/body-segmentation";


export const createSegmenter = async () => {
  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
  return bodySegmentation.createSegmenter(model, {runtime: "mediapipe", solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation", modelType: "general"});
};

