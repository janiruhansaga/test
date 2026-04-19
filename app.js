document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    
    // Only run if the gallery grid exists on the page
    if (!galleryGrid) return;

    // Fetch data.json with cache-busting
    async function initGallery() {
        try {
            // CRITICAL: Cache-busting URL as requested
            const response = await fetch('data.json?v=' + new Date().getTime());
            
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            
            renderCards(data.greetingCards, data.whatsappNumber);
        } catch (error) {
            console.error('Error loading gallery:', error);
            galleryGrid.innerHTML = '<p class="col-span-full text-center text-gray-500 py-20 font-light italic">Unable to load designs. Please check your connection.</p>';
        }
    }

    function renderCards(cards, whatsappNumber) {
        galleryGrid.innerHTML = ''; // Clear skeleton loaders

        // Process cards (reverse to show newest first)
        [...cards].reverse().forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-container fade-in bg-white p-4 rounded-sm shadow-sm border border-gray-100 flex flex-col h-full group transition-all duration-500 hover:shadow-xl';
            
            const message = encodeURIComponent(`Hi, I would like to order this card: ${card.title}`);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

            cardEl.innerHTML = `
                <div class="relative overflow-hidden aspect-[4/5] mb-6">
                    <img 
                        src="${card.image}" 
                        alt="${card.title}" 
                        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    >
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                </div>
                <div class="flex flex-col flex-grow text-center">
                    <h3 class="serif text-xl font-bold text-charcoal mb-2">${card.title}</h3>
                    <p class="text-xs text-gray-400 uppercase tracking-widest mb-6">${card.category || 'Greeting Card'}</p>
                    
                    <div class="mt-auto">
                        <a href="${whatsappUrl}" target="_blank" 
                           class="inline-flex items-center justify-center w-full bg-charcoal text-white py-4 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-all transform active:scale-95">
                           <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.433 5.632 1.434h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                           Order via WhatsApp
                        </a>
                    </div>
                </div>
            `;
            galleryGrid.appendChild(cardEl);
        });
    }

    initGallery();
});
