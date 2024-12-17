let imageCache = new Map();
let isLoading = true;

// Load and extract the ZIP file
async function loadImages() {
  console.info('Starting image load...');
  try {
    const response = await fetch('plots.zip');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.info('ZIP file fetched successfully');
    const zipData = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(zipData);
    console.info('ZIP file loaded successfully');

    // Log all files in the zip
    const zipFiles = Object.keys(zip.files);
    console.info('Files in zip:', zipFiles);

    // Extract all images and store them in memory
    const promises = [];
    zip.forEach((relativePath, zipEntry) => {
      // Skip __MACOSX folders and their contents
      if (
        !zipEntry.dir &&
        relativePath.endsWith('.png') &&
        !relativePath.includes('__MACOSX')
      ) {
        const promise = zipEntry.async('blob').then(blob => {
          // Get just the filename without path
          const filename = relativePath.split('/').pop();
          console.info('Processing filename:', filename);

          // Extract number more carefully
          const imageNumber = parseInt(filename.replace('.png', ''));
          console.info(
            'Extracted number:', imageNumber,
            'from filename:', filename
          );

          if (isNaN(imageNumber)) {
            throw new Error(`Could not parse image number from ${filename}`);
          }

          const url = URL.createObjectURL(blob);
          console.info(`Creating URL for image ${imageNumber}:`, url);

          // Verify the blob size
          console.info(`Blob size for image ${imageNumber}:`, blob.size);

          imageCache.set(imageNumber, url);
          console.info(`Successfully cached image ${imageNumber}`);

          // Create a test image to verify the blob URL works
          return new Promise((resolve, reject) => {
            const testImg = new Image();
            testImg.onload = () => {
              console.info(`Test load successful for image ${imageNumber}`);
              resolve();
            };
            testImg.onerror = () => {
              console.error(`Test load failed for image ${imageNumber}`);
              reject(new Error(`Test load failed for image ${imageNumber}`));
            };
            testImg.src = url;
          });
        }).catch(error => {
          console.error(`Error processing ${relativePath}:`, error);
        });
        promises.push(promise);
      }
    });

    await Promise.all(promises);
    isLoading = false;

    const cachedImages = Array.from(imageCache.keys()).sort((a,b) => a-b);
    console.info('All images loaded. Cache size:', imageCache.size);
    console.info('Cached image numbers:', cachedImages);

    // Show the first available image
    const firstImage = cachedImages[0];
    console.info('Starting with image:', firstImage);
    updateImage(firstImage);
  } catch (error) {
    console.error('Error loading images:', error);
    document.getElementById('assetdist-text').innerHTML +=
      `<br><br><strong>Error loading images: ${error.message}</strong>`;
  }
}

