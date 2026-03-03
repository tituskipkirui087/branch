/**
 * Branch Kenya - Landing Page Script
 * Handles loan calculator, form validation, and interactive features
 */

(function() {
    'use strict';

    // ========================================
    // Loan Calculator
    // ========================================
    const calculator = {
        // Interest rate (12% APR)
        interestRate: 0.12,
        
        // DOM Elements
        elements: {
            amountInput: null,
            amountSlider: null,
            termSelect: null,
            monthlyPayment: null,
            totalRepayment: null
        },

        // Initialize calculator
        init: function() {
            // Main calculator
            this.elements.amountInput = document.getElementById('calcAmount');
            this.elements.amountSlider = document.getElementById('calcSlider');
            this.elements.termSelect = document.getElementById('calcTerm');
            this.elements.monthlyPayment = document.getElementById('monthlyPayment');
            this.elements.totalRepayment = document.getElementById('totalRepayment');

            // Hero calculator
            this.elements.heroAmountInput = document.getElementById('heroCalcAmount');
            this.elements.heroAmountSlider = document.getElementById('heroCalcSlider');
            this.elements.heroTermSelect = document.getElementById('heroCalcTerm');
            this.elements.heroMonthlyPayment = document.getElementById('heroMonthlyPayment');
            this.elements.heroTotalRepayment = document.getElementById('heroTotalRepayment');

            if (!this.elements.amountInput || !this.elements.amountSlider) {
                return;
            }

            // Bind events
            this.bindEvents();
            
            // Initial calculation
            this.calculate();
            
            // Initialize slider gradient
            this.updateSliderGradient();
            
            // Also initialize hero calculator if exists
            if (this.elements.heroAmountInput) {
                this.bindHeroEvents();
                this.calculateHero();
                this.updateHeroSliderGradient();
            }
        },

        // Bind event listeners
        bindEvents: function() {
            // Amount input change
            this.elements.amountInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                value = this.clamp(value, 3000, 1000000);
                this.elements.amountSlider.value = value;
                this.updateSliderGradient();
                this.calculate();
            });

            // Amount slider change
            this.elements.amountSlider.addEventListener('input', (e) => {
                this.elements.amountInput.value = parseInt(e.target.value);
                this.updateSliderGradient();
                this.calculate();
            });

            // Term select change
            this.elements.termSelect.addEventListener('change', () => {
                this.calculate();
            });
        },

        // Bind event listeners for hero calculator
        bindHeroEvents: function() {
            // Amount input change
            this.elements.heroAmountInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                value = this.clamp(value, 3000, 1000000);
                this.elements.heroAmountSlider.value = value;
                this.updateHeroSliderGradient();
                this.calculateHero();
            });

            // Amount slider change
            this.elements.heroAmountSlider.addEventListener('input', (e) => {
                this.elements.heroAmountInput.value = parseInt(e.target.value);
                this.updateHeroSliderGradient();
                this.calculateHero();
            });

            // Term select change
            this.elements.heroTermSelect.addEventListener('change', () => {
                this.calculateHero();
            });
        },

        // Clamp value between min and max
        clamp: function(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        // Format number as KES currency
        formatCurrency: function(amount) {
            return 'KES ' + amount.toLocaleString('en-KE', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },

        // Calculate loan payments
        calculate: function() {
            const principal = parseInt(this.elements.amountInput.value);
            const termMonths = parseInt(this.elements.termSelect.value);
            
            if (!principal || !termMonths) {
                return;
            }

            // Calculate monthly interest rate
            const monthlyRate = this.interestRate / 12;
            
            // Calculate monthly payment using amortization formula
            // M = P * [r(1+r)^n] / [(1+r)^n - 1]
            let monthlyPayment;
            if (monthlyRate === 0) {
                monthlyPayment = principal / termMonths;
            } else {
                const factor = Math.pow(1 + monthlyRate, termMonths);
                monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
            }

            // Calculate total repayment
            const totalRepayment = monthlyPayment * termMonths;

            // Update display
            if (this.elements.monthlyPayment) {
                this.elements.monthlyPayment.textContent = this.formatCurrency(Math.round(monthlyPayment));
            }
            
            if (this.elements.totalRepayment) {
                this.elements.totalRepayment.textContent = this.formatCurrency(Math.round(totalRepayment));
            }

            // Store values for application form
            this.storeValues(principal, termMonths, Math.round(monthlyPayment), Math.round(totalRepayment));
        },

        // Store calculator values in localStorage for application form
        storeValues: function(principal, term, monthlyPayment, totalRepayment) {
            try {
                localStorage.setItem('branchKenya_loanDetails', JSON.stringify({
                    principal: principal,
                    term: term,
                    monthlyPayment: monthlyPayment,
                    totalRepayment: totalRepayment,
                    interestRate: this.interestRate
                }));
            } catch (e) {
                console.log('LocalStorage not available');
            }
        },

        // Update slider gradient to show progress
        updateSliderGradient: function() {
            const slider = this.elements.amountSlider;
            const min = parseInt(slider.min) || 3000;
            const max = parseInt(slider.max) || 1000000;
            const value = parseInt(slider.value);
            const percentage = ((value - min) / (max - min)) * 100;
            slider.style.setProperty('--slider-progress', percentage + '%');
        },

        // Update hero slider gradient to show progress
        updateHeroSliderGradient: function() {
            const slider = this.elements.heroAmountSlider;
            if (!slider) return;
            const min = parseInt(slider.min) || 3000;
            const max = parseInt(slider.max) || 1000000;
            const value = parseInt(slider.value);
            const percentage = ((value - min) / (max - min)) * 100;
            slider.style.setProperty('--slider-progress', percentage + '%');
        },

        // Calculate hero loan payments
        calculateHero: function() {
            const principal = parseInt(this.elements.heroAmountInput.value);
            const termMonths = parseInt(this.elements.heroTermSelect.value);
            
            if (!principal || !termMonths) {
                return;
            }

            // Calculate monthly interest rate
            const monthlyRate = this.interestRate / 12;
            
            // Calculate monthly payment using amortization formula
            const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
            const totalRepayment = monthlyPayment * termMonths;

            // Update display
            this.elements.heroMonthlyPayment.textContent = this.formatCurrency(Math.round(monthlyPayment));
            this.elements.heroTotalRepayment.textContent = this.formatCurrency(Math.round(totalRepayment));
        }
    };

    // ========================================
    // Navigation
    // ========================================
    const navigation = {
        init: function() {
            // Smooth scroll for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute('href'));
                    if (target) {
                        const navHeight = document.querySelector('.navbar').offsetHeight;
                        const targetPosition = target.offsetTop - navHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // Navbar scroll effect
            this.handleScroll();
            window.addEventListener('scroll', () => this.handleScroll());
        },

        handleScroll: function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.boxShadow = 'var(--shadow-md)';
            } else {
                navbar.style.boxShadow = 'var(--shadow-sm)';
            }
        }
    };

    // ========================================
    // Animations
    // ========================================
    const animations = {
        init: function() {
            // Intersection Observer for scroll animations
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Observe elements
            document.querySelectorAll('.feature-card, .review-card, .security-item').forEach(el => {
                observer.observe(el);
            });
        }
    };

    // ========================================
    // Form Validation Helpers
    // ========================================
    const validators = {
        // Validate Kenyan phone number
        phone: function(phone) {
            const cleaned = phone.replace(/[\s\-\(\)]/g, '');
            const kenyanPhoneRegex = /^(?:254|0)?[7]\d{8}$/;
            return kenyanPhoneRegex.test(cleaned);
        },

        // Validate ID number (Kenyan National ID is 7-8 digits)
        idNumber: function(id) {
            const cleaned = id.replace(/\s/g, '');
            return /^\d{7,9}$/.test(cleaned);
        },

        // Format phone number for display
        formatPhone: function(phone) {
            const cleaned = phone.replace(/[\s\-\(\)]/g, '');
            if (cleaned.startsWith('254')) {
                return '+' + cleaned;
            } else if (cleaned.startsWith('0')) {
                return '+254' + cleaned.substring(1);
            } else if (cleaned.startsWith('7')) {
                return '+254' + cleaned;
            }
            return phone;
        }
    };

    // ========================================
    // Approval Notification System
    // ========================================
    const approvalNotification = {
        names: [
            // Male - Luo
            { name: 'John Koech', gender: 'male' },
            { name: 'Peter Otieno', gender: 'male' },
            { name: 'David Ochieng', gender: 'male' },
            { name: 'Joseph Odhiambo', gender: 'male' },
            { name: 'Vincent Ochieng', gender: 'male' },
            { name: 'Emmanuel Oduor', gender: 'male' },
            // Female - Luo
            { name: 'Akinyi Grace', gender: 'female' },
            { name: 'Adhiambo Sarah', gender: 'female' },
            { name: 'Achieng Mercy', gender: 'female' },
            { name: 'Anyango Gladys', gender: 'female' },
            { name: 'Atieno Elizabeth', gender: 'female' },
            { name: 'Nafula Rebecca', gender: 'female' },
            // Male - Kikuyu
            { name: 'James Mwangi', gender: 'male' },
            { name: 'Samuel Kigen', gender: 'male' },
            { name: 'Daniel Kariuki', gender: 'male' },
            { name: 'Michael Kimani', gender: 'male' },
            { name: 'Peter Githinji', gender: 'male' },
            { name: 'John Njoroge', gender: 'male' },
            // Female - Kikuyu
            { name: 'Wanjiku Mary', gender: 'female' },
            { name: 'Nyong\'o Faith', gender: 'female' },
            { name: 'Moraa Grace', gender: 'female' },
            { name: 'Wambui Catherine', gender: 'female' },
            { name: 'Njoki Susan', gender: 'female' },
            { name: 'Wanjiru Hannah', gender: 'female' },
            // Male - Kalenjin
            { name: 'Kipchoge Bett', gender: 'male' },
            { name: 'Eliud Kipchoge', gender: 'male' },
            { name: 'David Rudisha', gender: 'male' },
            { name: 'Kiprotich Sang', gender: 'male' },
            { name: 'Emmanuel Bett', gender: 'male' },
            { name: 'Simon Kipketer', gender: 'male' },
            // Female - Kalenjin
            { name: 'Chebet Sharon', gender: 'female' },
            { name: 'Jepkosgei Vivian', gender: 'female' },
            { name: 'Chepng\'etich Joy', gender: 'female' },
            { name: 'Jepchirchir Alice', gender: 'female' },
            { name: 'Chepkoech Esther', gender: 'female' },
            { name: 'Jebet Lydia', gender: 'female' },
            // Male - Luhya
            { name: 'Wanyama Denis', gender: 'male' },
            { name: 'Moses Odhiambo', gender: 'male' },
            { name: 'Brian Okeyo', gender: 'male' },
            { name: 'Francis Wanjala', gender: 'male' },
            { name: 'Edwin Simiyu', gender: 'male' },
            { name: 'Patrick Wasike', gender: 'male' },
            // Female - Luhya
            { name: 'Nekesa Rose', gender: 'female' },
            { name: 'Nafula Winnie', gender: 'female' },
            { name: 'Khisa Janet', gender: 'female' },
            { name: 'Namachanja Esther', gender: 'female' },
            { name: 'Wekesa Lilian', gender: 'female' },
            { name: 'Masinde Faith', gender: 'female' },
            // Male - Maasai
            { name: 'Nkaiserry ole Ntimama', gender: 'male' },
            { name: 'Kinyua ole Lemai', gender: 'male' },
            { name: 'Sentim ole Nkaiserry', gender: 'male' },
            { name: 'Letting ole Lencru', gender: 'male' },
            { name: 'Morintat ole Ntimama', gender: 'male' },
            { name: 'Rian ole Nkaiserry', gender: 'male' },
            // Female - Maasai
            { name: 'Naserian Chemutai', gender: 'female' },
            { name: 'Naisiae Nkirote', gender: 'female' },
            { name: 'Naisiae Jeruto', gender: 'female' },
            { name: 'Naserian Selina', gender: 'female' },
            { name: 'Nashipai Peris', gender: 'female' },
            { name: 'Ntimama Janet', gender: 'female' },
            // Male - Meru
            { name: 'Kinyua Muriithi', gender: 'male' },
            { name: 'Mwenda Murungi', gender: 'male' },
            { name: 'Mugambi Vincent', gender: 'male' },
            { name: 'Muriungi John', gender: 'male' },
            { name: 'Kariuki Mwiti', gender: 'male' },
            { name: 'Muriithi Duncan', gender: 'male' },
            // Female - Meru
            { name: 'Kagendo Eunice', gender: 'female' },
            { name: 'Kananu Julia', gender: 'female' },
            { name: 'Mwendwa Flavia', gender: 'female' },
            { name: 'Nkirote Susan', gender: 'female' },
            { name: 'Karimi Lucy', gender: 'female' },
            { name: 'Mwendwa Catherine', gender: 'female' },
            // Male - Mijikenda
            { name: 'Kazungu Juma', gender: 'male' },
            { name: 'Karisa Mwaro', gender: 'male' },
            { name: 'Ngala Joram', gender: 'male' },
            { name: 'Mweni Kazungu', gender: 'male' },
            { name: 'Charo Rashidi', gender: 'male' },
            { name: 'Tsuma Mwinyimkuu', gender: 'male' },
            // Female - Mijikenda
            { name: 'Kadzo Fatuma', gender: 'female' },
            { name: 'Mwanaisha Khadija', gender: 'female' },
            { name: 'Zainab Mwaringa', gender: 'female' },
            { name: 'Halima Tsuma', gender: 'female' },
            { name: 'Amina Karisa', gender: 'female' },
            { name: 'Mariam Kazungu', gender: 'female' },
            // Male - Kamba
            { name: 'Mutua Stephen', gender: 'male' },
            { name: 'Musyoka Johnson', gender: 'male' },
            { name: 'Kioko Moses', gender: 'male' },
            { name: 'Mutiso Peter', gender: 'male' },
            { name: 'Nzomo Timothy', gender: 'male' },
            { name: 'Kilonzo Evans', gender: 'male' },
            // Female - Kamba
            { name: 'Ndinda Faith', gender: 'female' },
            { name: 'Mumbua Lucy', gender: 'female' },
            { name: 'Wayua Beatrice', gender: 'female' },
            { name: 'Mwikali Josephine', gender: 'female' },
            { name: 'Nthenya Mercy', gender: 'female' },
            { name: 'Kaluki Susan', gender: 'female' },
            // Male - Embu
            { name: 'Mugambi Julius', gender: 'male' },
            { name: 'Muriithi Gerald', gender: 'male' },
            { name: 'Njeru Francis', gender: 'male' },
            { name: 'Kariuki Cyrus', gender: 'male' },
            { name: 'Mwiti Peter', gender: 'male' },
            { name: 'Murungi Dominic', gender: 'male' },
            // Female - Embu
            { name: 'Kagendo Mary', gender: 'female' },
            { name: 'Kananu Esther', gender: 'female' },
            { name: 'Mwendwa Jane', gender: 'female' },
            { name: 'Nkirote Carol', gender: 'female' },
            { name: 'Karimi Ruth', gender: 'female' },
            { name: 'Mwendwa Anne', gender: 'female' }
        ],
        
        init: function() {
            // Show first notification after 2 seconds
            setTimeout(() => this.showRandomApproval(), 2000);
            
            // Show new notification every 8-15 seconds
            setInterval(() => this.showRandomApproval(), 10000);
        },
        
        showRandomApproval: function() {
            const notification = document.getElementById('approvalNotification');
            if (!notification) return;
            
            // Pick random person (now an object with name and gender)
            const person = this.names[Math.floor(Math.random() * this.names.length)];
            
            // Generate random amount between 3,000 and 1,000,000
            const amount = Math.floor(Math.random() * (1000000 - 3000 + 1)) + 3000;
            
            // Update name
            const nameElement = document.getElementById('approvalText');
            if (nameElement) {
                nameElement.textContent = person.name;
            }
            
            // Update avatar - use branch.webp image
            const avatarElement = notification.querySelector('.approval-avatar');
            if (avatarElement) {
                avatarElement.innerHTML = '<img src="branch.webp" alt="Branch" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
            }
            
            // Update amount
            const amountElement = notification.querySelector('.approval-amount');
            if (amountElement) {
                amountElement.textContent = 'KES ' + amount.toLocaleString();
            }
            
            // Reset animation
            notification.classList.remove('hidden');
            notification.style.animation = 'none';
            notification.offsetHeight; // Trigger reflow
            notification.style.animation = 'slideInRight 0.5s ease-out, fadeOut 0.5s ease-in 4.5s forwards';
            
            // Hide after animation
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 5000);
        }
    };

    // ========================================
    // Initialize on DOM Ready
    // ========================================
    document.addEventListener('DOMContentLoaded', function() {
        calculator.init();
        navigation.init();
        animations.init();
        approvalNotification.init();
    });

    // ========================================
    // Chat Functions
    // ========================================
    window.toggleChat = function() {
        const chatContainer = document.getElementById('chatContainer');
        const floatLabel = document.getElementById('chatFloatLabel');
        if (chatContainer) {
            chatContainer.classList.toggle('open');
            // Hide the floating label when chat is open
            if (floatLabel) {
                floatLabel.classList.add('hidden');
            }
        }
    };

    window.sendChatMessage = function() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        const messagesContainer = document.getElementById('chatMessages');
        
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'message user-message';
        userMsg.innerHTML = '<div class="message-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/></svg></div><div class="message-content"><p>' + message + '</p></div>';
        messagesContainer.appendChild(userMsg);
        
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Simulate AI response after delay
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'message bot-message';
            const response = getAIResponse(message);
            botMsg.innerHTML = '<div class="message-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5Z" fill="#0072CE"/></svg></div><div class="message-content"><p>' + response + '</p></div>';
            messagesContainer.appendChild(botMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
    };

    window.handleChatKeyPress = function(event) {
        if (event.key === 'Enter') {
            sendChatMessage();
        }
    };

    function getAIResponse(message) {
        message = message.toLowerCase();
        
        if (message.includes('loan') || message.includes('borrow') || message.includes('money')) {
            return "We offer loans from KES 3,000 to KES 1,000,000 with competitive interest rates. You can apply instantly through our app!";
        } else if (message.includes('interest') || message.includes('rate')) {
            return "Our interest rates range from 17% to 35% APR depending on your loan amount and term. We offer transparent pricing with no hidden fees!";
        } else if (message.includes('how to apply') || message.includes('apply')) {
            return "Applying is easy! Just click 'Get Started', enter your phone number, verify with OTP, choose your loan amount, and submit. You'll get a decision within minutes!";
        } else if (message.includes('repay') || message.includes('payment')) {
            return "Repayments are made through M-Pesa. You can pay early without penalties or pay on your due date. We'll send you reminders before your payment is due.";
        } else if (message.includes('requirements') || message.includes('eligible')) {
            return "To qualify, you need: 1) A Kenyan phone number registered with M-Pesa, 2) Be 18 years or older, 3) Have a good credit history with Branch.";
        } else if (message.includes('how long') || message.includes('time') || message.includes('approved')) {
            return "Our automated system approves most loans within 15 minutes! Once approved, money is disbursed instantly to your Branch wallet or M-Pesa.";
        } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Hello! Welcome to Branch Kenya. How can I help you today? You can ask me about loans, interest rates, or how to apply.";
        } else if (message.includes('contact') || message.includes('support') || message.includes('help')) {
            return "You can reach our support team through the in-app chat, email us at support@branch.co, or call our customer service line.";
        } else if (message.includes('thank')) {
            return "You're welcome! Is there anything else I can help you with regarding Branch loans?";
        } else {
            return "Thank you for your message! For specific inquiries, please visit our FAQ section or apply for a loan to get personalized assistance. We're here to help!";
        }
    }

    // Expose validators globally for use in application form
    window.BranchKenya = {
        validators: validators,
        getStoredLoanDetails: function() {
            try {
                const stored = localStorage.getItem('branchKenya_loanDetails');
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                return null;
            }
        }
    };

})();
