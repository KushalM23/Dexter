# Dexter App: Pixel Art LoRA Training Guide

This guide covers how to train a custom AI model (LoRA) to generate accurate, stylized retro pixel art animals dynamically using the FLUX model.

## 1. Preparing the Dataset
To train the AI on your specific pixel art style (chunky, flat colors, thick outlines), you need a highly consistent dataset.
* **Quantity:** 15 to 25 images.
* **Content:** Various animals in the exact pixel art style you want (e.g., like the shark you referenced).
* **Formatting:** Square images (e.g., 512x512 or 1024x1024), white or transparent backgrounds. 
* **Packaging:** Compress all images into a single `.zip` file. (No text files needed, FLUX auto-captions them).

## 2. Training the Model
We will use the **FLUX.1-dev** model, which has an incredible base understanding of animal anatomy. By applying a LoRA, we force it to draw that accurate anatomy in your pixel style.

1. Go to a provider like **Replicate** or **Fal.ai**.
2. Find the FLUX LoRA trainer (e.g., `ostris/flux-dev-lora-trainer`).
3. Upload your `.zip` file.
4. Set a unique trigger word (e.g., `pixel_dexter`).
5. Run the training. It usually takes 20-30 minutes.

## 3. The Generation Prompt
When a user captures an animal, Gemini identifies the species (e.g., "Golden Retriever"). You will inject that species name into the following prompt in your API call:

```javascript
const prompt = `A retro 8-bit pixel art illustration of a ${speciesName}, in the style of pixel_dexter. Thick chunky black outlines, flat solid colors, no gradients, pure white background.`;
```

---

## Provider Pricing & Alternatives

You asked if Replicate is free and if there are better alternatives. 

**Is Replicate Free?**
* **No.** Replicate gives you a tiny bit of free credit on sign-up, but you must enter a credit card to train models.
* **Training Cost:** ~$1.50 to $3.00 per LoRA.
* **Generation Cost:** ~$0.025 to $0.03 per image.

### Better / Cheaper Alternatives:

**1. Fal.ai (Highly Recommended)**
* **Why it's better:** Fal.ai is widely considered the best platform for FLUX models right now. It is noticeably faster than Replicate and slightly cheaper.
* **Pricing:** Training is around $1.50, and image generation is lightning fast. They are the industry favorite for production apps right now.

**2. Civitai (Best for Free Training)**
* **Why it's better:** Civitai is a huge AI art community. You can train LoRAs directly on their website using "Buzz" (their virtual currency). You get free Buzz just for logging in daily, meaning you can **train your LoRA entirely for free**.
* **Drawback:** Civitai is built for hobbyists, not developers. Their API for generating images in an app is not as developer-friendly as Replicate or Fal.ai. (You could train it on Civitai, download the model file, and host it on Fal.ai!).

**3. RunPod / Modal (For Advanced Devs)**
* **Why it's better:** You rent a raw GPU (like an RTX 4090 or A100) by the minute and run the open-source code yourself. It is significantly cheaper at high scale.
* **Drawback:** Extremely high technical setup. You have to write the Python scripts and manage the server yourself. 

### Summary Recommendation:
Use **Fal.ai** for your Next.js application. Their developer experience and API are fantastic, they are cheaper than Replicate, and their generation speed for FLUX is currently unmatched.