function updateImage(timeStep) {
  if (isLoading) return;

  const img = document.getElementById('assetdist_svg');
  const imageUrl = imageCache.get(timeStep);
  console.info(
    `Attempting to show image ${timeStep}, URL exists: ${Boolean(imageUrl)}`
  );

  if (imageUrl) {
    img.src = imageUrl;
    img.style.width = '100%';
    img.style.height = 'auto';
    img.onerror = () => {
      console.warn(`Image ${timeStep} failed to load - URL was ${imageUrl}`);
      console.warn('Current cache contents:', Array.from(imageCache.keys()).sort((a,b) => a-b));
      // Try next available image
      const availableImages = Array.from(imageCache.keys()).sort((a,b) => a-b);
      const nextImage = availableImages.find(num => num > timeStep);
      if (nextImage) {
        const slider = document.getElementById("t_input");
        const value = document.getElementById("t_value");
        slider.value = nextImage;
        value.textContent = nextImage;
        updateImage(nextImage);
      }
    };
    img.onload = () => {
      console.info(`Successfully loaded image ${timeStep}`);
    };
  } else {
    console.warn(`No image found for timestep ${timeStep}`);
    console.warn('Available timesteps:', Array.from(imageCache.keys()).sort((a,b) => a-b));
    // Try next available image
    const availableImages = Array.from(imageCache.keys()).sort((a,b) => a-b);
    const nextImage = availableImages.find(num => num > timeStep);
    if (nextImage) {
      const slider = document.getElementById("t_input");
      const value = document.getElementById("t_value");
      slider.value = nextImage;
      value.textContent = nextImage;
      updateImage(nextImage);
    }
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  console.info('DOM Content Loaded');

  // Setup debug function in global scope
  window.debugImageCache = () => {
    console.info('Image cache size:', imageCache.size);
    console.info('Cache contents:', Array.from(imageCache.entries()));
    console.info('Is loading:', isLoading);
  };

  // Log that debug function is ready
  console.info('debugImageCache function registered');

  // get elements
  const slider = document.getElementById("t_input");
  const value = document.getElementById("t_value");

  // get buttons
  const back = document.getElementById("t_back");
  const play = document.getElementById("t_play");
  const forward = document.getElementById("t_forward");

  // Verify elements are found
  if (!slider || !value || !back || !play || !forward) {
    console.error('Required elements not found');
    return;
  }

  // set timeout and interval variables
  let interval = null;
  let holdTimeout = null;

  // set hold time needed to trigger hold action
  const holdTime = 200;

  // get min and max values of slider
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);

  // set initial value of text content
  value.textContent = slider.value;

  // Start loading images
  console.info('Starting loadImages...');
  loadImages();

  // update text content and image when slider is moved
  slider.oninput = function() {
    const timeStep = parseInt(this.value);
    const availableImages = Array.from(imageCache.keys()).sort((a,b) => a-b);

    // Find the closest available image
    const nextImage = availableImages.find(num => num >= timeStep) || availableImages[availableImages.length - 1];
    const prevImage = availableImages.reverse().find(num => num <= timeStep) || availableImages[0];

    // Use the closest available image
    const closestImage = (Math.abs(nextImage - timeStep) < Math.abs(prevImage - timeStep))
      ? nextImage
      : prevImage;

    this.value = closestImage;
    value.textContent = closestImage;
    updateImage(closestImage);
  }

  // click buttons to move slider
  forward.onclick = function() {
    if (parseInt(slider.value) < max) {
      let nextTimeStep = parseInt(slider.value) + 1;
      while (nextTimeStep <= max && !imageCache.get(nextTimeStep)) {
        nextTimeStep++;
      }
      if (nextTimeStep <= max) {
        slider.value = nextTimeStep;
        value.textContent = slider.value;
        updateImage(parseInt(slider.value));
      }
    }
  }

  back.onclick = function() {
    if (parseInt(slider.value) > min) {
      let prevTimeStep = parseInt(slider.value) - 1;
      while (prevTimeStep >= min && !imageCache.get(prevTimeStep)) {
        prevTimeStep--;
      }
      if (prevTimeStep >= min) {
        slider.value = prevTimeStep;
        value.textContent = slider.value;
        updateImage(parseInt(slider.value));
      }
    }
  }

  // click play button to start/stop animation
  play.onclick = function() {
    if (interval) {
      clearInterval(interval);
      interval = null;
      return;
    }

    let i = parseInt(slider.value);
    interval = setInterval(function() {
      if (i < max) {
        i++;
        slider.value = i;
        value.textContent = i;
        updateImage(i);
      } else {
        clearInterval(interval);
        interval = null;
      }
    }, 100);
  }

  // hold buttons to move slider to min/max
  back.onmousedown = function() {
    holdTimeout = setTimeout(function() {
      slider.value = min;
      value.textContent = slider.value;
      updateImage(parseInt(slider.value));
    }, holdTime);
  }
  back.onmouseup = function() {
    clearTimeout(holdTimeout);
  }

  forward.onmousedown = function() {
    holdTimeout = setTimeout(function() {
      slider.value = max;
      value.textContent = slider.value;
      updateImage(parseInt(slider.value));
    }, holdTime);
  }
  forward.onmouseup = function() {
    clearTimeout(holdTimeout);
  }
});
