document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const revealElements = document.querySelectorAll('.reveal');

    // Navigation Background Change on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Reveal Animation
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));

    // Smooth Scroll for Navigation Links (if they refer to IDs)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Background Music Logic ---
    let bgMusic = document.getElementById('bg-music');
    if (!bgMusic) {
        bgMusic = document.createElement('audio');
        bgMusic.id = 'bg-music';
        bgMusic.loop = true;
        
        // Retrieve and set saved playback position
        const savedPos = localStorage.getItem('bgm_position');
        const startPosition = savedPos ? parseFloat(savedPos) : 0;
        
        if (startPosition > 0) {
            bgMusic.addEventListener('loadedmetadata', () => {
                bgMusic.currentTime = startPosition;
            }, { once: true });
        }
        
        const source = document.createElement('source');
        source.src = '배경음악.mp3';
        source.type = 'audio/mpeg';
        bgMusic.appendChild(source);
        document.body.appendChild(bgMusic);
    }

    let musicToggle = document.getElementById('music-toggle');
    if (!musicToggle) {
        musicToggle = document.createElement('button');
        musicToggle.id = 'music-toggle';
        musicToggle.className = 'music-toggle playing';
        musicToggle.setAttribute('aria-label', '배경음악 제어');
        musicToggle.innerHTML = `
            <span class="pulse-wave"></span>
            <span class="pulse-wave wave-2"></span>
            <i class="fas fa-volume-high music-icon"></i>
        `;
        document.body.appendChild(musicToggle);
    }
    
    const musicIcon = musicToggle.querySelector('.music-icon');
    
    if (bgMusic) {
        bgMusic.volume = 0.4; // Set a pleasant, unobtrusive volume level
    }

    // Load enabled state from localStorage (default to true if not set)
    const bgmEnabled = localStorage.getItem('bgm_enabled');
    let isManuallyPaused = bgmEnabled === 'false';

    function updateMusicUI(isPlaying) {
        if (!musicToggle || !musicIcon) return;
        if (isPlaying) {
            musicToggle.classList.remove('paused');
            musicToggle.classList.add('playing');
            musicIcon.className = 'fas fa-volume-high music-icon';
        } else {
            musicToggle.classList.remove('playing');
            musicToggle.classList.add('paused');
            musicIcon.className = 'fas fa-volume-xmark music-icon';
        }
    }

    // Initialize UI based on loaded state
    updateMusicUI(!isManuallyPaused);

    function playMusic() {
        if (!bgMusic) return;
        if (isManuallyPaused) {
            updateMusicUI(false);
            return;
        }
        
        // 1. Try to play unmuted first
        bgMusic.muted = false;
        bgMusic.play().then(() => {
            updateMusicUI(true);
        }).catch(err => {
            console.log("Unmuted autoplay blocked. Trying muted autoplay...");
            // 2. Fallback to muted autoplay (always allowed by browsers)
            bgMusic.muted = true;
            bgMusic.play().then(() => {
                // UI still shows active (playing) state, since it's actually playing in the background
                updateMusicUI(true);
            }).catch(mutedErr => {
                console.log("Muted autoplay also blocked:", mutedErr);
                updateMusicUI(false);
            });
        });
    }

    function pauseMusic() {
        if (!bgMusic) return;
        bgMusic.pause();
        updateMusicUI(false);
    }

    if (bgMusic && musicToggle) {
        const isSplashViewed = sessionStorage.getItem('splash_viewed') === 'true';

        if (!isManuallyPaused && !isSplashViewed) {
            // Create splash overlay dynamically
            const splashOverlay = document.createElement('div');
            splashOverlay.className = 'splash-overlay';
            splashOverlay.innerHTML = `
                <div class="splash-content">
                    <h2 class="splash-logo">(주)비에이텍<span>.</span></h2>
                    <p class="splash-subtitle">깨끗한 물을 향한 끊임없는 기술 혁신</p>
                    <div class="splash-btn-group">
                        <button class="splash-btn" id="splash-enter-btn">
                            소리와 함께 입장하기
                        </button>
                        <button class="splash-close-btn" id="splash-close-btn" aria-label="소리 없이 입장">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                    <div class="splash-note">
                        <i class="fas fa-music"></i>
                        <span>배경음악이 자동으로 재생됩니다.</span>
                    </div>
                </div>
            `;
            document.body.appendChild(splashOverlay);

            // Attempt to pre-play muted in background
            bgMusic.muted = true;
            bgMusic.play().then(() => {
                updateMusicUI(true);
            }).catch(e => console.log("Splash background play blocked:", e));

            const enterBtn = document.getElementById('splash-enter-btn');
            const closeBtn = document.getElementById('splash-close-btn');

            if (enterBtn) {
                enterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sessionStorage.setItem('splash_viewed', 'true');
                    
                    // Unmute and play with sound
                    bgMusic.muted = false;
                    playMusic();
                    
                    // Fade out splash
                    splashOverlay.classList.add('fade-out');
                    setTimeout(() => {
                        splashOverlay.remove();
                    }, 800);
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sessionStorage.setItem('splash_viewed', 'true');
                    localStorage.setItem('bgm_enabled', 'false');
                    
                    // Silence and pause music
                    isManuallyPaused = true;
                    pauseMusic();
                    
                    // Fade out splash
                    splashOverlay.classList.add('fade-out');
                    setTimeout(() => {
                        splashOverlay.remove();
                    }, 800);
                });
            }
        } else {
            // Splash already viewed or music manually disabled
            if (!isManuallyPaused) {
                playMusic();

                // Autoplay Fallback / Unmute: Activates sound on user's first interaction
                const handleUserInteraction = () => {
                    if (!isManuallyPaused) {
                        bgMusic.muted = false;
                        if (bgMusic.paused) {
                            playMusic();
                        } else {
                            updateMusicUI(true);
                        }
                    }
                    
                    // Clean up event listeners
                    document.removeEventListener('click', handleUserInteraction);
                    document.removeEventListener('touchstart', handleUserInteraction);
                    document.removeEventListener('keydown', handleUserInteraction);
                };

                document.addEventListener('click', handleUserInteraction);
                document.addEventListener('touchstart', handleUserInteraction);
                document.addEventListener('keydown', handleUserInteraction);
            }
        }

        // Toggle button click handler
        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Remove active splash if any (unlikely, but safe)
            const activeSplash = document.querySelector('.splash-overlay');
            if (activeSplash) {
                sessionStorage.setItem('splash_viewed', 'true');
                activeSplash.remove();
            }
            
            if (bgMusic.paused || bgMusic.muted) {
                isManuallyPaused = false;
                localStorage.setItem('bgm_enabled', 'true');
                bgMusic.muted = false; // Always unmute when manually played
                playMusic();
            } else {
                isManuallyPaused = true;
                localStorage.setItem('bgm_enabled', 'false');
                pauseMusic();
            }
        });

        // Periodic position saving (Throttled to every 500ms)
        let lastSaveTime = 0;
        bgMusic.addEventListener('timeupdate', () => {
            if (!bgMusic.paused) {
                const now = Date.now();
                if (now - lastSaveTime > 500) {
                    localStorage.setItem('bgm_position', bgMusic.currentTime);
                    lastSaveTime = now;
                }
            }
        });

        // Save position right before unload/navigation
        const saveFinalPosition = () => {
            if (bgMusic && !bgMusic.paused) {
                localStorage.setItem('bgm_position', bgMusic.currentTime);
            }
        };
        window.addEventListener('beforeunload', saveFinalPosition);
        window.addEventListener('pagehide', saveFinalPosition);
    }
});

