document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const configSection = document.getElementById('config-section');
    const uploadSection = document.getElementById('upload-section');
    const pinSection = document.getElementById('pin-section');
    const pinInput = document.getElementById('studio-pin');
    const unlockBtn = document.getElementById('unlock-btn');
    const pinError = document.getElementById('pin-error');
    const uploadForm = document.getElementById('upload-form');
    const statusOverlay = document.getElementById('status-overlay');
    const statusText = document.getElementById('status-text');
    const cardImage = document.getElementById('card-image');
    const fileLabel = document.getElementById('file-label');

    // Config Elements
    const gitUser = document.getElementById('git-user');
    const gitRepo = document.getElementById('git-repo');
    const gitToken = document.getElementById('git-token');
    const saveConfigBtn = document.getElementById('save-config');

    const MASTER_PIN = '1234'; // Simple PIN for the client

    /**
     * HIDDEN SETTINGS LOGIC
     * Only show config if ?setup=true is in URL.
     * Otherwise show PIN gate.
     */
    const urlParams = new URLSearchParams(window.location.search);
    const isSetupMode = urlParams.get('setup') === 'true';
    
    // Load existing settings
    const storedUser = localStorage.getItem('ovkb_user');
    const storedRepo = localStorage.getItem('ovkb_repo');
    const storedToken = localStorage.getItem('ovkb_token');

    if (isSetupMode) {
        pinSection.classList.add('hidden');
        configSection.classList.remove('hidden');
        gitUser.value = storedUser || '';
        gitRepo.value = storedRepo || '';
        gitToken.value = storedToken || '';
    }

    // PIN Validation Logic
    unlockBtn.addEventListener('click', () => {
        if (pinInput.value === MASTER_PIN) {
            pinSection.classList.add('hidden');
            if (storedUser && storedRepo && storedToken) {
                uploadSection.classList.remove('hidden');
            } else {
                // Pin correct but no config? Show gentle message or setup instructions.
                alert('PIN correct! However, the developer settings are not configured. Please use the developer setup URL.');
            }
        } else {
            pinError.classList.remove('hidden');
            pinInput.value = '';
            setTimeout(() => pinError.classList.add('hidden'), 3000);
        }
    });

    // Support 'Enter' key on PIN
    pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') unlockBtn.click();
    });

    // Save Configuration
    saveConfigBtn.addEventListener('click', () => {
        if (!gitUser.value || !gitRepo.value || !gitToken.value) {
            alert('Please fill in all details.');
            return;
        }
        localStorage.setItem('ovkb_user', gitUser.value);
        localStorage.setItem('ovkb_repo', gitRepo.value);
        localStorage.setItem('ovkb_token', gitToken.value);

        // Refresh to normal mode
        window.location.href = 'admin.html';
    });

    // Handle File Selection Preview Text
    cardImage.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileLabel.innerText = `Selected: ${e.target.files[0].name}`;
            fileLabel.style.color = '#B59B6D';
        }
    });

    // UPLOAD LOGIC
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = localStorage.getItem('ovkb_user');
        const repo = localStorage.getItem('ovkb_repo');
        const token = localStorage.getItem('ovkb_token');
        const title = document.getElementById('card-title').value;
        const file = cardImage.files[0];

        if (!file) return;

        showStatus('Saving your beautiful design...');

        try {
            // 1. Convert image to Base64
            const base64Data = await toBase64(file);
            const content = base64Data.split(',')[1];
            const fileName = `card_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const imagePath = `images/${fileName}`;

            // 2. Upload Image to GitHub
            const imgRes = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${imagePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Artist added: ${title}`,
                    content: content
                })
            });

            if (!imgRes.ok) throw new Error('Image upload failed');
            const imgData = await imgRes.json();
            const imageUrl = imgData.content.download_url;

            // 3. Update data.json
            showStatus('Updating your gallery collection...');
            const dataFileRes = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/data.json`, {
                headers: { 'Authorization': `token ${token}` }
            });

            if (!dataFileRes.ok) throw new Error('Could not find data.json');
            const dataFile = await dataFileRes.json();
            const currentData = JSON.parse(atob(dataFile.content));

            const newCard = {
                id: Date.now(),
                title: title,
                image: imageUrl,
                date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            };

            currentData.greetingCards.push(newCard);

            const updatedContent = btoa(JSON.stringify(currentData, null, 2));

            const updateRes = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/data.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Database update for: ${title}`,
                    content: updatedContent,
                    sha: dataFile.sha
                })
            });

            if (!updateRes.ok) throw new Error('Database update failed');

            showStatus('Your design is now part of the story! ✨');
            setTimeout(() => {
                hideStatus();
                uploadForm.reset();
                fileLabel.innerText = 'Click to select an image';
                fileLabel.style.color = '#999';
            }, 3000);

        } catch (error) {
            console.error(error);
            showStatus('Something went wrong. Let\'s try again soon.');
            setTimeout(hideStatus, 4000);
        }
    });

    // Helpers
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    function showStatus(text) {
        statusText.innerText = text;
        statusOverlay.classList.remove('hidden');
    }

    function hideStatus() {
        statusOverlay.classList.add('hidden');
    }
});
