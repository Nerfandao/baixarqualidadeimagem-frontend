const API_URL = 'https://baixarqualidadeimagem-backend.onrender.com/api';

let uploadedFile = null;
let uploadedFileId = null;
let processedImageId = null;
let currentMode = 'auto';
let originalImageDimensions = { width: 0, height: 0 };
let currentSettings = {
    mode: 'media',
    pixelization: 4,
    quality: 50,
    noise: 30,
    blur: 0,
    format: 'jpeg',
    resolutionScale: 100
};

const AUTO_PARAMS = {
    pixelization: 4,
    quality: 20,
    noise: 10,
    blur: 2,
    format: 'jpeg'
};

const presetModes = {
    baixa: { pixelization: 2, quality: 75, noise: 10, blur: 0 },
    media: { pixelization: 4, quality: 50, noise: 30, blur: 2 },
    extrema: { pixelization: 12, quality: 20, noise: 70, blur: 5 }
};

// DOM elements - will be initialized after DOM is ready
let uploadArea, uploadSection, fileInput, errorMessage, previewSection, controlsSection;
let originalPreview, processedPreview, originalInfo, processedInfo, processBtn;
let pixelSlider, qualitySlider, noiseSlider, blurSlider, resolutionSlider;
let pixelValue, qualityValue, noiseValue, blurValue, resolutionValue;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    uploadArea = document.getElementById('uploadArea');
    uploadSection = document.querySelector('.upload-section');
    fileInput = document.getElementById('fileInput');
    errorMessage = document.getElementById('errorMessage');
    previewSection = document.getElementById('previewSection');
    controlsSection = document.getElementById('controlsSection');
    originalPreview = document.getElementById('originalPreview');
    processedPreview = document.getElementById('processedPreview');
    originalInfo = document.getElementById('originalInfo');
    processedInfo = document.getElementById('processedInfo');
    processBtn = document.getElementById('processBtn');

    pixelSlider = document.getElementById('pixelSlider');
    qualitySlider = document.getElementById('qualitySlider');
    noiseSlider = document.getElementById('noiseSlider');
    blurSlider = document.getElementById('blurSlider');
    resolutionSlider = document.getElementById('resolutionSlider');
    pixelValue = document.getElementById('pixelValue');
    qualityValue = document.getElementById('qualityValue');
    noiseValue = document.getElementById('noiseValue');
    blurValue = document.getElementById('blurValue');
    resolutionValue = document.getElementById('resolutionValue');

    setupEventListeners();
});

function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling to document
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e);
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleModeChange(e.target.dataset.mode));
    });

    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleFormatChange(e.target.dataset.format));
    });

    pixelSlider.addEventListener('input', (e) => {
        currentSettings.pixelization = parseInt(e.target.value);
        pixelValue.textContent = e.target.value;
    });

    qualitySlider.addEventListener('input', (e) => {
        currentSettings.quality = parseInt(e.target.value);
        qualityValue.textContent = e.target.value;
    });

    noiseSlider.addEventListener('input', (e) => {
        currentSettings.noise = parseInt(e.target.value);
        noiseValue.textContent = e.target.value;
    });

    blurSlider.addEventListener('input', (e) => {
        currentSettings.blur = parseInt(e.target.value);
        blurValue.textContent = e.target.value;
    });

    resolutionSlider.addEventListener('input', (e) => {
        currentSettings.resolutionScale = parseInt(e.target.value);
        resolutionValue.textContent = e.target.value;
    });

    processBtn.addEventListener('click', processImage);

    document.getElementById('changeImageBtn')?.addEventListener('click', () => {
        fileInput.click();
    });

    document.getElementById('downloadImageBtn')?.addEventListener('click', downloadImage);
    document.getElementById('copyImageBtn')?.addEventListener('click', copyImageToClipboard);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (!e.target.files || e.target.files.length === 0) {
        return;
    }

    const file = e.target.files[0];

    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const fileType = file.type.toLowerCase();

    const fileName = file.name.toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!validTypes.includes(fileType) && !hasValidExtension) {
        showError('Formato inválido. Use PNG, WEBP, JPG ou JPEG.');
        return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('Arquivo muito grande. Tamanho máximo: 10MB.');
        return;
    }

    if (file.size < 100) {
        showError('Arquivo parece estar corrompido ou vazio.');
        return;
    }

    uploadedFile = file;
    hideError();

    uploadAndShowPreview(file);
}

