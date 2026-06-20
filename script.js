document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const revealElements = document.querySelectorAll('.reveal');

    // Navigation Background Change on Scroll (Only for pages with a Hero section)
    const isHomepage = document.querySelector('.hero') !== null;
    
    // Set initial state for sub-pages
    if (!isHomepage) {
        navbar.classList.add('scrolled');
    }

    window.addEventListener('scroll', () => {
        if (!isHomepage) return; // Keep scrolled class on subpages
        
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

    // --- Background Music Autoplay & Toggle Handler (Home screen only) ---
    const audio = document.getElementById('bg-audio');
    const musicBtn = document.getElementById('music-toggle');

    if (audio && musicBtn) {
        let isPlaying = false;

        const playAudio = () => {
            if (isPlaying) return;
            audio.play().then(() => {
                isPlaying = true;
                musicBtn.classList.add('playing');
                removeInteractionListeners();
            }).catch(err => {
                console.log("Autoplay prevented by browser, waiting for user gesture.", err);
            });
        };

        const handleInteraction = () => {
            playAudio();
        };

        const addInteractionListeners = () => {
            document.addEventListener('click', handleInteraction, { passive: true });
            document.addEventListener('keydown', handleInteraction, { passive: true });
            document.addEventListener('mousedown', handleInteraction, { passive: true });
            document.addEventListener('touchstart', handleInteraction, { passive: true });
            window.addEventListener('scroll', handleInteraction, { passive: true });
        };

        const removeInteractionListeners = () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('mousedown', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
        };

        // Try to play when ready
        if (audio.readyState >= 2) {
            playAudio();
        } else {
            audio.addEventListener('canplay', () => {
                playAudio();
            }, { once: true });
        }

        // Setup fallback triggers on first interaction
        addInteractionListeners();

        // Click handler to toggle play/pause
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering document interaction handler
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
                musicBtn.classList.remove('playing');
                removeInteractionListeners(); // Keep paused, do not auto-resume
            } else {
                audio.play().then(() => {
                    isPlaying = true;
                    musicBtn.classList.add('playing');
                }).catch(err => console.log("Manual play failed:", err));
            }
        });
    }
    // --- Equipment Gallery Filtering Logic ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length > 0 && galleryItems.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                // Add active class to current button
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.classList.contains(filterValue)) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });

        // 장비 카드 내 카테고리 배지(.gallery-badge) 클릭 시 해당 카테고리 필터링 연동
        const badges = document.querySelectorAll('.gallery-badge');
        badges.forEach(badge => {
            badge.style.cursor = 'pointer';
            badge.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            badge.title = '이 카테고리로 필터링하려면 클릭하세요';

            // 마우스 오버 시 스케일 확대 및 음영 효과
            badge.addEventListener('mouseover', () => {
                badge.style.transform = 'scale(1.08)';
                badge.style.boxShadow = '0 6px 15px rgba(0,0,0,0.25)';
            });
            badge.addEventListener('mouseout', () => {
                badge.style.transform = 'scale(1)';
                badge.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
            });

            badge.addEventListener('click', (e) => {
                e.stopPropagation(); // Lightbox 오작동 방지
                const item = badge.closest('.gallery-item');
                if (item) {
                    let cat = '';
                    if (item.classList.contains('facility')) cat = 'facility';
                    else if (item.classList.contains('machinery')) cat = 'machinery';
                    
                    if (cat) {
                        // 해당하는 필터 버튼 찾아서 클릭 트리거
                        const targetBtn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
                        if (targetBtn) {
                            targetBtn.click();
                        }
                    }
                }
            });
        });
    }

    // --- 2026 Campaign PDF Card News Slider ---
    const pdfSlider = document.getElementById('pdf-slider');
    const sliderPrevBtn = document.getElementById('slider-prev');
    const sliderNextBtn = document.getElementById('slider-next');
    const pageIndicator = document.getElementById('page-indicator');
    const sliderLoading = document.getElementById('slider-loading');

    if (pdfSlider) {
        let currentSlideIndex = 0;
        let slides = [];
        let isTransitioning = false;

        const numPages = 6; // Pre-rendered PNG pages

        // Dynamically insert image slides
        for (let i = 1; i <= numPages; i++) {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'card-slide';
            slideDiv.dataset.page = i;

            const img = document.createElement('img');
            img.src = `./카드뉴스${i}.png`;
            img.alt = `카드뉴스 ${i}페이지`;
            
            slideDiv.appendChild(img);
            pdfSlider.appendChild(slideDiv);
        }

        // Hide the loader
        if (sliderLoading) {
            sliderLoading.style.display = 'none';
        }

        // Set initial active state
        slides = Array.from(pdfSlider.querySelectorAll('.card-slide'));
        if (slides.length > 0) {
            slides[0].classList.add('active');
            updatePageIndicator(1, numPages);
        }

        // Click on slider to advance
        pdfSlider.addEventListener('click', (e) => {
            if (e.target.closest('.slider-nav') || e.target.closest('.slider-pagination')) {
                return;
            }
            goToNextSlide();
        });

        function updatePageIndicator(current, total) {
            if (pageIndicator) {
                pageIndicator.textContent = `${current} / ${total}`;
            }
        }

        function goToSlide(nextIndex) {
            if (isTransitioning || slides.length === 0) return;
            isTransitioning = true;

            const total = slides.length;
            const currentIndex = currentSlideIndex;
            nextIndex = (nextIndex + total) % total;

            const currentSlide = slides[currentIndex];
            const nextSlide = slides[nextIndex];

            let isForward = nextIndex > currentIndex || (currentIndex === total - 1 && nextIndex === 0);
            if (currentIndex === 0 && nextIndex === total - 1) {
                isForward = false;
            }

            slides.forEach(slide => {
                slide.classList.remove('prev-slide');
            });

            if (isForward) {
                currentSlide.classList.remove('active');
                currentSlide.classList.add('prev-slide');

                nextSlide.style.transition = 'none';
                nextSlide.classList.remove('prev-slide', 'active');
                nextSlide.offsetHeight; // Reflow
                nextSlide.style.transition = '';
                nextSlide.classList.add('active');
            } else {
                currentSlide.classList.remove('active');

                nextSlide.style.transition = 'none';
                nextSlide.classList.add('prev-slide');
                nextSlide.classList.remove('active');
                nextSlide.offsetHeight; // Reflow
                nextSlide.style.transition = '';
                nextSlide.classList.remove('prev-slide');
                nextSlide.classList.add('active');
            }

            currentSlideIndex = nextIndex;
            updatePageIndicator(currentSlideIndex + 1, total);

            setTimeout(() => {
                isTransitioning = false;
            }, 600);
        }

        function goToNextSlide() {
            goToSlide(currentSlideIndex + 1);
        }

        function goToPrevSlide() {
            goToSlide(currentSlideIndex - 1);
        }

        if (sliderPrevBtn) {
            sliderPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                goToPrevSlide();
            });
        }

        if (sliderNextBtn) {
            sliderNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                goToNextSlide();
            });
        }
    }

    // (Note: '주요사업실적' 및 '인증등록현황' 관련 인터랙티브 제어 로직은 records.html 내에 인라인 스크립트로 개별 구현됨)

    // --- Inquiry & A/S Form Handling Engine ---
    const inquiryForm = document.getElementById('inquiry-form');
    const successView = document.getElementById('success-view');
    const inquiryCard = document.getElementById('inquiry-card');

    if (inquiryForm && successView) {
        // Elements of form inputs
        const nameInput = document.getElementById('inquiry-name');
        const emailInput = document.getElementById('inquiry-email');
        const categoryInput = document.getElementById('inquiry-category');
        const titleInput = document.getElementById('inquiry-title');
        const contentInput = document.getElementById('inquiry-content');
        const consentInput = document.getElementById('inquiry-consent');
        const btnSubmit = document.getElementById('btn-submit');
        const btnSpinner = document.getElementById('btn-spinner');

        // Elements of receipt/success view
        const receiptNo = document.getElementById('receipt-no');
        const receiptName = document.getElementById('receipt-name');
        const receiptCategory = document.getElementById('receipt-category');
        const receiptTitle = document.getElementById('receipt-title');
        const receiptDate = document.getElementById('receipt-date');
        const btnResetForm = document.getElementById('btn-reset-form');

        // Field Validation helpers
        function validateField(inputElement, errorElementId) {
            const errorElement = document.getElementById(errorElementId);
            let isValid = true;

            if (inputElement.type === 'checkbox') {
                isValid = inputElement.checked;
            } else if (inputElement.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(inputElement.value.trim());
            } else {
                isValid = inputElement.value.trim() !== '';
            }

            const formGroup = inputElement.closest('.form-group') || inputElement.closest('.form-group-checkbox');

            if (!isValid) {
                if (formGroup) formGroup.classList.add('has-error');
                if (errorElement) errorElement.style.display = 'block';
            } else {
                if (formGroup) formGroup.classList.remove('has-error');
                if (errorElement) errorElement.style.display = 'none';
            }

            return isValid;
        }

        // Real-time error clearance on input
        const inputPairs = [
            { input: nameInput, err: 'error-name' },
            { input: emailInput, err: 'error-email' },
            { input: categoryInput, err: 'error-category' },
            { input: titleInput, err: 'error-title' },
            { input: contentInput, err: 'error-content' },
            { input: consentInput, err: 'error-consent' }
        ];

        inputPairs.forEach(pair => {
            if (pair.input) {
                const eventType = pair.input.tagName === 'SELECT' || pair.input.type === 'checkbox' ? 'change' : 'input';
                pair.input.addEventListener(eventType, () => {
                    validateField(pair.input, pair.err);
                });
            }
        });

        // Form Submit Handler
        inquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate all fields
            let isFormValid = true;
            inputPairs.forEach(pair => {
                if (pair.input) {
                    const isFieldValid = validateField(pair.input, pair.err);
                    if (!isFieldValid) {
                        isFormValid = false;
                    }
                }
            });

            if (!isFormValid) {
                // Focus on the first invalid field
                const firstInvalid = inputPairs.find(pair => {
                    if (pair.input.type === 'checkbox') return !pair.input.checked;
                    if (pair.input.type === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        return !emailRegex.test(pair.input.value.trim());
                    }
                    return pair.input.value.trim() === '';
                });
                if (firstInvalid && firstInvalid.input) {
                    firstInvalid.input.focus();
                }
                return;
            }

            // Show submitting spinner & disable submit button to prevent double clicks
            if (btnSubmit) {
                btnSubmit.disabled = true;
                if (btnSpinner) btnSpinner.classList.add('active');
            }

            // Generate secure random ticket ID: BA-YYYYMMDD-XXXX (where XXXX is 4 random letters/numbers)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;
            
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let randomStr = '';
            for (let i = 0; i < 4; i++) {
                randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const ticketId = `BA-${dateStr}-${randomStr}`;

            // Gather submitted data
            const submissionData = {
                ticketId: ticketId,
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                category: categoryInput.value,
                title: titleInput.value.trim(),
                content: contentInput.value.trim(),
                submittedAt: now.toLocaleString('ko-KR')
            };

            // FormSubmit API Data (Zero-setup free email sending)
            const email = emailInput.value.trim();
            const formData = {
                _subject: `[비에이텍] 문의 접수 완료 (${categoryInput.value})`,
                "접수 번호": ticketId,
                "작성자 / 회사명": nameInput.value.trim(),
                "이메일": email,
                "문의 유형": categoryInput.value,
                "제목": titleInput.value.trim(),
                "내용": contentInput.value.trim(),
                "접수 일시": now.toLocaleString('ko-KR'),
                _replyto: email, // 이메일 답장 시 문의자에게 바로 답장 가능하도록 설정
                _cc: email // 문의 신청자 이메일로도 사본 전송
            };

            // 1. Send Inquiry details via FormSubmit API to cilly03@naver.com (site owner)
            const emailPromise = fetch("https://formsubmit.co/ajax/cilly03@naver.com", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            // 2. Send Inquiry details to Netlify Forms (if deployed on Netlify)
            const netlifyParams = new URLSearchParams();
            netlifyParams.append("form-name", "contact_company");
            netlifyParams.append("client_name", nameInput.value.trim());
            netlifyParams.append("client_email", email);
            netlifyParams.append("category", categoryInput.value);
            netlifyParams.append("title", titleInput.value.trim());
            netlifyParams.append("client_message", contentInput.value.trim());
            netlifyParams.append("consent", consentInput.checked ? "on" : "off");

            const netlifyPromise = fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: netlifyParams.toString()
            });

            // Wait for both submissions (FormSubmit & Netlify Forms) to finish
            Promise.allSettled([emailPromise, netlifyPromise])
            .then((results) => {
                const emailResult = results[0];
                if (emailResult.status === 'fulfilled' && emailResult.value.ok) {
                    console.log('?�메???�송 ?�공');
                } else {
                    console.warn('이메일 전송 실패 (네트워크 상태 또는 FormSubmit 설정을 확인하세요)');
                }
                
                const netlifyResult = results[1];
                if (netlifyResult.status === 'fulfilled' && netlifyResult.value.ok) {
                    console.log('Netlify Forms 전송 완료');
                }
            })
            .catch(err => {
                console.error('전송 중 에러 발생:', err);
            })
            .finally(() => {
                // Store silently in localStorage (100% private, not displayed anywhere on front-end)
                try {
                    const existingInquiries = JSON.parse(localStorage.getItem('batech_inquiries') || '[]');
                    existingInquiries.push(submissionData);
                    localStorage.setItem('batech_inquiries', JSON.stringify(existingInquiries));
                    console.log('Inquiry registered successfully (Private Log):', submissionData);
                } catch (err) {
                console.error('전송 중 에러 발생:', err);
                }

                // Populate success receipt elements
                if (receiptNo) receiptNo.textContent = ticketId;
                if (receiptName) receiptName.textContent = submissionData.name;
                if (receiptCategory) {
                    receiptCategory.innerHTML = `<span class="receipt-badge category-${getCategoryClass(submissionData.category)}">${submissionData.category}</span>`;
                }
                if (receiptTitle) receiptTitle.textContent = submissionData.title;
                if (receiptDate) receiptDate.textContent = submissionData.submittedAt;

                // Animate transition: fade out form, fade in success view
                inquiryForm.style.opacity = '0';
                setTimeout(() => {
                    inquiryForm.style.display = 'none';
                    successView.style.display = 'block';
                    successView.offsetHeight; // force reflow
                    successView.style.opacity = '1';
                    successView.style.transform = 'translateY(0)';
                    
                    // Smoothly scroll to card top
                    if (inquiryCard) {
                        inquiryCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 300);
            });
        });

        // Reset Form Handler
        if (btnResetForm) {
            btnResetForm.addEventListener('click', () => {
                // Clear inputs
                inquiryForm.reset();
                
                // Clear any lingering error classes and error text visibility
                inputPairs.forEach(pair => {
                    if (pair.input) {
                        const formGroup = pair.input.closest('.form-group') || pair.input.closest('.form-group-checkbox');
                        if (formGroup) formGroup.classList.remove('has-error');
                        const errorElement = document.getElementById(pair.err);
                        if (errorElement) errorElement.style.display = 'none';
                    }
                });

                // Reset submit button state
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    if (btnSpinner) btnSpinner.classList.remove('active');
                }

                // Animate transition: fade out success view, fade in form
                successView.style.opacity = '0';
                successView.style.transform = 'translateY(15px)';
                setTimeout(() => {
                    successView.style.display = 'none';
                    inquiryForm.style.display = 'block';
                    inquiryForm.offsetHeight; // force reflow
                    inquiryForm.style.opacity = '1';
                    
                    if (inquiryCard) {
                        inquiryCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 300);
            });
        }

        // Helper to categorize inquiry types for CSS styling badges
        function getCategoryClass(category) {
            switch (category) {
        case '사용 문제': return 'use-problem';
        case '고장 및 수리': return 'repair';
        case '일반 문의': return 'general';
        case '기타': return 'etc';
                default: return 'default';
            }
        }
    }

    // --- 사내 임직원용 PDF 아카이브 및 뷰어 제어 로직 (internal.html 적용) ---
    const internalLayout = document.querySelector('.internal-doc-layout');
    if (internalLayout) {
        // PDF documents metadata
        const documents = {
            'web-build': {
            fileName: '웹사이트 구축 자료.pdf',
            title: '웹사이트 구축 자료',
                size: '1.38 MB',
                tag: '웹 개발'
            },
            'prompt-guide': {
            fileName: 'Prompt작성가이드 자료.pdf',
            title: 'Prompt작성가이드 자료',
                size: '193 KB',
                tag: '프롬프트'
            },
            'data-analysis': {
            fileName: 'GenAI를 활용한 데이터 분석 자료.pdf',
            title: 'GenAI를 활용한 데이터 분석 자료',
                size: '232 KB',
                tag: '데이터 분석'
            },
            'presentation-ai': {
            fileName: '발표자료 생성 AI 자료.pdf',
            title: '발표자료 생성 AI 자료',
                size: '2.77 MB',
                tag: '발표자료 AI'
            },
            'gems-cardnews': {
            fileName: 'GEMS 가이드와 카드뉴스 제작 자료.pdf',
            title: 'GEMS 가이드와 카드뉴스 제작 자료',
                size: '444 KB',
                tag: '카드뉴스'
            }
        };

        let currentDocId = 'web-build';

        // DOM elements
        const titleEl = document.getElementById('viewer-title');
        const btnDownload = document.getElementById('btn-viewer-download');
        const docCards = document.querySelectorAll('.doc-card');
        const iframe = document.getElementById('pdf-viewer-frame');

        // Function to load a PDF document
        function loadDocument(docId) {
            currentDocId = docId;
            const docInfo = documents[docId];
            if (!docInfo) return;

            // Update viewer header title and download button href
            if (titleEl) titleEl.textContent = docInfo.fileName;
            if (btnDownload) {
                btnDownload.href = `./${encodeURIComponent(docInfo.fileName)}`;
                btnDownload.setAttribute('download', docInfo.fileName);
            }

            // Update iframe src
            if (iframe) {
                iframe.src = `./${encodeURIComponent(docInfo.fileName)}`;
            }
        }

        // Bind document sidebar card clicks
        docCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Prevent reloading if already active
                if (card.classList.contains('active')) return;

                // Update active state in UI
                docCards.forEach(c => {
                    c.classList.remove('active');
                    const viewBtn = c.querySelector('.btn-doc-action.view');
                    if (viewBtn) {
                        viewBtn.innerHTML = '<i class="fas fa-eye"></i> 바로보기';
                    }
                });
                
                card.classList.add('active');
                const activeViewBtn = card.querySelector('.btn-doc-action.view');
                if (activeViewBtn) {
                    activeViewBtn.innerHTML = '<i class="fas fa-check-circle"></i> 미리보기 중';
                }

                const docId = card.getAttribute('data-doc-id');
                loadDocument(docId);
            });

            // Also support clicking the "바로보기" (View Now) button inside cards
            const viewBtn = card.querySelector('.btn-doc-action.view');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent duplicate card click event
                    card.click();
                });
            }
        });

        // Auto-load first document on startup
        loadDocument(currentDocId);
        
        // Update first card's view button text
        const firstCard = document.querySelector('.doc-card[data-doc-id="web-build"]');
        if (firstCard) {
            const firstViewBtn = firstCard.querySelector('.btn-doc-action.view');
            if (firstViewBtn) {
                firstViewBtn.innerHTML = '<i class="fas fa-check-circle"></i> 미리보기 중';
            }
        }
    }
});


