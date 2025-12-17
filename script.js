// Embedded JavaScript for GameVault
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const themeToggle = document.getElementById('theme-toggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const addGameBtn = document.getElementById('add-game-btn');
    const clearFormBtn = document.getElementById('clear-form');
    const barcodeScanBtn = document.getElementById('barcode-scan');
    const exportBtn = document.getElementById('export-btn');
    const searchInput = document.getElementById('search-input');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const addWishlistBtn = document.getElementById('add-wishlist-item');
    const startScanBtn = document.getElementById('start-scan');
    const mockScanBtn = document.getElementById('mock-scan');
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    const editGameBtn = document.getElementById('edit-game');
    const deleteGameBtn = document.getElementById('delete-game');
    
    // Modal elements
    const barcodeModal = document.getElementById('barcode-modal');
    const gameModal = document.getElementById('game-modal');
    
    // Form elements
    const gameTitle = document.getElementById('game-title');
    const gamePlatform = document.getElementById('game-platform');
    const releaseYear = document.getElementById('release-year');
    const genre = document.getElementById('genre');
    const purchaseDate = document.getElementById('purchase-date');
    const price = document.getElementById('price');
    const formatRadios = document.querySelectorAll('input[name="format"]');
    const ownershipRadios = document.querySelectorAll('input[name="ownership"]');
    const edition = document.getElementById('edition');
    const condition = document.getElementById('condition');
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('rating-value');
    const coverImage = document.getElementById('cover-image');
    const imagePreview = document.getElementById('image-preview');
    
    // State variables
    let games = JSON.parse(localStorage.getItem('gameVaultGames')) || [];
    let wishlist = JSON.parse(localStorage.getItem('gameVaultWishlist')) || [];
    let currentPage = 1;
    const gamesPerPage = 9;
    let currentFilters = {
        platform: [],
        genre: [],
        ownership: 'all',
        search: '',
        sortBy: 'date-added'
    };
    let selectedGameId = null;
    
    // Initialize with sample data if empty
    if (games.length === 0) {
        initializeSampleData();
    }
    
    // Initialize charts
    let genreChart, platformChart;
    
    // Theme Toggle
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            themeToggle.title = "Switch to light mode";
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            themeToggle.title = "Switch to dark mode";
        }
        updateCharts();
    });
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // Update active nav link
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
            
            // Update dashboard when navigating to it
            if (targetId === 'dashboard') {
                updateDashboard();
            }
            
            // Update collection when navigating to it
            if (targetId === 'collection') {
                renderCollection();
            }
            
            // Update wishlist when navigating to it
            if (targetId === 'wishlist') {
                renderWishlist();
            }
        });
    });
    
    // Star Rating
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            ratingValue.value = value;
            updateStarRating(value);
        });
        
        star.addEventListener('mouseover', function() {
            const value = parseInt(this.getAttribute('data-value'));
            highlightStars(value);
        });
        
        star.addEventListener('mouseout', function() {
            const currentRating = parseInt(ratingValue.value);
            updateStarRating(currentRating);
        });
    });
    
    // Image preview
    coverImage.addEventListener('input', function() {
        const url = this.value;
        if (url) {
            imagePreview.innerHTML = `<img src="${url}" alt="Game Cover Preview" onerror="this.onerror=null; this.parentElement.innerHTML='<p>Failed to load image</p>';">`;
        } else {
            imagePreview.innerHTML = '<p>No image preview</p>';
        }
    });
    
    // Add Game
    addGameBtn.addEventListener('click', function() {
        if (!validateGameForm()) return;
        
        const game = {
            id: Date.now(),
            title: gameTitle.value,
            platform: gamePlatform.value,
            releaseYear: releaseYear.value ? parseInt(releaseYear.value) : null,
            genre: genre.value,
            purchaseDate: purchaseDate.value,
            price: price.value ? parseFloat(price.value) : 0,
            format: document.querySelector('input[name="format"]:checked').value,
            ownership: document.querySelector('input[name="ownership"]:checked').value,
            edition: edition.value,
            condition: condition.value,
            rating: parseInt(ratingValue.value),
            coverImage: coverImage.value || getDefaultCover(gamePlatform.value),
            addedDate: new Date().toISOString()
        };
        
        if (game.ownership === 'wishlist') {
            wishlist.push(game);
            localStorage.setItem('gameVaultWishlist', JSON.stringify(wishlist));
        } else {
            games.push(game);
            localStorage.setItem('gameVaultGames', JSON.stringify(games));
        }
        
        clearForm();
        showNotification('Game added successfully!', 'success');
        
        // Update UI based on current section
        const activeSection = document.querySelector('.section.active');
        if (activeSection.id === 'collection' || activeSection.id === 'dashboard') {
            renderCollection();
            updateDashboard();
        } else if (activeSection.id === 'wishlist') {
            renderWishlist();
            updateDashboard();
        }
    });
    
    // Clear Form
    clearFormBtn.addEventListener('click', clearForm);
    
    // Barcode Scanning
    barcodeScanBtn.addEventListener('click', function() {
        barcodeModal.classList.add('active');
    });
    
    startScanBtn.addEventListener('click', function() {
        showNotification('Barcode scanning would require a mobile app with camera access.', 'info');
    });
    
    mockScanBtn.addEventListener('click', function() {
        // Mock scan with sample data
        gameTitle.value = "The Legend of Zelda: Breath of the Wild";
        gamePlatform.value = "switch";
        releaseYear.value = "2017";
        genre.value = "adventure";
        purchaseDate.value = "2023-05-15";
        price.value = "59.99";
        document.querySelector('input[name="format"][value="physical"]').checked = true;
        document.querySelector('input[name="ownership"][value="owned"]').checked = true;
        edition.value = "standard";
        condition.value = "new";
        updateStarRating(5);
        ratingValue.value = "5";
        coverImage.value = "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg";
        imagePreview.innerHTML = `<img src="${coverImage.value}" alt="Game Cover Preview">`;
        
        barcodeModal.classList.remove('active');
        showNotification('Mock barcode scan completed!', 'success');
    });
    
    // Export to CSV
    exportBtn.addEventListener('click', function() {
        const allGames = [...games, ...wishlist];
        if (allGames.length === 0) {
            showNotification('No games to export.', 'warning');
            return;
        }
        
        // Convert to CSV
        const headers = ['Title', 'Platform', 'Release Year', 'Genre', 'Purchase Date', 'Price', 'Format', 'Ownership', 'Edition', 'Condition', 'Rating'];
        const csvRows = [headers.join(',')];
        
        allGames.forEach(game => {
            const row = [
                `"${game.title}"`,
                game.platform,
                game.releaseYear || '',
                game.genre,
                game.purchaseDate,
                game.price,
                game.format,
                game.ownership,
                game.edition,
                game.condition,
                game.rating
            ];
            csvRows.push(row.join(','));
        });
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gamevault-export-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Export completed!', 'success');
    });
    
    // Search and Filters
    searchInput.addEventListener('keyup', function() {
        currentFilters.search = this.value;
        currentPage = 1;
        renderCollection();
    });
    
    applyFiltersBtn.addEventListener('click', function() {
        const platformSelect = document.getElementById('filter-platform');
        const genreSelect = document.getElementById('filter-genre');
        const ownershipSelect = document.getElementById('filter-ownership');
        const sortSelect = document.getElementById('sort-by');
        
        currentFilters.platform = Array.from(platformSelect.selectedOptions).map(opt => opt.value);
        currentFilters.genre = Array.from(genreSelect.selectedOptions).map(opt => opt.value);
        currentFilters.ownership = ownershipSelect.value;
        currentFilters.sortBy = sortSelect.value;
        currentPage = 1;
        
        renderCollection();
    });
    
    clearFiltersBtn.addEventListener('click', function() {
        document.getElementById('filter-platform').selectedIndex = -1;
        document.getElementById('filter-genre').selectedIndex = -1;
        document.getElementById('filter-ownership').value = 'all';
        document.getElementById('sort-by').value = 'date-added';
        searchInput.value = '';
        
        currentFilters = {
            platform: [],
            genre: [],
            ownership: 'all',
            search: '',
            sortBy: 'date-added'
        };
        
        renderCollection();
    });
    
    // Pagination
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderCollection();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        const filteredGames = getFilteredGames();
        const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderCollection();
        }
    });
    
    // Add Wishlist Item
    addWishlistBtn.addEventListener('click', function() {
        // Switch to add game section with wishlist pre-selected
        document.querySelector('a[href="#add-game"]').click();
        document.querySelector('input[name="ownership"][value="wishlist"]').checked = true;
    });
    
    // Modal Close
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            barcodeModal.classList.remove('active');
            gameModal.classList.remove('active');
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === barcodeModal) {
            barcodeModal.classList.remove('active');
        }
        if (e.target === gameModal) {
            gameModal.classList.remove('active');
        }
    });
    
    // Edit Game
    editGameBtn.addEventListener('click', function() {
        if (!selectedGameId) return;
        
        const game = games.find(g => g.id === selectedGameId) || 
                    wishlist.find(g => g.id === selectedGameId);
        
        if (!game) return;
        
        // Switch to add game section and populate form
        document.querySelector('a[href="#add-game"]').click();
        
        gameTitle.value = game.title;
        gamePlatform.value = game.platform;
        releaseYear.value = game.releaseYear || '';
        genre.value = game.genre || '';
        purchaseDate.value = game.purchaseDate || '';
        price.value = game.price || '';
        
        const formatRadio = document.querySelector(`input[name="format"][value="${game.format}"]`);
        if (formatRadio) formatRadio.checked = true;
        
        const ownershipRadio = document.querySelector(`input[name="ownership"][value="${game.ownership}"]`);
        if (ownershipRadio) ownershipRadio.checked = true;
        
        edition.value = game.edition || 'standard';
        condition.value = game.condition || 'new';
        updateStarRating(game.rating);
        ratingValue.value = game.rating;
        coverImage.value = game.coverImage || '';
        
        if (game.coverImage) {
            imagePreview.innerHTML = `<img src="${game.coverImage}" alt="Game Cover Preview">`;
        }
        
        // Update add button text
        addGameBtn.textContent = 'Update Game';
        addGameBtn.onclick = function() {
            updateGame(game.id);
        };
        
        gameModal.classList.remove('active');
    });
    
    // Delete Game
    deleteGameBtn.addEventListener('click', function() {
        if (!selectedGameId) return;
        
        if (confirm('Are you sure you want to delete this game from your collection?')) {
            // Remove from games or wishlist
            const gameIndex = games.findIndex(g => g.id === selectedGameId);
            if (gameIndex !== -1) {
                games.splice(gameIndex, 1);
                localStorage.setItem('gameVaultGames', JSON.stringify(games));
            } else {
                const wishlistIndex = wishlist.findIndex(g => g.id === selectedGameId);
                if (wishlistIndex !== -1) {
                    wishlist.splice(wishlistIndex, 1);
                    localStorage.setItem('gameVaultWishlist', JSON.stringify(wishlist));
                }
            }
            
            showNotification('Game deleted successfully!', 'success');
            gameModal.classList.remove('active');
            renderCollection();
            renderWishlist();
            updateDashboard();
        }
    });
    
    // Initialize the dashboard
    updateDashboard();
    renderCollection();
    
    // Functions
    function updateStarRating(rating) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= rating) {
                star.innerHTML = '<i class="fas fa-star"></i>';
                star.classList.add('active');
            } else {
                star.innerHTML = '<i class="far fa-star"></i>';
                star.classList.remove('active');
            }
        });
    }
    
    function highlightStars(rating) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= rating) {
                star.innerHTML = '<i class="fas fa-star"></i>';
            } else {
                star.innerHTML = '<i class="far fa-star"></i>';
            }
        });
    }
    
    function validateGameForm() {
        if (!gameTitle.value.trim()) {
            showNotification('Please enter a game title.', 'error');
            gameTitle.focus();
            return false;
        }
        
        if (!gamePlatform.value) {
            showNotification('Please select a platform.', 'error');
            gamePlatform.focus();
            return false;
        }
        
        return true;
    }
    
    function clearForm() {
        gameTitle.value = '';
        gamePlatform.value = '';
        releaseYear.value = '';
        genre.value = '';
        purchaseDate.value = '';
        price.value = '';
        document.querySelector('input[name="format"][value="physical"]').checked = true;
        document.querySelector('input[name="ownership"][value="owned"]').checked = true;
        edition.value = 'standard';
        condition.value = 'new';
        updateStarRating(0);
        ratingValue.value = '0';
        coverImage.value = '';
        imagePreview.innerHTML = '<p>No image preview</p>';
        
        // Reset add button
        addGameBtn.textContent = 'Add Game to Collection';
        addGameBtn.onclick = function() {
            addGameBtn.click();
        };
    }
    
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '6px';
        notification.style.color = 'white';
        notification.style.fontWeight = '500';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.animation = 'slideIn 0.3s ease';
        
        // Set color based on type
        if (type === 'success') {
            notification.style.backgroundColor = '#00b894';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#e17055';
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#fdcb6e';
            notification.style.color = '#2d3436';
        } else {
            notification.style.backgroundColor = '#6c5ce7';
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    function getDefaultCover(platform) {
        const covers = {
            'playstation': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
            'xbox': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
            'switch': 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w-600&q=80',
            'pc-steam': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
            'other': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
        };
        
        return covers[platform] || covers['other'];
    }
    
    function initializeSampleData() {
        const sampleGames = [
            {
                id: 1,
                title: "The Legend of Zelda: Breath of the Wild",
                platform: "switch",
                releaseYear: 2017,
                genre: "adventure",
                purchaseDate: "2023-05-15",
                price: 59.99,
                format: "physical",
                ownership: "owned",
                edition: "standard",
                condition: "new",
                rating: 5,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg",
                addedDate: "2023-05-15"
            },
            {
                id: 2,
                title: "God of War Ragnarök",
                platform: "playstation",
                releaseYear: 2022,
                genre: "action",
                purchaseDate: "2022-11-10",
                price: 69.99,
                format: "physical",
                ownership: "owned",
                edition: "standard",
                condition: "used-good",
                rating: 5,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/e/ee/God_of_War_Ragnar%C3%B6k_cover.jpg",
                addedDate: "2022-11-10"
            },
            {
                id: 3,
                title: "Halo Infinite",
                platform: "xbox",
                releaseYear: 2021,
                genre: "shooter",
                purchaseDate: "2021-12-08",
                price: 59.99,
                format: "digital",
                ownership: "owned",
                edition: "standard",
                condition: "new",
                rating: 4,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/1/14/Halo_Infinite.png",
                addedDate: "2021-12-08"
            },
            {
                id: 4,
                title: "Elden Ring",
                platform: "pc-steam",
                releaseYear: 2022,
                genre: "rpg",
                purchaseDate: "2022-02-25",
                price: 59.99,
                format: "digital",
                ownership: "owned",
                edition: "deluxe",
                condition: "new",
                rating: 5,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg",
                addedDate: "2022-02-25"
            },
            {
                id: 5,
                title: "Super Mario Odyssey",
                platform: "switch",
                releaseYear: 2017,
                genre: "adventure",
                purchaseDate: "2020-03-10",
                price: 49.99,
                format: "physical",
                ownership: "owned",
                edition: "standard",
                condition: "used-good",
                rating: 5,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey.jpg",
                addedDate: "2020-03-10"
            },
            {
                id: 6,
                title: "Cyberpunk 2077",
                platform: "pc-gog",
                releaseYear: 2020,
                genre: "rpg",
                purchaseDate: "2021-06-20",
                price: 39.99,
                format: "digital",
                ownership: "owned",
                edition: "standard",
                condition: "new",
                rating: 3,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg",
                addedDate: "2021-06-20"
            }
        ];
        
        const sampleWishlist = [
            {
                id: 7,
                title: "Starfield",
                platform: "pc-steam",
                releaseYear: 2023,
                genre: "rpg",
                purchaseDate: "",
                price: 69.99,
                format: "digital",
                ownership: "wishlist",
                edition: "standard",
                condition: "new",
                rating: 0,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Starfield_steam_header.jpg/2560px-Starfield_steam_header.jpg",
                addedDate: "2023-07-01"
            },
            {
                id: 8,
                title: "Final Fantasy XVI",
                platform: "playstation",
                releaseYear: 2023,
                genre: "rpg",
                purchaseDate: "",
                price: 69.99,
                format: "physical",
                ownership: "wishlist",
                edition: "collector",
                condition: "new",
                rating: 0,
                coverImage: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Final_Fantasy_XVI_cover_art.jpg/2560px-Final_Fantasy_XVI_cover_art.jpg",
                addedDate: "2023-06-22"
            }
        ];
        
        games = sampleGames;
        wishlist = sampleWishlist;
        localStorage.setItem('gameVaultGames', JSON.stringify(games));
        localStorage.setItem('gameVaultWishlist', JSON.stringify(wishlist));
    }
    
    function updateDashboard() {
        // Update stats
        const totalGames = games.length;
        const wishlistCount = wishlist.length;
        const collectionValue = games.reduce((sum, game) => sum + (game.price || 0), 0);
        
        // Find most represented platform
        const platformCounts = {};
        games.forEach(game => {
            platformCounts[game.platform] = (platformCounts[game.platform] || 0) + 1;
        });
        
        let topPlatform = 'N/A';
        let maxCount = 0;
        for (const platform in platformCounts) {
            if (platformCounts[platform] > maxCount) {
                maxCount = platformCounts[platform];
                topPlatform = getPlatformName(platform);
            }
        }
        
        document.getElementById('total-games').textContent = totalGames;
        document.getElementById('wishlist-count').textContent = wishlistCount;
        document.getElementById('collection-value').textContent = `$${collectionValue.toFixed(2)}`;
        document.getElementById('top-platform').textContent = topPlatform;
        
        // Update recent games
        updateRecentGames();
        
        // Update charts
        updateCharts();
    }
    
    function updateRecentGames() {
        const recentGamesContainer = document.getElementById('recent-games-list');
        const recentGames = [...games]
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, 3);
        
        recentGamesContainer.innerHTML = '';
        
        recentGames.forEach(game => {
            const gameCard = createGameCard(game);
            recentGamesContainer.appendChild(gameCard);
        });
    }
    
    function updateCharts() {
        // Genre distribution
        const genreData = {};
        games.forEach(game => {
            if (game.genre) {
                genreData[game.genre] = (genreData[game.genre] || 0) + 1;
            }
        });
        
        const genreCtx = document.getElementById('genre-chart').getContext('2d');
        
        // Destroy previous chart if exists
        if (genreChart) {
            genreChart.destroy();
        }
        
        const genreColors = [
            '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#fdcb6e',
            '#e17055', '#0984e3', '#00cec9', '#fab1a0', '#74b9ff'
        ];
        
        genreChart = new Chart(genreCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(genreData),
                datasets: [{
                    data: Object.values(genreData),
                    backgroundColor: genreColors.slice(0, Object.keys(genreData).length),
                    borderWidth: 2,
                    borderColor: document.body.classList.contains('dark-mode') ? '#353b48' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                            font: {
                                family: "'Poppins', sans-serif"
                            }
                        }
                    }
                }
            }
        });
        
        // Platform distribution
        const platformData = {};
        games.forEach(game => {
            const platformName = getPlatformName(game.platform);
            platformData[platformName] = (platformData[platformName] || 0) + 1;
        });
        
        const platformCtx = document.getElementById('platform-chart').getContext('2d');
        
        // Destroy previous chart if exists
        if (platformChart) {
            platformChart.destroy();
        }
        
        platformChart = new Chart(platformCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(platformData),
                datasets: [{
                    label: 'Games',
                    data: Object.values(platformData),
                    backgroundColor: '#6c5ce7',
                    borderColor: '#6c5ce7',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                            font: {
                                family: "'Poppins', sans-serif"
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color')
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                            font: {
                                family: "'Poppins', sans-serif"
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color')
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                            font: {
                                family: "'Poppins', sans-serif"
                            }
                        }
                    }
                }
            }
        });
    }
    
    function getFilteredGames() {
        let filtered = [...games];
        
        // Apply search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filtered = filtered.filter(game => 
                game.title.toLowerCase().includes(searchTerm) ||
                (game.genre && game.genre.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply platform filter
        if (currentFilters.platform.length > 0) {
            filtered = filtered.filter(game => 
                currentFilters.platform.includes(game.platform)
            );
        }
        
        // Apply genre filter
        if (currentFilters.genre.length > 0) {
            filtered = filtered.filter(game => 
                game.genre && currentFilters.genre.includes(game.genre)
            );
        }
        
        // Apply sort
        switch (currentFilters.sortBy) {
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'release-year':
                filtered.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
                break;
            case 'price':
                filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            default: // date-added
                filtered.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
        }
        
        return filtered;
    }
    
    function renderCollection() {
        const collectionContainer = document.getElementById('collection-list');
        const filteredGames = getFilteredGames();
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
        const startIndex = (currentPage - 1) * gamesPerPage;
        const endIndex = startIndex + gamesPerPage;
        const gamesToShow = filteredGames.slice(startIndex, endIndex);
        
        // Update page info
        document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;
        
        // Enable/disable pagination buttons
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        // Clear container
        collectionContainer.innerHTML = '';
        
        if (gamesToShow.length === 0) {
            collectionContainer.innerHTML = `
                <div class="no-games">
                    <i class="fas fa-gamepad"></i>
                    <h3>No games found</h3>
                    <p>Try adjusting your filters or add some games to your collection.</p>
                </div>
            `;
            return;
        }
        
        // Add game cards
        gamesToShow.forEach(game => {
            const gameCard = createGameCard(game);
            collectionContainer.appendChild(gameCard);
        });
    }
    
    function renderWishlist() {
        const wishlistContainer = document.getElementById('wishlist-list');
        const sortBy = document.getElementById('wishlist-sort').value;
        
        let sortedWishlist = [...wishlist];
        
        // Apply sorting
        switch (sortBy) {
            case 'title':
                sortedWishlist.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'priority':
                sortedWishlist.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'price':
                sortedWishlist.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            default: // date-added
                sortedWishlist.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
        }
        
        wishlistContainer.innerHTML = '';
        
        if (sortedWishlist.length === 0) {
            wishlistContainer.innerHTML = `
                <div class="no-games">
                    <i class="fas fa-star"></i>
                    <h3>Your wishlist is empty</h3>
                    <p>Add games you want to buy in the future.</p>
                </div>
            `;
            return;
        }
        
        sortedWishlist.forEach(game => {
            const gameCard = createGameCard(game);
            wishlistContainer.appendChild(gameCard);
        });
    }
    
    function createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.id = game.id;
        
        const platformName = getPlatformName(game.platform);
        const platformIcon = getPlatformIcon(game.platform);
        const ratingStars = getStarRatingHTML(game.rating);
        const priceText = game.price ? `$${game.price.toFixed(2)}` : 'N/A';
        const purchaseDateText = game.purchaseDate ? formatDate(game.purchaseDate) : 'Not purchased';
        
        card.innerHTML = `
            <div class="game-card-cover">
                <img src="${game.coverImage || getDefaultCover(game.platform)}" alt="${game.title} Cover" onerror="this.onerror=null; this.src='${getDefaultCover(game.platform)}';">
            </div>
            <div class="game-card-info">
                <h3 class="game-card-title">${game.title}</h3>
                <div class="game-card-details">
                    <span class="game-card-platform">${platformIcon} ${platformName}</span>
                    <span class="game-card-rating">${ratingStars}</span>
                </div>
                <div class="game-card-details">
                    <span>${game.releaseYear || 'N/A'}</span>
                    <span>${game.genre || 'N/A'}</span>
                    <span class="game-card-price">${priceText}</span>
                </div>
                <div class="game-card-actions">
                    <button class="btn-secondary view-details">Details</button>
                    <span class="game-card-ownership">${game.ownership === 'wishlist' ? 'Wishlist' : 'Owned'}</span>
                </div>
            </div>
        `;
        
        // Add event listener for details button
        card.querySelector('.view-details').addEventListener('click', function() {
            showGameDetails(game.id);
        });
        
        return card;
    }
    
    function showGameDetails(gameId) {
        selectedGameId = gameId;
        
        const game = games.find(g => g.id === gameId) || 
                    wishlist.find(g => g.id === gameId);
        
        if (!game) return;
        
        // Populate modal with game details
        document.getElementById('modal-game-title').textContent = game.title;
        document.getElementById('modal-platform').textContent = getPlatformName(game.platform);
        document.getElementById('modal-year').textContent = game.releaseYear || 'N/A';
        document.getElementById('modal-genre').textContent = game.genre || 'N/A';
        document.getElementById('modal-format').textContent = game.format === 'physical' ? 'Physical' : 'Digital';
        document.getElementById('modal-edition').textContent = game.edition === 'standard' ? 'Standard Edition' : 
                                                              game.edition === 'collector' ? "Collector's Edition" :
                                                              game.edition === 'deluxe' ? 'Deluxe Edition' :
                                                              game.edition === 'ultimate' ? 'Ultimate Edition' : 'Other';
        document.getElementById('modal-condition').textContent = game.format === 'physical' ? 
            (game.condition === 'new' ? 'New' : 
             game.condition === 'used-good' ? 'Used - Good' :
             game.condition === 'used-fair' ? 'Used - Fair' : 'Used - Poor') : 'N/A';
        document.getElementById('modal-purchase-date').textContent = game.purchaseDate ? formatDate(game.purchaseDate) : 'Not purchased';
        document.getElementById('modal-price').textContent = game.price ? `$${game.price.toFixed(2)}` : 'N/A';
        document.getElementById('modal-rating').innerHTML = getStarRatingHTML(game.rating);
        
        const coverImg = document.getElementById('modal-cover');
        coverImg.src = game.coverImage || getDefaultCover(game.platform);
        coverImg.alt = `${game.title} Cover`;
        
        // Show modal
        gameModal.classList.add('active');
    }
    
    function updateGame(gameId) {
        if (!validateGameForm()) return;
        
        // Find the game in games or wishlist
        let gameIndex = games.findIndex(g => g.id === gameId);
        let targetArray = games;
        
        if (gameIndex === -1) {
            gameIndex = wishlist.findIndex(g => g.id === gameId);
            targetArray = wishlist;
        }
        
        if (gameIndex === -1) return;
        
        // Update the game
        targetArray[gameIndex] = {
            ...targetArray[gameIndex],
            title: gameTitle.value,
            platform: gamePlatform.value,
            releaseYear: releaseYear.value ? parseInt(releaseYear.value) : null,
            genre: genre.value,
            purchaseDate: purchaseDate.value,
            price: price.value ? parseFloat(price.value) : 0,
            format: document.querySelector('input[name="format"]:checked').value,
            ownership: document.querySelector('input[name="ownership"]:checked').value,
            edition: edition.value,
            condition: condition.value,
            rating: parseInt(ratingValue.value),
            coverImage: coverImage.value || getDefaultCover(gamePlatform.value)
        };
        
        // If ownership changed, move between arrays
        const newOwnership = document.querySelector('input[name="ownership"]:checked').value;
        if (targetArray === games && newOwnership === 'wishlist') {
            // Move from games to wishlist
            const gameToMove = targetArray.splice(gameIndex, 1)[0];
            wishlist.push(gameToMove);
        } else if (targetArray === wishlist && newOwnership === 'owned') {
            // Move from wishlist to games
            const gameToMove = targetArray.splice(gameIndex, 1)[0];
            games.push(gameToMove);
        }
        
        // Save to localStorage
        localStorage.setItem('gameVaultGames', JSON.stringify(games));
        localStorage.setItem('gameVaultWishlist', JSON.stringify(wishlist));
        
        // Clear form and update UI
        clearForm();
        showNotification('Game updated successfully!', 'success');
        
        renderCollection();
        renderWishlist();
        updateDashboard();
    }
    
    function getPlatformName(platformCode) {
        const platforms = {
            'playstation': 'PlayStation',
            'xbox': 'Xbox',
            'switch': 'Nintendo Switch',
            'pc-steam': 'PC (Steam)',
            'pc-epic': 'PC (Epic Games)',
            'pc-gog': 'PC (GOG)',
            'pc-other': 'PC (Other)',
            'other': 'Other'
        };
        
        return platforms[platformCode] || platformCode;
    }
    
    function getPlatformIcon(platformCode) {
        const icons = {
            'playstation': 'fab fa-playstation',
            'xbox': 'fab fa-xbox',
            'switch': 'fas fa-gamepad',
            'pc-steam': 'fab fa-steam',
            'pc-epic': 'fas fa-desktop',
            'pc-gog': 'fas fa-compact-disc',
            'pc-other': 'fas fa-desktop',
            'other': 'fas fa-gamepad'
        };
        
        return `<i class="${icons[platformCode] || 'fas fa-gamepad'}"></i>`;
    }
    
    function getStarRatingHTML(rating) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        
        return starsHTML;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    // Add CSS for notifications
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .no-games {
            grid-column: 1 / -1;
            text-align: center;
            padding: 50px 20px;
            color: var(--text-light);
        }
        
        .no-games i {
            font-size: 4rem;
            margin-bottom: 20px;
            color: var(--border-color);
        }
        
        .no-games h3 {
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // Initialize charts
    setTimeout(() => {
        updateCharts();
    }, 500);
});