async function uploadAndShowPreview(file) {
    showLoading('Carregando imagem...');

    try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error('Erro no upload da imagem');
        }

        const uploadData = await uploadResponse.json();
        uploadedFileId = uploadData.fileId;

        const previewUrl = `${API_URL}/download/${uploadedFileId}`;

        const img = new Image();

        img.onload = () => {
            originalImageDimensions.width = img.width;
            originalImageDimensions.height = img.height;

            originalPreview.src = previewUrl;

            const sizeKB = (file.size / 1024).toFixed(2);
            originalInfo.textContent = `${img.width}x${img.height} • ${sizeKB} KB`;

            uploadSection.style.display = 'none';
            previewSection.style.display = 'block';
            controlsSection.style.display = 'block';

            processedPreview.innerHTML = '<p>Aguardando processamento...</p>';
            processedInfo.textContent = '';
            document.getElementById('processedActions').style.display = 'none';

            hideLoading();

            if (currentMode !== 'auto') {
                setTimeout(() => {
                    controlsSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 300);
            }

            setTimeout(() => {
                if (currentMode === 'auto') {
                    processImageAuto();
                }
            }, 500);
        };

        img.onerror = () => {
            throw new Error('Erro ao carregar preview');
        };

        img.src = previewUrl;

    } catch (error) {
        hideLoading();
        alert('Erro ao carregar: Não foi possível fazer upload da imagem. Verifique sua conexão e tente novamente.');
    }
}
function getAutoTargetSize(width, height) {
    const maxSide = Math.max(width, height);

    if (maxSide > 600) {
        const scale = 500 / maxSide;
        return {
            targetW: Math.round(width * scale),
            targetH: Math.round(height * scale),
            didResize: true
        };
    }

    if (maxSide >= 450 && maxSide <= 600) {
        return {
            targetW: width,
            targetH: height,
            didResize: false
        };
    }

    return {
        targetW: width,
        targetH: height,
        didResize: false
    };
}

async function processImageAuto() {
    if (!uploadedFileId) {
        showError('Nenhuma imagem selecionada.');
        return;
    }

    showLoading('Processando imagem...');

    try {
        const resizeInfo = getAutoTargetSize(
            originalImageDimensions.width,
            originalImageDimensions.height
        );

        const requestBody = {
            fileId: uploadedFileId,
            pixelization: AUTO_PARAMS.pixelization,
            quality: AUTO_PARAMS.quality,
            noise: AUTO_PARAMS.noise,
            blur: AUTO_PARAMS.blur,
            outputFormat: AUTO_PARAMS.format
        };

        if (resizeInfo.didResize) {
            requestBody.targetWidth = resizeInfo.targetW;
            requestBody.targetHeight = resizeInfo.targetH;
        }

        const processResponse = await fetch(`${API_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!processResponse.ok) {
            const errorText = await processResponse.text();
            throw new Error('Erro ao processar a imagem');
        }

        const processData = await processResponse.json();
        processedImageId = processData.processedFileId;

        const previewUrl = `${API_URL}/download/${processedImageId}`;
        processedPreview.innerHTML = `<img src="${previewUrl}" alt="Imagem processada">`;

        const info = processData.info;
        processedInfo.textContent = `${info.width}x${info.height} • ${info.sizeKB} KB`;

        document.getElementById('processedActions').style.display = 'flex';

        updateAppliedSettings(requestBody);

        // Insert ad after showing the result
        insertAdSenseBlock();

        hideError();
        hideLoading();

        setTimeout(() => {
            const resultBox = processedPreview.closest('.preview-box');
            if (resultBox) {
                resultBox.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 300);

    } catch (error) {
        console.error('Erro:', error);

        hideLoading();
        alert('Erro ao processar: Não foi possível processar a imagem. Tente novamente.');
    }
}

function updateAppliedSettings(settings) {
    const settingsApplied = document.getElementById('settingsApplied');

    const appliedPixel = document.getElementById('appliedPixel');
    if (appliedPixel) appliedPixel.textContent = `${settings.pixelization}x`;

    const appliedQuality = document.getElementById('appliedQuality');
    if (appliedQuality) appliedQuality.textContent = `${settings.quality}%`;

    const appliedNoise = document.getElementById('appliedNoise');
    if (appliedNoise) appliedNoise.textContent = `${settings.noise}%`;

    const appliedBlur = document.getElementById('appliedBlur');
    if (appliedBlur) appliedBlur.textContent = settings.blur;

    const appliedResolution = document.getElementById('appliedResolution');
    if (appliedResolution) appliedResolution.textContent = `${settings.targetWidth}x${settings.targetHeight}`;

    const appliedFormat = document.getElementById('appliedFormat');
    if (appliedFormat) appliedFormat.textContent = (settings.outputFormat || settings.format).toUpperCase();

    pixelSlider.value = settings.pixelization;
    pixelValue.textContent = settings.pixelization;
    currentSettings.pixelization = settings.pixelization;

    qualitySlider.value = settings.quality;
    qualityValue.textContent = settings.quality;
    currentSettings.quality = settings.quality;

    noiseSlider.value = settings.noise;
    noiseValue.textContent = settings.noise;
    currentSettings.noise = settings.noise;

    blurSlider.value = settings.blur;
    blurValue.textContent = settings.blur;
    currentSettings.blur = settings.blur;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (settingsApplied) settingsApplied.style.display = 'block';
}

/**
 * Inserts the AdSense ad block below the action buttons.
 * Ensures the ad is inserted only once and not duplicated.
 * The ad only appears after the user processes the image.
 */
function insertAdSenseBlock() {
    const processedActions = document.getElementById('processedActions');

    // Check if ad container already exists
    let adContainer = document.getElementById('adsense-container');

    // If it doesn't exist, create the container and insert the ad block
    if (!adContainer && processedActions) {
        adContainer = document.createElement('div');
        adContainer.id = 'adsense-container';
        adContainer.className = 'ad-container';

        // Ad block HTML
        adContainer.innerHTML = `
            <!-- Bloco Horizontal de Anuncio -->
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-9144276134760026"
                 data-ad-slot="7153492167"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        `;

        // Insert the container after the action buttons (inside preview-box)
        processedActions.parentNode.appendChild(adContainer);

        // Wait for DOM to render before calling push (prevents availableWidth=0 error)
        setTimeout(() => {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('Error loading AdSense ad:', e);
            }
        }, 100);
    }
}


function handleModeChange(mode) {
    currentSettings.mode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });

    const preset = presetModes[mode];
    currentSettings.pixelization = preset.pixelization;
    currentSettings.quality = preset.quality;
    currentSettings.noise = preset.noise;
    currentSettings.blur = preset.blur;

    pixelSlider.value = preset.pixelization;
    qualitySlider.value = preset.quality;
    noiseSlider.value = preset.noise;
    blurSlider.value = preset.blur;
    pixelValue.textContent = preset.pixelization;
    qualityValue.textContent = preset.quality;
    noiseValue.textContent = preset.noise;
    blurValue.textContent = preset.blur;
}

function handleFormatChange(format) {
    currentSettings.format = format;

    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.format === format) {
            btn.classList.add('active');
        }
    });
}

async function processImage() {
    if (!uploadedFileId) {
        showError('Nenhuma imagem selecionada.');
        return;
    }

    processBtn.disabled = true;
    processBtn.textContent = 'Processing...';

    try {
        const requestBody = {
            fileId: uploadedFileId,
            pixelization: currentSettings.pixelization,
            quality: currentSettings.quality,
            noise: currentSettings.noise,
            blur: currentSettings.blur,
            outputFormat: currentSettings.format
        };

        if (currentSettings.resolutionScale < 100) {
            const scale = currentSettings.resolutionScale / 100;
            requestBody.targetWidth = Math.round(originalImageDimensions.width * scale);
            requestBody.targetHeight = Math.round(originalImageDimensions.height * scale);
        }

        const processResponse = await fetch(`${API_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!processResponse.ok) {
            const errorText = await processResponse.text();
            throw new Error('Erro ao processar a imagem');
        }

        const processData = await processResponse.json();
        processedImageId = processData.processedFileId;

        const previewUrl = `${API_URL}/download/${processedImageId}`;
        processedPreview.innerHTML = `<img src="${previewUrl}" alt="Imagem processada">`;

        const info = processData.info;
        processedInfo.textContent = `${info.width}x${info.height} • ${info.sizeKB} KB`;

        document.getElementById('processedActions').style.display = 'flex';

        // Insert ad after showing the result
        insertAdSenseBlock();

        hideError();

        // Scroll to show the processed result
        setTimeout(() => {
            // Scroll to the result preview box (second preview-box)
            const resultBox = processedPreview.closest('.preview-box');
            if (resultBox) {
                resultBox.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 300);

    } catch (error) {
        showError('Erro ao processar a imagem. Tente novamente.');
    } finally {
        processBtn.disabled = false;
        processBtn.textContent = 'Process Again';
    }
}

function downloadImage() {
    if (!processedImageId) {
        showError('Nenhuma imagem processada para download.');
        return;
    }

    const timestamp = new Date().getTime();
    const extension = currentSettings.format === 'jpeg' ? 'jpg' : 'png';
    const filename = `imagem_zoada_${timestamp}.${extension}`;

    const downloadUrl = `${API_URL}/download/${processedImageId}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
        showDonationPopup();
    }, 1000);
}

function showDonationPopup() {
    Swal.fire({
        title: 'Support this project ☕',
        html: `
            <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                This tool is completely <strong>free</strong> and maintained independently. 
                If it helped you create your memes, consider buying me a coffee to keep the project running!
            </p>
            <p style="font-size: 14px; color: #718096; margin-top: 15px;">
                Thank you for using Low Quality Image Generator! ❤️
            </p>
        `,
        confirmButtonText: 'Close',
        confirmButtonColor: '#0B5FFF',
        showCancelButton: true,
        cancelButtonText: '☕ Buy me a coffee',
        cancelButtonColor: '#48bb78',
        width: '450px',
        padding: '2em',
        backdrop: true,
        allowOutsideClick: true
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            window.open('https://buymeacoffee.com/nerfandao', '_blank');
        }
    });
}

async function copyImageToClipboard() {
    if (!processedImageId) {
        showError('No processed image to copy.');
        return;
    }

    try {
        const imageUrl = `${API_URL}/download/${processedImageId}`;

        const response = await fetch(imageUrl);
        const blob = await response.blob();

        if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve();
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(blob);
            });

            const pngBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });

            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': pngBlob
                })
            ]);
        } else {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);
        }

        Swal.fire({
            icon: 'success',
            title: 'Image copied!',
            text: 'The image has been copied to clipboard. Use Ctrl+V to paste.',
            timer: 2500,
            showConfirmButton: false
        }).then(() => {
            setTimeout(() => {
                showDonationPopup();
            }, 300);
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Copy failed',
            text: 'Could not copy the image. Try using the download button.',
            confirmButtonColor: '#0B5FFF'
        });
    }
}

function resetApp() {
    uploadedFile = null;
    uploadedFileId = null;
    processedImageId = null;
    fileInput.value = '';

    uploadSection.style.display = 'block';
    previewSection.style.display = 'none';
    controlsSection.style.display = 'none';
    document.getElementById('processedActions').style.display = 'none';

    hideError();

    handleModeChange('media');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Funções auxiliares
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showLoading(message = 'Carregando...') {
    hideLoading();

    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background-color: white;
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0B5FFF;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    `;

    // Texto
    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
        color: #0B1B2F;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
    `;

    content.appendChild(spinner);
    content.appendChild(text);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Adicionar animação de spin se não existir
    if (!document.getElementById('spinAnimation')) {
        const style = document.createElement('style');
        style.id = 'spinAnimation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Log para debug (remover em produção)
console.log('BaixarQualidadeImagem App Initialized');