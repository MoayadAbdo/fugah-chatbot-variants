// ========================================
// FUGAH CHATBOT WIDGET - MAIN JAVASCRIPT
// ========================================
// This file contains all the functionality for the Fugah chatbot widget
// including theme switching, message handling, and user interactions

(function() {
  // ========================================
  // STORE ID CONFIGURATION FUNCTIONALITY
  // ========================================
  // Read store ID from script tag data attribute
  const scriptTag = document.currentScript;
  const storeId = scriptTag.getAttribute("data-store-id") || "demo-store";
  // Load CSS/HTML/assets from script origin (or data-widget-base) so embed on Salla works
  const explicitBase = scriptTag.getAttribute("data-widget-base");
  const scriptSrc = scriptTag?.src;
  const WIDGET_BASE = (explicitBase && explicitBase.trim()) ? explicitBase.trim().replace(/\/?$/, "/") : (scriptSrc ? scriptSrc.replace(/\/[^/]*$/, "/") : "");

  console.log("Widget loaded for store:", storeId);


  // ========================================
  // END STORE ID CONFIGURATION FUNCTIONALITY
  // ========================================


  // ========================================
  // SHADOW DOM SETUP FUNCTIONALITY
  // ========================================
  // Create wrapper element and attach shadow DOM for style isolation
  const wrapper = document.createElement("div");
  wrapper.id = "chatbot-widget-root";
  document.body.appendChild(wrapper);

  // API call to n8n webhook (for future integration)
  fetch("https://n8n.srv1196634.hstgr.cloud/webhook/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // body: JSON.stringify({ message: "hello" })
  })
  .then(async res => {
    const text = await res.text();
    console.log("Status:", res.status);
  //  console.log("Body:", text);
  })
  .catch(console.error);
  
  const shadow = wrapper.attachShadow({ mode: "open" }); // Create shadow DOM


  // ========================================
  // END SHADOW DOM SETUP FUNCTIONALITY
  // ========================================


  // ========================================
  // CSS LOADING FUNCTIONALITY
  // ========================================
  // Load CSS from script origin so Salla/other domains get it from your CDN
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = WIDGET_BASE + "widget.css";
  shadow.appendChild(style);


  // ========================================
  // END CSS LOADING FUNCTIONALITY
  // ========================================


  // ========================================
  // HTML LOADING AND DOM ELEMENT SELECTION FUNCTIONALITY
  // ========================================
  // Load HTML template and initialize all DOM elements
  fetch(WIDGET_BASE + "ui.html")
        .then(res => res.text())
        .then(html => {
      shadow.innerHTML += html; // Inject HTML into shadow DOM

      // Select all required DOM elements from shadow DOM
          const bubble = shadow.querySelector("#chat-bubble");
          const chatIcon = shadow.querySelector("#chat-icon");
          const chatWindow = shadow.querySelector("#chat-window");
          const sendMessageBtn = shadow.querySelector(".fugah-send-button");
          const phoneInput = shadow.querySelector("#phone-input");
      const customPlaceholder = shadow.querySelector("#custom-placeholder");
      const countryCodeBtn = shadow.querySelector("#country-code-btn");
      const countryCodeDropdown = shadow.querySelector("#country-code-dropdown");
      const countryList = shadow.querySelector("#country-list");
      const countryFlag = shadow.querySelector("#country-flag");
      const countryCodeText = shadow.querySelector("#country-code-text");
      const numberFormat = shadow.querySelector("#number-format");
      const phoneValidationError = shadow.querySelector("#phone-validation-error");
          const mainHomeContainer = shadow.querySelector(".main-home-container");
          const mainMessageContainer = shadow.querySelector(".main-message-container");
          const mainMessageDetailContainer = shadow.querySelector(".main-message-detail-container");
      const mainRatingContainer = shadow.querySelector(".main-rating-container");
      const ratingBackBtn = shadow.querySelector("#rating-back-btn");
          const messageCloseBtn = shadow.querySelector("#message-close-btn");
          const messageDetailBackBtn = shadow.querySelector("#message-detail-back-btn");
          const messageDetailBackTickBtn = shadow.querySelector("#message-detail-back-tick-btn");
          const fugahMessageDetailDropdownIcon = shadow.querySelector("#fugah-message-detail-dropdown-icon");
          const fugahMessageDetailDropdown = shadow.querySelector("#fugah-message-detail-dropdown");
          const closeChatDetailMenuItem = shadow.querySelector("#close-chat-detail-menu-item");
          const createTicketDetailMenuItem = shadow.querySelector("#create-ticket-detail-menu-item");
          // Custom confirmation dialog elements
          const customConfirmationDialog = shadow.querySelector("#custom-confirmation-dialog");
          const confirmationDialogMessage = shadow.querySelector("#confirmation-dialog-message");
          const confirmationBtnCancel = shadow.querySelector("#confirmation-btn-cancel");
          const confirmationBtnConfirm = shadow.querySelector("#confirmation-btn-confirm");
      const fugahRatingDropdownIcon = shadow.querySelector("#fugah-rating-dropdown-icon");
      const fugahRatingDropdown = shadow.querySelector("#fugah-rating-dropdown");
      const closeRatingMenuItem = shadow.querySelector("#close-rating-menu-item");
          const messageDetailInput = shadow.querySelector("#message-detail-input");
          const messageDetailSendBtn = shadow.querySelector("#message-detail-send-btn");
          const messageDetailMessages = shadow.querySelector("#message-detail-messages");
          const messageItems = shadow.querySelectorAll(".message-item");
          const messageContainer = shadow.querySelector(".message-container");
          const noMessagesEmptyState = shadow.querySelector("#no-messages-empty-state");
          const footerTabItems = shadow.querySelectorAll(".fugah-footer-tab-item");
          const fugahFooter = shadow.querySelector("#fugah-footer");
          

      // ========================================
      // END HTML LOADING AND DOM ELEMENT SELECTION FUNCTIONALITY
      // ========================================


      // ========================================
      // ASSET PATH HELPER FUNCTIONALITY
      // ========================================
      // Helper function to get correct asset paths in shadow DOM
          const getAssetPath = (filename) => WIDGET_BASE + "assets/" + filename;
          

      // ========================================
      // END ASSET PATH HELPER FUNCTIONALITY
      // ========================================


      // ========================================
      // INITIAL ICON SETUP FUNCTIONALITY
      // ========================================
      // Set initial icon paths for chat bubble and arrows
          if (chatIcon) {
            chatIcon.src = getAssetPath("message.png");
          }

      // Fix initial arrow paths and chat/rating header exit icons
      const backArrow = shadow.querySelector("#message-detail-back-btn");
      const backTickArrow = shadow.querySelector("#message-detail-back-tick-btn");
      const ratingBackArrow = shadow.querySelector("#rating-back-btn");
      const messageListArrows = shadow.querySelectorAll(".message-item img");
      if (backArrow) {
        backArrow.src = getAssetPath("white-exit-button.png");
      }
      if (backTickArrow) {
        backTickArrow.src = getAssetPath("back-tick-black.png");
      }
      if (ratingBackArrow) {
        ratingBackArrow.src = getAssetPath("white-exit-button.png");
      }
      // messageListArrows will be set correctly by changeTheme() 


      // ========================================
      // END INITIAL ICON SETUP FUNCTIONALITY
      // ========================================


      // ========================================
      // CHAT WINDOW TOGGLE FUNCTIONALITY
      // ========================================
      // Handle opening and closing of chat window with icon switching
      let isOpen = false;
      
      // Store scroll prevention handlers for cleanup
      let scrollPreventionHandlers = {
        homeContainer: null,
        chatContainer: null,
        chatWindow: null
      };

      // Force close chat - ensures complete cleanup (iOS fix)
      const forceCloseChat = () => {
        console.log('forceCloseChat called');
        
        // Force hide chat window
        chatWindow.classList.remove('opening', 'open', 'closing');
        chatWindow.style.display = "none";
        chatWindow.classList.remove("chat-window-open");
        
        // Remove chat window inline background styles (let CSS handle it)
        chatWindow.style.removeProperty("background-image");
        chatWindow.style.removeProperty("background-size");
        chatWindow.style.removeProperty("background-position");
        chatWindow.style.removeProperty("background-repeat");
        
        // Force show bubble
        bubble.classList.remove("chat-open");
        bubble.style.display = "flex";
        bubble.style.visibility = "visible";
        bubble.style.opacity = "1";
        bubble.style.pointerEvents = "auto";
        
        // Get current theme and restore correct icon
        const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
        const themeName = currentTheme ? currentTheme[1] : 'black';
        let iconPath;
        switch(themeName) {
          case 'green':
            iconPath = getAssetPath("message-green.png");
            break;
          case 'red':
            iconPath = getAssetPath("message-red.png");
            break;
          case 'blue':
            iconPath = getAssetPath("message-blue.png");
            break;
          case 'yellow':
            iconPath = getAssetPath("message-yellow.png");
            break;
          case 'cyan':
            iconPath = getAssetPath("message-cyan.png");
            break;
          case 'white':
            iconPath = getAssetPath("message-white.png");
            break;
          case 'black':
          default:
            iconPath = getAssetPath("message.png");
            break;
        }
        if (chatIcon) chatIcon.src = iconPath;
        
        // Restore main page background image (fugah-body is in main document, not shadow DOM)
        const fugahBody = document.querySelector('.fugah-body');
        if (fugahBody) {
          let backgroundImagePath;
          switch(themeName) {
            case 'green':
              backgroundImagePath = "url('" + getAssetPath("main-bg.png") + "')";
              break;
            case 'red':
              backgroundImagePath = "url('" + getAssetPath("main-red-bg.png") + "')";
              break;
            case 'blue':
              backgroundImagePath = "url('" + getAssetPath("main-blue-bg.png") + "')";
              break;
            case 'yellow':
              backgroundImagePath = "url('" + getAssetPath("main-yellow-bg.png") + "')";
              break;
            case 'cyan':
              backgroundImagePath = "url('" + getAssetPath("main-cyan-bg.png") + "')";
              break;
            case 'black':
              backgroundImagePath = "url('" + getAssetPath("main-black-bg.png") + "')";
              break;
            case 'white':
              backgroundImagePath = "url('" + getAssetPath("main-white-bg.png") + "')";
              break;
            default:
              backgroundImagePath = "url('" + getAssetPath("main-bg.png") + "')";
              break;
          }
          fugahBody.style.removeProperty("background-image");
          fugahBody.style.backgroundImage = backgroundImagePath;
          console.log('Restored background image:', backgroundImagePath);
        }
        
        // Remove scroll locks
        document.body.classList.remove('chat-open');
        document.documentElement.classList.remove('chat-open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        // Remove touch event listeners
        if (window.fugahBackgroundScrollPrevention) {
          document.removeEventListener('touchmove', window.fugahBackgroundScrollPrevention, { capture: true });
          document.removeEventListener('touchstart', window.fugahBackgroundScrollPrevention, { capture: true });
          document.body.removeEventListener('touchmove', window.fugahBackgroundScrollPrevention);
          document.body.removeEventListener('touchstart', window.fugahBackgroundScrollPrevention);
          window.fugahBackgroundScrollPrevention = undefined;
        }
        
        // Restore scroll position
        const scrollY = window.fugahChatScrollPosition || 0;
        window.scrollTo(0, scrollY);
        window.fugahChatScrollPosition = undefined;
        
        // Reset state
        isOpen = false;
        
        console.log('forceCloseChat completed - bubble and background should be visible');
      };

      const toggleChat = () => {
        isOpen = !isOpen;
        
        // ========================================
        // CHAT WINDOW OPEN/CLOSE ANIMATIONS
        // ========================================
        if (isOpen) {
          // Opening: Zoom In + Fade In
          // Remove any closing classes first
          chatWindow.classList.remove('closing', 'open');
          // Set display to flex before animation starts
          chatWindow.style.display = "flex";
          // Force reflow to ensure display change is applied
          void chatWindow.offsetWidth;
          // Add opening class to trigger animation
          chatWindow.classList.add('opening');
          
          // Track if animation completed
          let openAnimationCompleted = false;
          
          // After animation completes, switch to open state
          chatWindow.addEventListener('animationend', function onOpenComplete() {
            if (openAnimationCompleted) return;
            openAnimationCompleted = true;
            chatWindow.removeEventListener('animationend', onOpenComplete);
            chatWindow.classList.remove('opening');
            chatWindow.classList.add('open');
          }, { once: true });
          
          // iOS fallback: If animationend doesn't fire within 500ms, force open state
          setTimeout(() => {
            if (!openAnimationCompleted) {
              openAnimationCompleted = true;
              chatWindow.classList.remove('opening');
              chatWindow.classList.add('open');
            }
          }, 500);
        } else {
          // Closing: Zoom Out + Fade Out
          // Remove opening/open classes
          chatWindow.classList.remove('opening', 'open');
          // Add closing class to trigger animation
          chatWindow.classList.add('closing');
          
          // Track if animation completed
          let animationCompleted = false;
          
          // After animation completes, hide the element
          chatWindow.addEventListener('animationend', function onCloseComplete() {
            if (animationCompleted) return;
            animationCompleted = true;
            chatWindow.removeEventListener('animationend', onCloseComplete);
            chatWindow.classList.remove('closing');
            chatWindow.style.display = "none";
          }, { once: true });
          
          // iOS fallback: If animationend doesn't fire within 500ms, force close
          // This fixes issues on iOS Safari where animationend event may not fire
          setTimeout(() => {
            if (!animationCompleted) {
              animationCompleted = true;
              chatWindow.classList.remove('closing');
              chatWindow.style.display = "none";
            }
          }, 500);
        }
        // ========================================
        // END CHAT WINDOW OPEN/CLOSE ANIMATIONS
        // ========================================
        
        // ========================================
        // PREVENT BACKGROUND PAGE SCROLLING
        // ========================================
        // When chat window is open, prevent the background page (images/content behind chat)
        // from scrolling on all devices (desktop, mobile, tablets)
        // This ensures the background remains static while user interacts with chat
        if (isOpen) {
          // Store current scroll position before preventing scroll
          // This allows us to restore the exact scroll position when chat closes
          // Using multiple fallbacks for cross-browser compatibility
          const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
          window.fugahChatScrollPosition = scrollY;
          
          // Add CSS class to body and html for additional scroll prevention via CSS
          document.body.classList.add('chat-open');
          document.documentElement.classList.add('chat-open');
          
          // Prevent scrolling via overflow only (position:fixed on body breaks background on Safari and others)
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
          
          // ========================================
          // MOBILE-SPECIFIC: Additional touch scroll prevention
          // ========================================
          // On mobile devices, add touch event listeners to prevent background scrolling
          // This is especially important for iOS Safari which can still scroll with touch gestures
          const preventBackgroundScroll = (e) => {
            // Only prevent if touch is outside the chat window
            // Note: chatWindow is in shadow DOM, so we check if target is inside the wrapper
            const widgetRoot = document.querySelector('#chatbot-widget-root');
            if (widgetRoot && !widgetRoot.contains(e.target)) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          };
          
          // Store handler for cleanup
          window.fugahBackgroundScrollPrevention = preventBackgroundScroll;
          
          // Add touch event listeners to prevent background scrolling on mobile
          // Use capture phase to catch events before they bubble
          document.addEventListener('touchmove', preventBackgroundScroll, { passive: false, capture: true });
          document.addEventListener('touchstart', preventBackgroundScroll, { passive: false, capture: true });
          document.body.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
          document.body.addEventListener('touchstart', preventBackgroundScroll, { passive: false });
        } else {
          // Restore scrolling when chat is closed
          // Get the stored scroll position (default to 0 if not set)
          const scrollY = window.fugahChatScrollPosition || 0;
          
          // Remove touch event listeners if they exist
          if (window.fugahBackgroundScrollPrevention) {
            document.removeEventListener('touchmove', window.fugahBackgroundScrollPrevention, { capture: true });
            document.removeEventListener('touchstart', window.fugahBackgroundScrollPrevention, { capture: true });
            document.body.removeEventListener('touchmove', window.fugahBackgroundScrollPrevention);
            document.body.removeEventListener('touchstart', window.fugahBackgroundScrollPrevention);
            window.fugahBackgroundScrollPrevention = undefined;
          }
          
          document.body.classList.remove('chat-open');
          document.documentElement.classList.remove('chat-open');
          
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          window.scrollTo(0, scrollY);
          window.fugahChatScrollPosition = undefined;
        }
        // ========================================
        // END PREVENT BACKGROUND PAGE SCROLLING
        // ========================================
        
        // Get the body element with fugah-body class (from main document, not shadow DOM)
        const fugahBody = document.querySelector('.fugah-body');
        
        // ========================================
        // DEVICE DETECTION FUNCTIONS
        // ========================================
        // Helper function to check if device is mobile (max-width: 767px)
        const checkIsMobile = () => {
          // Check both window width and matchMedia for better mobile detection
          const width = window.innerWidth;
          const isMobileWidth = width <= 767;
          const isMobileMedia = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
          const isMobile = isMobileWidth || isMobileMedia;
          console.log('Mobile check - width:', width, 'isMobileWidth:', isMobileWidth, 'isMobileMedia:', isMobileMedia, 'isMobile:', isMobile);
          return isMobile;
        };

        // Helper function to check if device is tablet (600px to 991px)
        // Tablets include iPads and Android tablets
        const checkIsTablet = () => {
          const width = window.innerWidth;
          const isTabletWidth = width >= 600 && width <= 991;
          const isTabletMedia = window.matchMedia && window.matchMedia('(min-width: 600px) and (max-width: 991px)').matches;
          const isTablet = isTabletWidth || isTabletMedia;
          console.log('Tablet check - width:', width, 'isTabletWidth:', isTabletWidth, 'isTabletMedia:', isTabletMedia, 'isTablet:', isTablet);
          return isTablet;
        };

        // Helper function to check if device is mobile OR tablet
        // This is used for keyboard handling - both mobile and tablets need keyboard adjustments
        // Mobile: max-width: 767px
        // Tablet: 600px to 991px
        // Combined: max-width: 991px (covers both mobile and tablets)
        const checkIsMobileOrTablet = () => {
          const width = window.innerWidth;
          const isMobileOrTabletWidth = width <= 991;
          const isMobileOrTabletMedia = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;
          const isMobileOrTablet = isMobileOrTabletWidth || isMobileOrTabletMedia;
          console.log('Mobile/Tablet check - width:', width, 'isMobileOrTabletWidth:', isMobileOrTabletWidth, 'isMobileOrTabletMedia:', isMobileOrTabletMedia, 'isMobileOrTablet:', isMobileOrTablet);
          return isMobileOrTablet;
        };
        // ========================================
        // END DEVICE DETECTION FUNCTIONS
        // ========================================

        // Function to get dynamic viewport height that accounts for browser bars
        const getDynamicViewportHeight = () => {
          // Use window.innerHeight which accounts for browser UI bars
          // This is more reliable than 100vh on mobile browsers
          const height = window.innerHeight;
          
          // For iOS Safari, also check visualViewport if available
          if (window.visualViewport && window.visualViewport.height) {
            // Use the larger value to ensure full coverage
            return Math.max(height, window.visualViewport.height);
          }
          
          return height;
        };

        // ========================================
        // KEYBOARD HANDLING FOR MOBILE AND TABLETS
        // ========================================
        // Function to update chat window position and height dynamically
        // Works for both mobile (max-width: 767px) and tablets (600px to 991px)
        // Positions chat window just above keyboard when it appears
        // This prevents the keyboard from covering the input area
        let mobileHeightUpdateHandler = null;
        const setupMobileHeightUpdates = () => {
          // Remove existing handler if any
          if (mobileHeightUpdateHandler) {
            window.removeEventListener('resize', mobileHeightUpdateHandler);
            window.removeEventListener('orientationchange', mobileHeightUpdateHandler);
            if (window.visualViewport) {
              window.visualViewport.removeEventListener('resize', mobileHeightUpdateHandler);
              window.visualViewport.removeEventListener('scroll', mobileHeightUpdateHandler);
            }
          }

          mobileHeightUpdateHandler = () => {
            // Apply keyboard handling for both mobile AND tablets
            // Mobile: max-width: 767px (fullscreen behavior)
            // Tablets: 600px to 991px (iPads, Android tablets - normal window size)
            // Combined check: max-width: 991px covers both
            if (isOpen && checkIsMobileOrTablet()) {
              // Determine if device is mobile or tablet for different behavior
              const isMobile = checkIsMobile();
              const isTablet = checkIsTablet();
              
              // Use visualViewport API to detect keyboard and position accordingly
              if (window.visualViewport) {
                const viewportHeight = window.visualViewport.height;
                const viewportOffsetTop = window.visualViewport.offsetTop || 0;
                
                // When keyboard is open, visualViewport.offsetTop will be > 0
                if (viewportOffsetTop > 0) {
                  // Keyboard is open - use window.innerHeight which is most accurate
                  // window.innerHeight gives the actual visible area above keyboard
                  const getKeyboardOpenHeight = () => {
                    return new Promise((resolve) => {
                      // Get height immediately
                      const immediateHeight = window.innerHeight;
                      
                      // Then check again after keyboard fully opens
                      setTimeout(() => {
                        const height1 = window.innerHeight;
                        // Check one more time to ensure accuracy
                        setTimeout(() => {
                          const height2 = window.innerHeight;
                          // Use the smallest value to ensure no gap
                          const finalHeight = Math.min(immediateHeight, height1, height2);
                          resolve(finalHeight);
                        }, 200);
                      }, 300);
                    });
                  };
                  
                  // Set initial height immediately using window.innerHeight (most accurate)
                  const initialHeight = window.innerHeight;
                  
                  // Check if iOS for special handling
                  const isIOS = checkIsIOS();
                  
                  // Get footer element for iOS-specific hiding
                  const fugahFooter = shadow.querySelector("#fugah-footer");
                  
                  if (isMobile) {
                    // ========================================
                    // MOBILE KEYBOARD HANDLING (max-width: 767px)
                    // ========================================
                    // Mobile: Fullscreen behavior - chat window takes full viewport
                    // CRITICAL: Remove inset and bottom to prevent gap - only use top positioning
                    chatWindow.style.setProperty("inset", "unset", "important");
                    chatWindow.style.removeProperty("inset");
                    chatWindow.style.removeProperty("bottom"); // Don't set bottom - causes gap
                    chatWindow.style.setProperty("top", "0", "important");
                    chatWindow.style.setProperty("left", "0", "important");
                    chatWindow.style.setProperty("right", "0", "important");
                    chatWindow.style.setProperty("height", `${initialHeight}px`, "important");
                    chatWindow.style.setProperty("width", "100vw", "important");
                    
                    // ========================================
                    // iOS-SPECIFIC: Hide footer when keyboard opens, show only input container
                    // ========================================
                    // On iOS, hide footer completely when keyboard opens so user can see what they type
                    // Only the input container will be visible above the keyboard
                    if (isIOS && fugahFooter) {
                      fugahFooter.style.setProperty("display", "none", "important");
                    }
                  } else if (isTablet) {
                    // ========================================
                    // TABLET KEYBOARD HANDLING (600px to 991px)
                    // ========================================
                    // Tablet: Keep normal window position and size, only adjust height
                    // Tablets maintain their fixed position (bottom: 20px, right: 20px)
                    // Only reduce height to account for keyboard, keeping width at 390px
                    const keyboardHeight = window.innerHeight;
                    // Calculate available height above keyboard
                    // For tablets, we want to keep the window in its normal position
                    // but reduce its height so input area is visible above keyboard
                    const maxTabletHeight = Math.min(keyboardHeight - 40, 670); // 40px for margins, max 670px
                    chatWindow.style.setProperty("height", `${maxTabletHeight}px`, "important");
                    chatWindow.style.setProperty("max-height", `${maxTabletHeight}px`, "important");
                    // Keep normal tablet positioning (don't go fullscreen)
                    chatWindow.style.setProperty("position", "fixed", "important");
                    chatWindow.style.setProperty("bottom", "20px", "important");
                    chatWindow.style.setProperty("right", "20px", "important");
                    chatWindow.style.setProperty("width", "390px", "important");
                    chatWindow.style.setProperty("top", "auto", "important");
                    chatWindow.style.setProperty("left", "auto", "important");
                  }
                  
                  // Update to correct height after keyboard fully opens (fixes first-time gap)
                  getKeyboardOpenHeight().then((correctHeight) => {
                    if (isMobile) {
                      // ========================================
                      // MOBILE: Update height after keyboard fully opens
                      // ========================================
                      // For iOS, use exact height without subtraction to prevent gap
                      // For Android, subtract 1px to ensure no gap
                      const isIOS = checkIsIOS();
                      const finalHeight = isIOS ? correctHeight : Math.max(correctHeight - 1, 300);
                      
                      // ========================================
                      // iOS-SPECIFIC: Keep footer hidden when keyboard is open
                      // ========================================
                      if (isIOS) {
                        const fugahFooter = shadow.querySelector("#fugah-footer");
                        if (fugahFooter) {
                          fugahFooter.style.setProperty("display", "none", "important");
                        }
                      }
                      
                      // Remove inset again when updating height (browser may regenerate it)
                      chatWindow.style.setProperty("inset", "unset", "important");
                      chatWindow.style.removeProperty("inset");
                      chatWindow.style.removeProperty("bottom");
                      chatWindow.style.setProperty("height", `${finalHeight}px`, "important");
                      chatWindow.style.setProperty("max-height", `${finalHeight}px`, "important");
                      // Ensure no bottom spacing
                      chatWindow.style.setProperty("padding-bottom", "0", "important");
                      chatWindow.style.setProperty("margin-bottom", "0", "important");
                      console.log('Mobile - Keyboard open - final height set to:', finalHeight);
                      
                      // Final check after a delay to ensure no gap
                      setTimeout(() => {
                        const finalCheck = window.innerHeight;
                        const adjustedHeight = Math.max(finalCheck - 1, 300);
                        if (Math.abs(finalCheck - finalHeight) > 5) {
                          chatWindow.style.setProperty("height", `${adjustedHeight}px`, "important");
                          chatWindow.style.setProperty("max-height", `${adjustedHeight}px`, "important");
                          console.log('Mobile - Keyboard open - adjusted height to:', adjustedHeight);
                        }
                      }, 100);
                    } else if (isTablet) {
                      // ========================================
                      // TABLET: Update height after keyboard fully opens
                      // ========================================
                      // For tablets, calculate height that keeps input visible above keyboard
                      // Keep window in normal position, just reduce height
                      const maxTabletHeight = Math.min(correctHeight - 40, 670); // 40px margin, max 670px
                      chatWindow.style.setProperty("height", `${maxTabletHeight}px`, "important");
                      chatWindow.style.setProperty("max-height", `${maxTabletHeight}px`, "important");
                      console.log('Tablet - Keyboard open - height set to:', maxTabletHeight);
                      
                      // Final check after a delay for tablets
                      setTimeout(() => {
                        const finalCheck = window.innerHeight;
                        const adjustedTabletHeight = Math.min(finalCheck - 40, 670);
                        if (Math.abs(finalCheck - correctHeight) > 5) {
                          chatWindow.style.setProperty("height", `${adjustedTabletHeight}px`, "important");
                          chatWindow.style.setProperty("max-height", `${adjustedTabletHeight}px`, "important");
                          console.log('Tablet - Keyboard open - adjusted height to:', adjustedTabletHeight);
                        }
                      }, 100);
                    }
                  });
                  
                  console.log('Keyboard open - initial height set to:', initialHeight, 'Device:', isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Unknown');
                } else {
                  // ========================================
                  // KEYBOARD CLOSED - Restore normal sizing
                  // ========================================
                  if (isMobile) {
                    // Mobile: Restore fullscreen viewport
                    const dynamicHeight = getDynamicViewportHeight();
                    // Remove inset to prevent browser auto-generation
                    chatWindow.style.setProperty("inset", "unset", "important");
                    chatWindow.style.removeProperty("inset");
                    chatWindow.style.setProperty("top", "0", "important");
                    chatWindow.style.setProperty("left", "0", "important");
                    chatWindow.style.setProperty("right", "0", "important");
                    chatWindow.style.setProperty("bottom", "0", "important");
                    chatWindow.style.setProperty("width", "100vw", "important");
                    chatWindow.style.setProperty("height", `${dynamicHeight}px`, "important");
                    
                    // ========================================
                    // iOS-SPECIFIC: Show footer again when keyboard closes
                    // ========================================
                    if (isIOS) {
                      const fugahFooter = shadow.querySelector("#fugah-footer");
                      if (fugahFooter) {
                        fugahFooter.style.setProperty("display", "flex", "important");
                        fugahFooter.style.removeProperty("display"); // Remove inline style to use CSS default
                      }
                    }
                    
                    console.log('Mobile - Keyboard closed - full viewport height:', dynamicHeight, 'iOS:', isIOS);
                  } else if (isTablet) {
                    // Tablet: Restore normal tablet window size
                    chatWindow.style.setProperty("height", "670px", "important");
                    chatWindow.style.setProperty("max-height", "90vh", "important");
                    chatWindow.style.setProperty("width", "390px", "important");
                    chatWindow.style.setProperty("position", "fixed", "important");
                    chatWindow.style.setProperty("bottom", "20px", "important");
                    chatWindow.style.setProperty("right", "20px", "important");
                    chatWindow.style.setProperty("top", "auto", "important");
                    chatWindow.style.setProperty("left", "auto", "important");
                    console.log('Tablet - Keyboard closed - restored to normal size');
                  }
                }
              } else {
                // ========================================
                // FALLBACK: Browsers without visualViewport support
                // ========================================
                // Use window.innerHeight as fallback for both mobile and tablets
                const dynamicHeight = getDynamicViewportHeight();
                const isMobile = checkIsMobile();
                const isTablet = checkIsTablet();
                
                if (isMobile) {
                  // Mobile fallback: fullscreen
                  chatWindow.style.setProperty("height", `${dynamicHeight}px`, "important");
                  chatWindow.style.setProperty("top", "0", "important");
                  chatWindow.style.setProperty("bottom", "0", "important");
                  console.log('Mobile fallback - Updated height to:', dynamicHeight);
                } else if (isTablet) {
                  // Tablet fallback: normal size
                  chatWindow.style.setProperty("height", "670px", "important");
                  chatWindow.style.setProperty("max-height", "90vh", "important");
                  console.log('Tablet fallback - Restored to normal size');
                }
              }
            }
          };

          // Add event listeners for viewport changes
          // These listeners detect when keyboard opens/closes and adjust chat window accordingly
          window.addEventListener('resize', mobileHeightUpdateHandler, { passive: true });
          window.addEventListener('orientationchange', mobileHeightUpdateHandler, { passive: true });
          
          // Use visualViewport API for better mobile and tablet browser support
          // visualViewport provides accurate viewport dimensions when keyboard is visible
          if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', mobileHeightUpdateHandler, { passive: true });
            window.visualViewport.addEventListener('scroll', mobileHeightUpdateHandler, { passive: true });
          }
        };
        // ========================================
        // END KEYBOARD HANDLING FOR MOBILE AND TABLETS
        // ========================================

        // Function to remove mobile/tablet height update listeners
        // Called when chat window closes to clean up event listeners
        const removeMobileHeightUpdates = () => {
          if (mobileHeightUpdateHandler) {
            window.removeEventListener('resize', mobileHeightUpdateHandler);
            window.removeEventListener('orientationchange', mobileHeightUpdateHandler);
            if (window.visualViewport) {
              window.visualViewport.removeEventListener('resize', mobileHeightUpdateHandler);
              window.visualViewport.removeEventListener('scroll', mobileHeightUpdateHandler);
            }
            mobileHeightUpdateHandler = null;
          }
        };
        
        // Clear phone input when closing chat (returning to home screen)
        if (!isOpen && phoneInput) {
          phoneInput.value = "";
          if (customPlaceholder) {
            customPlaceholder.classList.remove("invalid");
            customPlaceholder.style.display = "block";
            customPlaceholder.style.opacity = "1";
          }
          if (phoneValidationError) {
            phoneValidationError.style.display = "none";
          }
          phoneInput.classList.remove("valid", "invalid");
        }
        
        // Reset to home screen when opening chat
        if (isOpen) {
          // Show home screen when opening chat
          if (mainHomeContainer) mainHomeContainer.style.display = "flex";
          if (mainMessageContainer) mainMessageContainer.style.display = "none";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer) mainRatingContainer.style.display = "none";
          if (fugahFooter) fugahFooter.classList.remove("detail-active");
          
          // Reset footer tabs to home
          switchTab("home");
        }
        
        // Toggle icon between message and cross based on current theme
        if (isOpen) {
          // Check if device is mobile (max-width: 767px)
          const isMobile = checkIsMobile();
          
          // Get chat-container and chat-content elements
          const chatContainer = shadow.querySelector("#chat-container");
          const chatContent = shadow.querySelector("#chat-content");
          
          // Add class to indicate chat window is open
          chatWindow.classList.add("chat-window-open");
          
          // Only apply fullscreen changes on mobile devices
          if (isMobile) {
            console.log('Applying mobile fullscreen styles');
            
            // Get current theme
            const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
            const themeName = currentTheme ? currentTheme[1] : 'black';
            console.log('Current theme:', themeName);
            
            // Remove background-image from body when chat opens (mobile only)
            // This removes main-yellow-bg.png or any other theme background
            if (fugahBody) {
              console.log('Removing background from fugah-body');
              fugahBody.style.setProperty("background-image", "none", "important");
            } else {
              console.error('fugahBody not found!');
            }
            
            // Change background image to mobile version for all themes (mobile only)
            // Replace regular bg with mobile bg for all themes
            const mobileBackgroundMap = {
              'green': 'chatbot-green-mobile-bg.png',
              'red': 'chatbot-red-mobile-bg.png',
              'blue': 'chatbot-cyan-mobile-bg.png', // theme-blue uses cyan-bg
              'yellow': 'chatbot-yellow-mobile-bg.png',
              'cyan': 'chatbot-blue-mobile-bg.png', // theme-cyan uses blue-bg
              'black': 'chatbot-black-mobile-bg.png',
              'white': 'chatbot-black-mobile-bg.png'
            };
            
            if (mobileBackgroundMap[themeName]) {
              console.log(`Setting mobile background for ${themeName} theme`);
              chatWindow.style.setProperty("background-image", "url(" + getAssetPath(mobileBackgroundMap[themeName]) + ")", "important");
              chatWindow.style.setProperty("background-size", "cover", "important");
              chatWindow.style.setProperty("background-position", "center", "important");
              chatWindow.style.setProperty("background-repeat", "no-repeat", "important");
            }
            
            // Make chat-window fullscreen with no border-radius and full height (mobile only)
            console.log('Setting fullscreen styles');
            
            // Position chat window based on visualViewport (accounts for keyboard)
            const positionChatWindow = () => {
              if (window.visualViewport) {
                const viewportHeight = window.visualViewport.height;
                const viewportOffsetTop = window.visualViewport.offsetTop || 0;
                
                // When keyboard is open, visualViewport.offsetTop will be > 0
                if (viewportOffsetTop > 0) {
                  // Keyboard is open - use window.innerHeight which is most accurate
                  // window.innerHeight gives the actual visible area above keyboard
                  const getKeyboardOpenHeight = () => {
                    return new Promise((resolve) => {
                      // Get height immediately
                      const immediateHeight = window.innerHeight;
                      
                      // Then check again after keyboard fully opens
                      setTimeout(() => {
                        const height1 = window.innerHeight;
                        // Check one more time to ensure accuracy
                        setTimeout(() => {
                          const height2 = window.innerHeight;
                          // Use the smallest value to ensure no gap
                          const finalHeight = Math.min(immediateHeight, height1, height2);
                          resolve(finalHeight);
                        }, 200);
                      }, 300);
                    });
                  };
                  
                  // Set initial height immediately using window.innerHeight (most accurate)
                  // Subtract 1px to account for any rounding/border issues and ensure no gap
                  const initialHeight = Math.max(window.innerHeight - 1, 300);
                  
                  // CRITICAL: Remove inset and bottom to prevent gap - only use top positioning
                  chatWindow.style.setProperty("inset", "unset", "important");
                  chatWindow.style.removeProperty("inset");
                  chatWindow.style.removeProperty("bottom"); // Don't set bottom - causes gap
                  chatWindow.style.setProperty("top", "0", "important");
                  chatWindow.style.setProperty("left", "0", "important");
                  chatWindow.style.setProperty("right", "0", "important");
                  chatWindow.style.setProperty("height", `${initialHeight}px`, "important");
                  chatWindow.style.setProperty("width", "100vw", "important");
                  chatWindow.style.setProperty("max-height", `${initialHeight}px`, "important");
                  // Ensure no bottom spacing
                  chatWindow.style.setProperty("padding-bottom", "0", "important");
                  chatWindow.style.setProperty("margin-bottom", "0", "important");
                  
                  // Update to correct height after keyboard fully opens (fixes first-time gap)
                  getKeyboardOpenHeight().then((correctHeight) => {
                    // Subtract 1px to ensure no gap (accounts for rounding/borders)
                    const finalHeight = Math.max(correctHeight - 1, 300);
                    
                    // Remove inset again when updating height (browser may regenerate it)
                    chatWindow.style.setProperty("inset", "unset", "important");
                    chatWindow.style.removeProperty("inset");
                    chatWindow.style.removeProperty("bottom");
                    chatWindow.style.setProperty("height", `${finalHeight}px`, "important");
                    chatWindow.style.setProperty("max-height", `${finalHeight}px`, "important");
                    // Ensure no bottom spacing
                    chatWindow.style.setProperty("padding-bottom", "0", "important");
                    chatWindow.style.setProperty("margin-bottom", "0", "important");
                    
                    // Final check after a delay to ensure no gap
                    setTimeout(() => {
                      const finalCheck = window.innerHeight;
                      const adjustedHeight = Math.max(finalCheck - 1, 300);
                      if (Math.abs(finalCheck - finalHeight) > 5) {
                        chatWindow.style.setProperty("height", `${adjustedHeight}px`, "important");
                        chatWindow.style.setProperty("max-height", `${adjustedHeight}px`, "important");
                      }
                    }, 100);
                  });
                } else {
                  // Keyboard is closed - use full viewport
                  const dynamicHeight = getDynamicViewportHeight();
                  // Remove inset to prevent browser auto-generation
                  chatWindow.style.setProperty("inset", "unset", "important");
                  chatWindow.style.removeProperty("inset");
                  chatWindow.style.setProperty("top", "0", "important");
                  chatWindow.style.setProperty("left", "0", "important");
                  chatWindow.style.setProperty("right", "0", "important");
                  chatWindow.style.setProperty("bottom", "0", "important");
                  chatWindow.style.setProperty("width", "100vw", "important");
                  chatWindow.style.setProperty("height", `${dynamicHeight}px`, "important");
                }
              } else {
                // Fallback for browsers without visualViewport support
                const dynamicHeight = getDynamicViewportHeight();
                chatWindow.style.setProperty("top", "0", "important");
                chatWindow.style.setProperty("height", `${dynamicHeight}px`, "important");
                chatWindow.style.setProperty("bottom", "0", "important");
              }
            };
            
            chatWindow.style.setProperty("position", "fixed", "important");
            // Remove inset to prevent gap - browser auto-generates it from top/left/right/bottom
            chatWindow.style.setProperty("inset", "unset", "important");
            chatWindow.style.removeProperty("inset");
            chatWindow.style.setProperty("top", "0", "important");
            chatWindow.style.setProperty("left", "0", "important");
            chatWindow.style.setProperty("right", "0", "important");
            chatWindow.style.setProperty("width", "100vw", "important");
            chatWindow.style.setProperty("max-width", "none", "important");
            chatWindow.style.setProperty("max-height", "none", "important");
            chatWindow.style.setProperty("border-radius", "0", "important");
            chatWindow.style.setProperty("padding", "0", "important");
            chatWindow.style.setProperty("margin", "0", "important");
            
            // Initial positioning
            positionChatWindow();
            
            // Setup dynamic height updates for browser bar changes and keyboard
            setupMobileHeightUpdates();
            
            // Update position again after a short delay to ensure accuracy
            // This handles cases where browser bars or keyboard haven't fully adjusted yet
            setTimeout(() => {
              if (isOpen && checkIsMobile()) {
                positionChatWindow();
              }
            }, 100);
            
            // Make chat-container full height (mobile only)
            if (chatContainer) {
              chatContainer.style.setProperty("height", "100%", "important");
              chatContainer.style.setProperty("min-height", "100%", "important");
              chatContainer.style.setProperty("border-radius", "0", "important");
              chatContainer.style.setProperty("padding", "0", "important");
              chatContainer.style.setProperty("margin", "0", "important");
              chatContainer.style.setProperty("display", "flex", "important");
              chatContainer.style.setProperty("flex-direction", "column", "important");
            }
            
            // Make fugah-main-container full height and ensure footer at bottom (mobile only)
            const fugahMainContainer = shadow.querySelector("#fugah-main-container");
            if (fugahMainContainer) {
              fugahMainContainer.style.setProperty("height", "100%", "important");
              fugahMainContainer.style.setProperty("min-height", "100%", "important");
              fugahMainContainer.style.setProperty("max-height", "none", "important");
              fugahMainContainer.style.setProperty("display", "flex", "important");
              fugahMainContainer.style.setProperty("flex-direction", "column", "important");
              fugahMainContainer.style.setProperty("justify-content", "space-between", "important");
            }
            
            // Ensure footer is at bottom (mobile only)
            const fugahFooter = shadow.querySelector("#fugah-footer");
            if (fugahFooter) {
              fugahFooter.style.setProperty("margin-top", "auto", "important");
              fugahFooter.style.setProperty("flex-shrink", "0", "important");
            }
            
            // Remove border-radius, padding, and margin from chat-content (mobile only)
            if (chatContent) {
              chatContent.style.setProperty("border-radius", "0", "important");
              chatContent.style.setProperty("padding", "0", "important");
              chatContent.style.setProperty("margin", "0", "important");
              chatContent.style.setProperty("margin-top", "0", "important");
            }

            // Prevent scrolling on home screen for mobile (iOS Safari fix)
            const preventHomeScreenScroll = (e) => {
              // Only prevent if we're on the home screen
              if (mainHomeContainer && mainHomeContainer.style.display !== "none") {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            };

            // Store handler reference for cleanup
            scrollPreventionHandlers.homeContainer = preventHomeScreenScroll;
            scrollPreventionHandlers.chatContainer = preventHomeScreenScroll;
            scrollPreventionHandlers.chatWindow = preventHomeScreenScroll;

            // Add touch event listeners to prevent scrolling on home screen
            if (mainHomeContainer) {
              mainHomeContainer.addEventListener('touchmove', preventHomeScreenScroll, { passive: false });
              mainHomeContainer.addEventListener('touchstart', preventHomeScreenScroll, { passive: false });
              mainHomeContainer.addEventListener('touchend', preventHomeScreenScroll, { passive: false });
            }
            if (chatContainer) {
              chatContainer.addEventListener('touchmove', preventHomeScreenScroll, { passive: false });
            }
            if (chatWindow) {
              chatWindow.addEventListener('touchmove', preventHomeScreenScroll, { passive: false });
            }
          } else {
            // Tablet/Desktop: Keep normal chat window behavior (no fullscreen changes)
            // Don't remove background image, don't change chat window size
          }
          
          // Get current theme to set correct X icon
          const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
          const themeName = currentTheme ? currentTheme[1] : 'black';
          
          // COMMENTED OUT: X icon logic when chat opens - bubble will be hidden instead
          // Uncomment below if you need to show X icon when chat is open in the future
          /*
          let xIconPath;
          switch(themeName) {
            case 'green':
              xIconPath = getAssetPath("X-green.png");
              break;
            case 'red':
              xIconPath = getAssetPath("X-red.png");
              break;
            case 'blue':
              xIconPath = getAssetPath("X-cyan.png");
              break;
            case 'yellow':
              xIconPath = getAssetPath("X-yellow.png");
              break;
            case 'cyan':
              xIconPath = getAssetPath("x-blue.png");
              break;
            case 'white':
              xIconPath = getAssetPath("X.png");
              break;
            case 'black':
            default:
              xIconPath = getAssetPath("X.png"); // Default X for black theme
              break;
          }
          
          chatIcon.src = xIconPath;
          */
          // Hide chat bubble - screens will appear in its place
          bubble.classList.add("chat-open");
          // iOS fix: Also set display none explicitly to ensure bubble is hidden
          bubble.style.display = "none";
        } else {
          // Check if device is mobile (max-width: 767px)
          const isMobile = checkIsMobile();
          
          // Get current theme to restore correct background and message icon
          const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
          const themeName = currentTheme ? currentTheme[1] : 'black';
          
          // Get chat-container and chat-content elements
          const chatContainer = shadow.querySelector("#chat-container");
          const chatContent = shadow.querySelector("#chat-content");
          
          // Remove class to indicate chat window is closed
          chatWindow.classList.remove("chat-window-open");
          
          // Only restore styles if they were applied (mobile only)
          if (isMobile) {
            // Remove mobile height update listeners when chat closes
            removeMobileHeightUpdates();
            
            // Remove scroll prevention listeners when chat closes
            if (scrollPreventionHandlers.homeContainer && mainHomeContainer) {
              mainHomeContainer.removeEventListener('touchmove', scrollPreventionHandlers.homeContainer);
              mainHomeContainer.removeEventListener('touchstart', scrollPreventionHandlers.homeContainer);
              mainHomeContainer.removeEventListener('touchend', scrollPreventionHandlers.homeContainer);
            }
            if (scrollPreventionHandlers.chatContainer && chatContainer) {
              chatContainer.removeEventListener('touchmove', scrollPreventionHandlers.chatContainer);
            }
            if (scrollPreventionHandlers.chatWindow && chatWindow) {
              chatWindow.removeEventListener('touchmove', scrollPreventionHandlers.chatWindow);
            }
            
            // Clear handler references
            scrollPreventionHandlers.homeContainer = null;
            scrollPreventionHandlers.chatContainer = null;
            scrollPreventionHandlers.chatWindow = null;
            
            // Restore background-image when chat closes based on current theme (mobile only)
            if (fugahBody) {
              let backgroundImagePath;
              switch(themeName) {
                case 'green':
                  backgroundImagePath = "url('" + getAssetPath("main-bg.png") + "')";
                  break;
                case 'red':
                  backgroundImagePath = "url('" + getAssetPath("main-red-bg.png") + "')";
                  break;
                case 'blue':
                  backgroundImagePath = "url('" + getAssetPath("main-blue-bg.png") + "')";
                  break;
                case 'yellow':
                  backgroundImagePath = "url('" + getAssetPath("main-yellow-bg.png") + "')";
                  break;
                case 'cyan':
                  backgroundImagePath = "url('" + getAssetPath("main-cyan-bg.png") + "')";
                  break;
                case 'black':
                  backgroundImagePath = "url('" + getAssetPath("main-black-bg.png") + "')";
                  break;
                case 'white':
                  backgroundImagePath = "url('" + getAssetPath("main-white-bg.png") + "')";
                  break;
                default:
                  backgroundImagePath = "url('" + getAssetPath("main-bg.png") + "')";
                  break;
              }
              fugahBody.style.removeProperty("background-image");
              fugahBody.style.backgroundImage = backgroundImagePath;
            }
            
            // Restore chat-window background image for all themes (mobile only)
            // Remove inline styles to let CSS take over for all themes
            chatWindow.style.removeProperty("background-image");
            chatWindow.style.removeProperty("background-size");
            chatWindow.style.removeProperty("background-position");
            chatWindow.style.removeProperty("background-repeat");
            
            // Restore chat-window to normal size (mobile only)
            chatWindow.style.removeProperty("position");
            chatWindow.style.removeProperty("top");
            chatWindow.style.removeProperty("left");
            chatWindow.style.removeProperty("right");
            chatWindow.style.removeProperty("bottom");
            chatWindow.style.removeProperty("width");
            chatWindow.style.removeProperty("height");
            chatWindow.style.removeProperty("max-width");
            chatWindow.style.removeProperty("max-height");
            chatWindow.style.removeProperty("border-radius");
            chatWindow.style.removeProperty("padding");
            chatWindow.style.removeProperty("margin");
            
            // Restore chat-container styles (mobile only)
            if (chatContainer) {
              chatContainer.style.removeProperty("height");
              chatContainer.style.removeProperty("min-height");
              chatContainer.style.removeProperty("border-radius");
              chatContainer.style.removeProperty("padding");
              chatContainer.style.removeProperty("margin");
              chatContainer.style.removeProperty("display");
              chatContainer.style.removeProperty("flex-direction");
            }
            
            // Restore fugah-main-container styles (mobile only)
            const fugahMainContainer = shadow.querySelector("#fugah-main-container");
            if (fugahMainContainer) {
              fugahMainContainer.style.removeProperty("height");
              fugahMainContainer.style.removeProperty("min-height");
              fugahMainContainer.style.removeProperty("max-height");
              fugahMainContainer.style.removeProperty("display");
              fugahMainContainer.style.removeProperty("flex-direction");
              fugahMainContainer.style.removeProperty("justify-content");
            }
            
            // Restore footer styles (mobile only)
            const fugahFooter = shadow.querySelector("#fugah-footer");
            if (fugahFooter) {
              fugahFooter.style.removeProperty("margin-top");
              fugahFooter.style.removeProperty("flex-shrink");
            }
            
            // Restore chat-content styles (mobile only)
            if (chatContent) {
              chatContent.style.removeProperty("border-radius");
              chatContent.style.removeProperty("padding");
              chatContent.style.removeProperty("margin");
              chatContent.style.removeProperty("margin-top");
            }
          }
          // Tablet/Desktop: No changes needed, chat window stays in normal state
          
          let iconPath;
          switch(themeName) {
            case 'green':
              iconPath = getAssetPath("message-green.png");
              break;
            case 'red':
              iconPath = getAssetPath("message-red.png");
              break;
            case 'blue':
              iconPath = getAssetPath("message-blue.png");
              break;
            case 'yellow':
              iconPath = getAssetPath("message-yellow.png");
              break;
            case 'cyan':
              iconPath = getAssetPath("message-cyan.png");
              break;
            case 'white':
              iconPath = getAssetPath("message-white.png");
              break;
            case 'black':
            default:
              iconPath = getAssetPath("message.png");
              break;
          }
          chatIcon.src = iconPath;
          bubble.classList.remove("chat-open");
          // iOS fix: Explicitly restore bubble display to ensure it's visible
          bubble.style.display = "flex";
          
          // Stop timestamp updates when chat is closed
          stopTimestampUpdates();
        }
      };


      // ========================================
      // END CHAT WINDOW TOGGLE FUNCTIONALITY
      // ========================================


      // ========================================
      // CHAT WINDOW EVENT LISTENERS FUNCTIONALITY
      // ========================================
      // Add event listeners for opening and closing chat window
      
      // Open chat from bubble click/touch
      let bubbleTouchHandled = false;
      
      bubble.addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (bubbleTouchHandled) return;
        bubbleTouchHandled = true;
        console.log('Chat bubble touchend, window width:', window.innerWidth);
        toggleChat();
        setTimeout(() => { bubbleTouchHandled = false; }, 500);
      }, { passive: false });
      
      bubble.addEventListener("click", (e) => {
        if (bubbleTouchHandled) {
          bubbleTouchHandled = false;
          return;
        }
        console.log('Chat bubble clicked, window width:', window.innerWidth);
        toggleChat();
      });

      // Close chat from header close button (and message-list close – same class .close-button)
      const closeButtons = shadow.querySelectorAll(".close-button");
      closeButtons.forEach((btn) => {
        // Track if touch already handled to prevent double-fire
        let touchHandled = false;
        
        btn.addEventListener("touchend", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (touchHandled) return;
          touchHandled = true;
          console.log('Close button touchend - closing chat');
          
          // On iOS, use forceCloseChat for reliability
          if (isOpen) {
            forceCloseChat();
          } else {
            toggleChat();
          }
          
          // Reset touch flag after a short delay
          setTimeout(() => { touchHandled = false; }, 500);
        }, { passive: false });
        
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          // Skip if touch already handled
          if (touchHandled) {
            touchHandled = false;
            return;
          }
          console.log('Close button click - closing chat');
          
          // Use forceCloseChat when closing for reliability
          if (isOpen) {
            forceCloseChat();
          } else {
            toggleChat();
          }
        });
      });
      if (closeButtons.length === 0) {
        console.error("Close button not found in shadow DOM");
      }

      // Close chat from message container X button
      if (messageCloseBtn) {
        messageCloseBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleChat();
        });
      }

      // Close chat from FAB (when open)
      chatIcon.addEventListener("click", (e) => {
        if (isOpen) {
          e.stopPropagation();
          toggleChat();
        }
      });


      // ========================================
      // END CHAT WINDOW EVENT LISTENERS FUNCTIONALITY
      // ========================================


      // ========================================
      // COUNTRY CODE DROPDOWN AND PHONE VALIDATION FUNCTIONALITY
      // ========================================
      // Country codes data with flags, phone formats, and validation patterns
      const countryCodes = [
        { code: "966", flag: "🇸🇦", name: "Saudi Arabia", iso: "SA", format: "5xxxxxxxx", pattern: /^5\d{8}$/, minLength: 9, maxLength: 9 },
        { code: "1", flag: "🇺🇸", name: "United States", iso: "US", format: "(xxx) xxx-xxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "44", flag: "🇬🇧", name: "United Kingdom", iso: "GB", format: "xxxx xxxxxx", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
        { code: "971", flag: "🇦🇪", name: "United Arab Emirates", iso: "AE", format: "5x xxx xxxx", pattern: /^5\d{8}$/, minLength: 9, maxLength: 9 },
        { code: "965", flag: "🇰🇼", name: "Kuwait", iso: "KW", format: "xxxx xxxx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "974", flag: "🇶🇦", name: "Qatar", iso: "QA", format: "xxxx xxxx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "973", flag: "🇧🇭", name: "Bahrain", iso: "BH", format: "xxxx xxxx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "968", flag: "🇴🇲", name: "Oman", iso: "OM", format: "xxxx xxxx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "961", flag: "🇱🇧", name: "Lebanon", iso: "LB", format: "xx xxx xxx", pattern: /^\d{7,8}$/, minLength: 7, maxLength: 8 },
        { code: "962", flag: "🇯🇴", name: "Jordan", iso: "JO", format: "x xxxx xxxx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "20", flag: "🇪🇬", name: "Egypt", iso: "EG", format: "xxx xxx xxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "212", flag: "🇲🇦", name: "Morocco", iso: "MA", format: "xxxx-xxxxxx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "213", flag: "🇩🇿", name: "Algeria", iso: "DZ", format: "xxx xx xx xx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "216", flag: "🇹🇳", name: "Tunisia", iso: "TN", format: "xx xxx xxx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "33", flag: "🇫🇷", name: "France", iso: "FR", format: "x xx xx xx xx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "49", flag: "🇩🇪", name: "Germany", iso: "DE", format: "xxxx xxxxxxx", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
        { code: "39", flag: "🇮🇹", name: "Italy", iso: "IT", format: "xxx xxx xxxx", pattern: /^\d{9,10}$/, minLength: 9, maxLength: 10 },
        { code: "34", flag: "🇪🇸", name: "Spain", iso: "ES", format: "xxx xxx xxx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "31", flag: "🇳🇱", name: "Netherlands", iso: "NL", format: "x xxxx xxxx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "32", flag: "🇧🇪", name: "Belgium", iso: "BE", format: "xxxx xx xx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "41", flag: "🇨🇭", name: "Switzerland", iso: "CH", format: "xx xxx xx xx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "43", flag: "🇦🇹", name: "Austria", iso: "AT", format: "xxxx xxxxxx", pattern: /^\d{10,13}$/, minLength: 10, maxLength: 13 },
        { code: "46", flag: "🇸🇪", name: "Sweden", iso: "SE", format: "xx-xxx xx xx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "47", flag: "🇳🇴", name: "Norway", iso: "NO", format: "xxx xx xxx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "45", flag: "🇩🇰", name: "Denmark", iso: "DK", format: "xx xx xx xx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "358", flag: "🇫🇮", name: "Finland", iso: "FI", format: "xx xxx xxxx", pattern: /^\d{9,10}$/, minLength: 9, maxLength: 10 },
        { code: "7", flag: "🇷🇺", name: "Russia", iso: "RU", format: "xxx xxx-xx-xx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "86", flag: "🇨🇳", name: "China", iso: "CN", format: "xxx xxxx xxxx", pattern: /^\d{11}$/, minLength: 11, maxLength: 11 },
        { code: "81", flag: "🇯🇵", name: "Japan", iso: "JP", format: "xx-xxxx-xxxx", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
        { code: "82", flag: "🇰🇷", name: "South Korea", iso: "KR", format: "xxx-xxxx-xxxx", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
        { code: "91", flag: "🇮🇳", name: "India", iso: "IN", format: "xxxxx xxxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "61", flag: "🇦🇺", name: "Australia", iso: "AU", format: "xxxx xxxx", pattern: /^\d{9,10}$/, minLength: 9, maxLength: 10 },
        { code: "64", flag: "🇳🇿", name: "New Zealand", iso: "NZ", format: "xxxx xxxx", pattern: /^\d{8,9}$/, minLength: 8, maxLength: 9 },
        { code: "27", flag: "🇿🇦", name: "South Africa", iso: "ZA", format: "xx xxx xxxx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "52", flag: "🇲🇽", name: "Mexico", iso: "MX", format: "xx xxxx xxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "55", flag: "🇧🇷", name: "Brazil", iso: "BR", format: "(xx) xxxxx-xxxx", pattern: /^\d{10,11}$/, minLength: 10, maxLength: 11 },
        { code: "54", flag: "🇦🇷", name: "Argentina", iso: "AR", format: "xx xxxx-xxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "90", flag: "🇹🇷", name: "Turkey", iso: "TR", format: "xxx xxx xx xx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "60", flag: "🇲🇾", name: "Malaysia", iso: "MY", format: "xx-xxx xxxx", pattern: /^\d{9,10}$/, minLength: 9, maxLength: 10 },
        { code: "65", flag: "🇸🇬", name: "Singapore", iso: "SG", format: "xxxx xxxx", pattern: /^\d{8}$/, minLength: 8, maxLength: 8 },
        { code: "66", flag: "🇹🇭", name: "Thailand", iso: "TH", format: "xx-xxx-xxxx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 },
        { code: "62", flag: "🇮🇩", name: "Indonesia", iso: "ID", format: "xxx-xxxx-xxxx", pattern: /^\d{9,11}$/, minLength: 9, maxLength: 11 },
        { code: "63", flag: "🇵🇭", name: "Philippines", iso: "PH", format: "xxx xxx xxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "84", flag: "🇻🇳", name: "Vietnam", iso: "VN", format: "xxx xxxx xxx", pattern: /^\d{9,10}$/, minLength: 9, maxLength: 10 },
        { code: "92", flag: "🇵🇰", name: "Pakistan", iso: "PK", format: "xxx xxxxxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "880", flag: "🇧🇩", name: "Bangladesh", iso: "BD", format: "xxxx-xxxxxx", pattern: /^\d{10}$/, minLength: 10, maxLength: 10 },
        { code: "94", flag: "🇱🇰", name: "Sri Lanka", iso: "LK", format: "xx xxx xxxx", pattern: /^\d{9}$/, minLength: 9, maxLength: 9 }
      ];

      // Current selected country (default: Saudi Arabia)
      let selectedCountry = countryCodes.find(c => c.code === "966") || countryCodes[0];

      // Validate phone number - auto-detects country code from input (accessible globally)
      function validatePhoneNumber() {
        if (!phoneInput || !phoneValidationError) return;
        
        const phoneNumber = phoneInput.value.trim().replace(/\D/g, "");
        
        if (!phoneNumber) {
          phoneInput.classList.remove("valid", "invalid");
          if (customPlaceholder) customPlaceholder.classList.remove("invalid");
          phoneValidationError.style.display = "none";
          return;
        }
        
        // Auto-detect country code from input
        let detectedCountry = null;
        
        // Try to match country code from the beginning of the phone number
        // Sort by code length (longest first) to match longer codes first (e.g., 966 before 96)
        const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
        
        for (const country of sortedCodes) {
          if (phoneNumber.startsWith(country.code)) {
            detectedCountry = country;
            break;
          }
        }
        
        // If no country code detected, default to Saudi Arabia (966)
        if (!detectedCountry) {
          detectedCountry = countryCodes.find(c => c.code === "966") || countryCodes[0];
        }
        
        // Extract phone number without country code for validation
        let phoneWithoutCode = phoneNumber;
        if (phoneNumber.startsWith(detectedCountry.code)) {
          phoneWithoutCode = phoneNumber.substring(detectedCountry.code.length);
        }
        
        // Check length
        if (phoneWithoutCode.length < detectedCountry.minLength || phoneWithoutCode.length > detectedCountry.maxLength) {
          phoneInput.classList.remove("valid");
          phoneInput.classList.add("invalid");
          if (customPlaceholder) customPlaceholder.classList.add("invalid");
          phoneValidationError.textContent = "الرجاء إدخال رقم صحيح";
          phoneValidationError.style.display = "block";
          return;
        }
        
        // Check pattern
        if (detectedCountry.pattern && !detectedCountry.pattern.test(phoneWithoutCode)) {
          phoneInput.classList.remove("valid");
          phoneInput.classList.add("invalid");
          if (customPlaceholder) customPlaceholder.classList.add("invalid");
          phoneValidationError.textContent = "الرجاء إدخال رقم صحيح";
          phoneValidationError.style.display = "block";
          return;
        }
        
        // Valid
        phoneInput.classList.remove("invalid");
        phoneInput.classList.add("valid");
        if (customPlaceholder) customPlaceholder.classList.remove("invalid");
        phoneValidationError.style.display = "none";
      }

      // Initialize country code dropdown and phone validation
      // COUNTRY CODE DROPDOWN LOGIC COMMENTED OUT - keeping for safety
      // Validation still works with all countries - detects country code from input
      if (phoneInput) {
        // Dropdown initialization commented out
        /*
        if (phoneInput && countryCodeBtn && countryCodeDropdown && countryList) {
          // Populate country list
          function populateCountryList(filter = "") {
            if (!countryList) return;
            
            countryList.innerHTML = "";
            const filtered = countryCodes.filter(country => 
              country.name.toLowerCase().includes(filter.toLowerCase()) ||
              country.code.includes(filter) ||
              `+${country.code}`.includes(filter)
            );
            
            filtered.forEach(country => {
              const option = document.createElement("div");
              option.className = `country-option ${country.code === selectedCountry.code ? "selected" : ""}`;
              option.innerHTML = `
                <span class="country-option-code">+${country.code}</span>
              `;
              option.addEventListener("click", () => {
                selectCountry(country);
              });
              countryList.appendChild(option);
            });
          }

          // Select country
          function selectCountry(country) {
            selectedCountry = country;
            
            // Update dropdown button
            if (countryCodeText) countryCodeText.textContent = `+${country.code}`;
            
            // Update placeholder format
            if (numberFormat) numberFormat.textContent = country.format;
            
            // Clear input value when country changes
              phoneInput.value = "";
              
            // Close dropdown
            if (countryCodeDropdown) countryCodeDropdown.style.display = "none";
            if (countryCodeBtn) countryCodeBtn.classList.remove("open");
            
            // Re-populate list to update selected state
            populateCountryList("");
            
            // Clear validation
            phoneInput.classList.remove("valid", "invalid");
            if (customPlaceholder) customPlaceholder.classList.remove("invalid");
            if (phoneValidationError) phoneValidationError.style.display = "none";
            
            // Update placeholder visibility
            updatePlaceholderVisibility();
          }

          // Initialize with default country (Saudi Arabia)
          selectCountry(selectedCountry);
          populateCountryList();

          // Country code dropdown toggle
          if (countryCodeBtn) {
            countryCodeBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              const isOpen = countryCodeDropdown.style.display === "block";
              countryCodeDropdown.style.display = isOpen ? "none" : "block";
              countryCodeBtn.classList.toggle("open", !isOpen);
            });
          }

          // Close dropdown when clicking outside
          document.addEventListener("click", (e) => {
            if (countryCodeDropdown && countryCodeBtn && 
                !countryCodeDropdown.contains(e.target) && 
                !countryCodeBtn.contains(e.target)) {
              countryCodeDropdown.style.display = "none";
              if (countryCodeBtn) countryCodeBtn.classList.remove("open");
            }
          });
        }
        */

        // Update placeholder visibility
        function updatePlaceholderVisibility() {
          if (customPlaceholder && phoneInput) {
            const value = phoneInput.value.trim();
            if (value.length > 0) {
              customPlaceholder.style.display = "none";
            } else {
              customPlaceholder.style.display = "flex";
              // Remove invalid class when placeholder is shown (empty input)
              customPlaceholder.classList.remove("invalid");
            }
          }
        }

        // Phone input validation (works with all countries - auto-detects country code)
        phoneInput.value = "";
        phoneInput.addEventListener("input", (e) => {
          // Only allow digits
          const value = e.target.value.replace(/\D/g, "");
          phoneInput.value = value;
          
          // Hide placeholder when user types
          updatePlaceholderVisibility();
          validatePhoneNumber();
        });

        phoneInput.addEventListener("blur", () => {
          validatePhoneNumber();
          // Show placeholder if input is empty
          updatePlaceholderVisibility();
        });

        phoneInput.addEventListener("focus", () => {
          // Hide placeholder when focused
          if (customPlaceholder) {
            customPlaceholder.style.display = "none";
          }
          
          // ========================================
          // iOS-SPECIFIC: Hide footer when phone input is focused (keyboard opens)
          // ========================================
          const isIOS = checkIsIOS();
          if (isIOS && checkIsMobile()) {
            const fugahFooter = shadow.querySelector("#fugah-footer");
            // Hide footer completely so user can see what they type
            if (fugahFooter) {
              fugahFooter.style.setProperty("display", "none", "important");
            }
          }
        });
        
        // ========================================
        // iOS-SPECIFIC: Show footer when phone input loses focus (keyboard closes)
        // ========================================
        phoneInput.addEventListener("blur", () => {
          validatePhoneNumber();
          // Show placeholder if input is empty
          updatePlaceholderVisibility();
          
          const isIOS = checkIsIOS();
          if (isIOS && checkIsMobile()) {
            // Small delay to ensure keyboard is fully closed
            setTimeout(() => {
              const fugahFooter = shadow.querySelector("#fugah-footer");
              // Show footer again when keyboard closes
              if (fugahFooter) {
                fugahFooter.style.setProperty("display", "flex", "important");
                fugahFooter.style.removeProperty("display"); // Remove inline style to use CSS default
              }
              
              // Trigger viewport update to restore full height
              if (mobileHeightUpdateHandler) {
                mobileHeightUpdateHandler();
              }
            }, 300);
          }
        });

        // Handle Enter key
        phoneInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && sendMessageBtn) {
            e.preventDefault();
            if (!phoneInput.classList.contains("invalid") && phoneInput.value.trim()) {
              sendMessageBtn.click();
            }
          }
        });

        // Add touch event listeners for mobile devices
        // Touch start - hide placeholder when user touches input field
        phoneInput.addEventListener("touchstart", (e) => {
          // Hide placeholder when touched (mobile)
          if (customPlaceholder) {
            customPlaceholder.style.display = "none";
          }
          // Focus the input to show keyboard
          phoneInput.focus();
        });

        // Touch end - validate when user finishes touching (mobile)
        phoneInput.addEventListener("touchend", (e) => {
          // Validate phone number after touch interaction
          validatePhoneNumber();
          // Show placeholder if input is empty
          updatePlaceholderVisibility();
        });
      }


      // ========================================
      // END COUNTRY CODE DROPDOWN AND PHONE VALIDATION FUNCTIONALITY
      // ========================================


      // ========================================
      // MAIN SEND BUTTON FUNCTIONALITY
      // ========================================
      // Handle main send button click - switches to message tab only if phone number is valid
      if (sendMessageBtn) {
        sendMessageBtn.addEventListener("click", () => {
          // Validate phone number before switching
          if (phoneInput) {
            const phoneNumber = phoneInput.value.trim().replace(/\D/g, "");
            
            // Check if phone number exists and is valid
            if (!phoneNumber) {
              // No phone number entered, show specific error message
              phoneInput.classList.remove("valid");
              phoneInput.classList.add("invalid");
              if (customPlaceholder) customPlaceholder.classList.add("invalid");
              if (phoneValidationError) {
                phoneValidationError.textContent = "الرجاء إدخال رقم الهاتف";
                phoneValidationError.style.display = "block";
              }
              return;
            }
            
            // Validate phone number using the same auto-detection logic
            // Auto-detect country code from input
            let detectedCountry = null;
            const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
            
            for (const country of sortedCodes) {
              if (phoneNumber.startsWith(country.code)) {
                detectedCountry = country;
                break;
              }
            }
            
            // If no country code detected, default to Saudi Arabia (966)
            if (!detectedCountry) {
              detectedCountry = countryCodes.find(c => c.code === "966") || countryCodes[0];
            }
            
            // Extract phone number without country code for validation
            let phoneWithoutCode = phoneNumber;
            if (phoneNumber.startsWith(detectedCountry.code)) {
              phoneWithoutCode = phoneNumber.substring(detectedCountry.code.length);
            }
            
            // Check if phone number is valid according to detected country
            const isValidLength = phoneWithoutCode.length >= detectedCountry.minLength && 
                                 phoneWithoutCode.length <= detectedCountry.maxLength;
            const isValidPattern = !detectedCountry.pattern || detectedCountry.pattern.test(phoneWithoutCode);
            const isNotInvalid = !phoneInput.classList.contains("invalid");
            
            if (isValidLength && isValidPattern && isNotInvalid) {
              // Phone number is valid, open chat detail directly (individual chat screen)
              // Clear phone input when leaving home screen
              if (phoneInput) {
                phoneInput.value = "";
                if (customPlaceholder) {
                  customPlaceholder.classList.remove("invalid");
                  customPlaceholder.style.display = "flex";
                }
                if (phoneValidationError) {
                  phoneValidationError.style.display = "none";
                }
                phoneInput.classList.remove("valid", "invalid");
              }
              
              // Hide home container
              if (mainHomeContainer) mainHomeContainer.style.display = "none";
              // Hide message list container
              if (mainMessageContainer) mainMessageContainer.style.display = "none";
              // Show message detail container (chat screen)
              if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "flex";
              // Hide rating container
              if (mainRatingContainer) mainRatingContainer.style.display = "none";
              // Add detail-active class on footer (tabs should be hidden in detail view)
              if (fugahFooter) fugahFooter.classList.add("detail-active");
              
              // Update footer tab images without switching to message list
              footerTabItems.forEach(item => {
                const tabType = item.getAttribute("data-tab");
                const img = item.querySelector("img");
                const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
                const themeName = currentTheme ? currentTheme[1] : 'default';
                
                if (tabType === "message") {
                  item.classList.add("active");
                  if (themeName === 'black') {
                    img.src = getAssetPath("active-message-footer-black.png");
                  } else {
                    img.src = getAssetPath("active-message-footer.png");
                  }
                  img.alt = "message active";
                } else if (tabType === "home") {
                  item.classList.remove("active");
                  if (themeName === 'black') {
                    img.src = getAssetPath("new-img.png");
                  } else {
                    img.src = getAssetPath("inactive-home-footer.png.png");
                  }
                  img.alt = "home inactive";
                }
              });
              
              // Scroll to bottom of messages
              if (messageDetailMessages) {
                setTimeout(() => {
                  messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight;
                }, 100);
              }
            } else {
              // Phone number is invalid format, trigger validation to show error
              if (typeof validatePhoneNumber === 'function') {
                validatePhoneNumber();
              } else {
                // If validatePhoneNumber is not accessible, manually validate
                phoneInput.classList.remove("valid");
                phoneInput.classList.add("invalid");
                if (customPlaceholder) customPlaceholder.classList.add("invalid");
                if (phoneValidationError) {
                  phoneValidationError.textContent = "الرجاء إدخال رقم صحيح";
                  phoneValidationError.style.display = "block";
                }
              }
            }
          } else {
            // No phone input, open chat detail directly (fallback)
            // Hide home container
            if (mainHomeContainer) mainHomeContainer.style.display = "none";
            // Hide message list container
            if (mainMessageContainer) mainMessageContainer.style.display = "none";
            // Show message detail container (chat screen)
            if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "flex";
            // Hide rating container
            if (mainRatingContainer) mainRatingContainer.style.display = "none";
            // Add detail-active class on footer (tabs should be hidden in detail view)
            if (fugahFooter) fugahFooter.classList.add("detail-active");
            
            // Update footer tab images without switching to message list
            footerTabItems.forEach(item => {
              const tabType = item.getAttribute("data-tab");
              const img = item.querySelector("img");
              const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
              const themeName = currentTheme ? currentTheme[1] : 'default';
              
              if (tabType === "message") {
                item.classList.add("active");
                if (themeName === 'black') {
                  img.src = getAssetPath("active-message-footer-black.png");
                } else {
                  img.src = getAssetPath("active-message-footer.png");
                }
                img.alt = "message active";
              } else if (tabType === "home") {
                item.classList.remove("active");
                if (themeName === 'black') {
                  img.src = getAssetPath("new-img.png");
                } else {
                  img.src = getAssetPath("inactive-home-footer.png.png");
                }
                img.alt = "home inactive";
              }
            });
            
            // Scroll to bottom of messages
            if (messageDetailMessages) {
              setTimeout(() => {
                messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight;
              }, 100);
            }
          }
        });
        
        // Add touch event listener for mobile devices
        sendMessageBtn.addEventListener("touchstart", (e) => {
          e.preventDefault(); // Prevent double-firing with click event
          // Validate phone number before switching
          if (phoneInput) {
            const phoneNumber = phoneInput.value.trim().replace(/\D/g, "");
            
            // Check if phone number exists and is valid
            if (!phoneNumber) {
              // No phone number entered, show specific error message
              phoneInput.classList.remove("valid");
              phoneInput.classList.add("invalid");
              if (customPlaceholder) customPlaceholder.classList.add("invalid");
              if (phoneValidationError) {
                phoneValidationError.textContent = "الرجاء إدخال رقم الهاتف";
                phoneValidationError.style.display = "block";
              }
              return;
            }
            
            // Validate phone number using the same auto-detection logic
            // Auto-detect country code from input
            let detectedCountry = null;
            const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
            
            for (const country of sortedCodes) {
              if (phoneNumber.startsWith(country.code)) {
                detectedCountry = country;
                break;
              }
            }
            
            // If no country code detected, default to Saudi Arabia (966)
            if (!detectedCountry) {
              detectedCountry = countryCodes.find(c => c.code === "966") || countryCodes[0];
            }
            
            // Extract phone number without country code for validation
            let phoneWithoutCode = phoneNumber;
            if (phoneNumber.startsWith(detectedCountry.code)) {
              phoneWithoutCode = phoneNumber.substring(detectedCountry.code.length);
            }
            
            // Check if phone number is valid according to detected country
            const isValidLength = phoneWithoutCode.length >= detectedCountry.minLength && 
                                 phoneWithoutCode.length <= detectedCountry.maxLength;
            const isValidPattern = !detectedCountry.pattern || detectedCountry.pattern.test(phoneWithoutCode);
            const isNotInvalid = !phoneInput.classList.contains("invalid");
            
            if (isValidLength && isValidPattern && isNotInvalid) {
              // Phone number is valid, open chat detail directly (individual chat screen)
              // Clear phone input when leaving home screen
              if (phoneInput) {
                phoneInput.value = "";
                if (customPlaceholder) {
                  customPlaceholder.classList.remove("invalid");
                  customPlaceholder.style.display = "flex";
                }
                if (phoneValidationError) {
                  phoneValidationError.style.display = "none";
                }
                phoneInput.classList.remove("valid", "invalid");
              }
              
              // Hide home container
              if (mainHomeContainer) mainHomeContainer.style.display = "none";
              // Hide message list container
              if (mainMessageContainer) mainMessageContainer.style.display = "none";
              // Show message detail container (chat screen)
              if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "flex";
              // Hide rating container
              if (mainRatingContainer) mainRatingContainer.style.display = "none";
              // Add detail-active class on footer (tabs should be hidden in detail view)
              if (fugahFooter) fugahFooter.classList.add("detail-active");
              
              // Update footer tab images without switching to message list
              footerTabItems.forEach(item => {
                const tabType = item.getAttribute("data-tab");
                const img = item.querySelector("img");
                const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
                const themeName = currentTheme ? currentTheme[1] : 'default';
                
                if (tabType === "message") {
                  item.classList.add("active");
                  if (themeName === 'black') {
                    img.src = getAssetPath("active-message-footer-black.png");
                  } else {
                    img.src = getAssetPath("active-message-footer.png");
                  }
                  img.alt = "message active";
                } else if (tabType === "home") {
                  item.classList.remove("active");
                  if (themeName === 'black') {
                    img.src = getAssetPath("new-img.png");
                  } else {
                    img.src = getAssetPath("inactive-home-footer.png.png");
                  }
                  img.alt = "home inactive";
                }
              });
              
              // Scroll to bottom of messages
              if (messageDetailMessages) {
                setTimeout(() => {
                  messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight;
                }, 100);
              }
            } else {
              // Phone number is invalid format, trigger validation to show error
              if (typeof validatePhoneNumber === 'function') {
                validatePhoneNumber();
              } else {
                // If validatePhoneNumber is not accessible, manually validate
                phoneInput.classList.remove("valid");
                phoneInput.classList.add("invalid");
                if (customPlaceholder) customPlaceholder.classList.add("invalid");
                if (phoneValidationError) {
                  phoneValidationError.textContent = "الرجاء إدخال رقم صحيح";
                  phoneValidationError.style.display = "block";
                }
              }
            }
          } else {
            // No phone input, open chat detail directly (fallback)
            // Hide home container
            if (mainHomeContainer) mainHomeContainer.style.display = "none";
            // Hide message list container
            if (mainMessageContainer) mainMessageContainer.style.display = "none";
            // Show message detail container (chat screen)
            if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "flex";
            // Hide rating container
            if (mainRatingContainer) mainRatingContainer.style.display = "none";
            // Add detail-active class on footer (tabs should be hidden in detail view)
            if (fugahFooter) fugahFooter.classList.add("detail-active");
            
            // Update footer tab images without switching to message list
            footerTabItems.forEach(item => {
              const tabType = item.getAttribute("data-tab");
              const img = item.querySelector("img");
              const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
              const themeName = currentTheme ? currentTheme[1] : 'default';
              
              if (tabType === "message") {
                item.classList.add("active");
                if (themeName === 'black') {
                  img.src = getAssetPath("active-message-footer-black.png");
                } else {
                  img.src = getAssetPath("active-message-footer.png");
                }
                img.alt = "message active";
              } else if (tabType === "home") {
                item.classList.remove("active");
                if (themeName === 'black') {
                  img.src = getAssetPath("new-img.png");
                } else {
                  img.src = getAssetPath("inactive-home-footer.png.png");
                }
                img.alt = "home inactive";
              }
            });
            
            // Scroll to bottom of messages
            if (messageDetailMessages) {
              setTimeout(() => {
                messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight;
              }, 100);
            }
          }
        });
      }

      // Handle phone input enter key - already handled in country code section above


      // ========================================
      // END MAIN SEND BUTTON FUNCTIONALITY
      // ========================================


      // ========================================
      // TAB SWITCHING FUNCTIONALITY
      // ========================================
      // Handle switching between home and message tabs with proper image updates
      function switchTab(tabName) {
        // Clear phone input when leaving home screen
        if (tabName !== "home" && phoneInput) {
          phoneInput.value = "";
          if (customPlaceholder) {
            customPlaceholder.classList.remove("invalid");
            customPlaceholder.style.display = "block";
            customPlaceholder.style.opacity = "1";
          }
          if (phoneValidationError) {
            phoneValidationError.style.display = "none";
          }
          phoneInput.classList.remove("valid", "invalid");
        }
        
        // Remove active class from all tabs
        footerTabItems.forEach(item => {
          item.classList.remove("active");
        });

        // Get current theme to use correct images
        const currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
        const themeName = currentTheme ? currentTheme[1] : 'default';

        // Find and activate the clicked tab
        footerTabItems.forEach(item => {
          const tabType = item.getAttribute("data-tab");
          const img = item.querySelector("img");
          
          if (tabType === tabName) {
            // Activate this tab
            item.classList.add("active");
            
            // Update image to active variant based on theme
            if (tabName === "message") {
              if (themeName === 'black') {
                img.src = getAssetPath("active-message-footer-black.png");
              } else {
              img.src = getAssetPath("active-message-footer.png");
              }
              img.alt = "message active";
            } else if (tabName === "home") {
              if (themeName === 'black') {
                img.src = getAssetPath("active-home-footer-black.png");
              } else {
              img.src = getAssetPath("active-home-footer.png");
              }
              img.alt = "home active";
            }
          } else {
            // Deactivate other tabs based on theme
            if (tabType === "message") {
              if (themeName === 'black') {
                img.src = getAssetPath("inactive-message-footer-black.png.png");
              } else {
              img.src = getAssetPath("inactive-message-footer.png");
              }
              img.alt = "message inactive";
              console.log(`Setting inactive message image for theme ${themeName}:`, img.src);
            } else if (tabType === "home") {
              if (themeName === 'black') {
                img.src = getAssetPath("new-img.png");
              } else {
                img.src = getAssetPath("inactive-home-footer.png.png");
              }
              img.alt = "home inactive";
              console.log(`Setting inactive home image for theme ${themeName}:`, img.src);
            }
          }
        });

        // Show/hide containers based on active tab
        if (tabName === "home") {
          // Clear phone input when returning to home screen
          if (phoneInput) {
            phoneInput.value = "";
            if (customPlaceholder) {
              customPlaceholder.classList.remove("invalid");
              customPlaceholder.style.display = "flex";
            }
            if (phoneValidationError) {
              phoneValidationError.style.display = "none";
            }
            phoneInput.classList.remove("valid", "invalid");
          }
          
          if (mainHomeContainer) mainHomeContainer.style.display = "flex";
          if (mainMessageContainer) mainMessageContainer.style.display = "none";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer) mainRatingContainer.style.display = "none";
          // Remove detail-active class from footer
          if (fugahFooter) fugahFooter.classList.remove("detail-active");
        } else if (tabName === "message") {
          if (mainHomeContainer) mainHomeContainer.style.display = "none";
          if (mainMessageContainer) mainMessageContainer.style.display = "block";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer) mainRatingContainer.style.display = "none";
          // Remove detail-active class from footer (tabs should be visible in message list)
          if (fugahFooter) fugahFooter.classList.remove("detail-active");
          // Reset to message list when switching tabs
          goBackToMessageList();
          // Check and update empty state
          checkAndUpdateEmptyState();
        }
      }


      // ========================================
      // END TAB SWITCHING FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE DETAIL NAVIGATION FUNCTIONALITY
      // ========================================
      // Handle opening and closing of message detail view
      function openMessageDetail(messageId) {
        // Clear phone input when opening message detail
        if (phoneInput) {
          phoneInput.value = "";
          if (customPlaceholder) {
            customPlaceholder.classList.remove("invalid");
            customPlaceholder.style.display = "block";
            customPlaceholder.style.opacity = "1";
          }
          if (phoneValidationError) {
            phoneValidationError.style.display = "none";
          }
          phoneInput.classList.remove("valid", "invalid");
        }
        
        // Hide message list container
        if (mainMessageContainer) mainMessageContainer.style.display = "none";
        // Show message detail container
        if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "flex";
        // Add detail-active class on footer (tabs should be hidden in detail view)
        if (fugahFooter) fugahFooter.classList.add("detail-active");
        
        // Start timestamp updates for the last message
        startTimestampUpdates();
        
        // Only show timestamp if there are existing messages and the last one is from bot
        const lastMessage = messageDetailMessages?.querySelector(".chat-message:last-child");
        if (lastMessage && lastMessage.classList.contains("chat-message-bot")) {
          updateLastMessageTimestamp();
        }
        
        // Scroll to bottom of messages
        if (messageDetailMessages) {
          setTimeout(() => {
            messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight;
          }, 100);
        }
      }


      // ========================================
      // END MESSAGE DETAIL NAVIGATION FUNCTIONALITY
      // ========================================


      // ========================================
      // LOADING INDICATOR FUNCTIONALITY
      // ========================================
      // Show and remove loading indicators for bot responses
      function showLoadingIndicator() {
        if (!messageDetailMessages) return null;
        
        // Remove any existing loading indicator
        const existingLoading = messageDetailMessages.querySelector(".chat-message-loading");
        if (existingLoading) {
          existingLoading.remove();
        }
        
        // Remove timestamp when bot starts typing
        const existingTimestamp = messageDetailMessages.querySelector(".last-message-timestamp");
        if (existingTimestamp) {
          existingTimestamp.remove();
        }
        
        // Disable input field while bot is responding
        if (messageDetailInput) {
          messageDetailInput.disabled = true;
          messageDetailInput.setAttribute('readonly', 'readonly');
        }
        
        // Disable send button while bot is responding
        if (messageDetailSendBtn) {
          messageDetailSendBtn.classList.add("inactive");
          messageDetailSendBtn.disabled = true;
        }
        
        const messageDiv = document.createElement("div");
        messageDiv.className = "chat-message chat-message-bot";
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "chat-message-content";
        
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "chat-message-loading";
        loadingDiv.innerHTML = `
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        `;
        
        contentDiv.appendChild(loadingDiv);
        messageDiv.appendChild(contentDiv);
        messageDetailMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        setTimeout(() => {
          messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight;
        }, 50);
        
        return messageDiv;
      }

      function removeLoadingIndicator() {
        if (!messageDetailMessages) return;
        const loadingIndicator = messageDetailMessages.querySelector(".chat-message-loading");
        if (loadingIndicator) {
          loadingIndicator.closest(".chat-message").remove();
        }
      }


      // ========================================
      // END LOADING INDICATOR FUNCTIONALITY
      // ========================================


      // ========================================
      // DATE TIME FORMATTING FUNCTIONALITY
      // ========================================
      // Format current date and time in 12-hour format with AM/PM
      function formatDateTime() {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        
        // Convert to 12-hour format (NO SECONDS - only hours and minutes)
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        
        // Get minutes only - explicitly NOT using getSeconds()
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        // Return format: "16 Jan 2026, 2:57 PM" (NO SECONDS included)
        return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
      }


      // ========================================
      // END DATE TIME FORMATTING FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE SOUND FUNCTIONALITY
      // ========================================
      // Play sound notification when messages are sent or received
      function playMessageSound() {
        try {
          const audio = new Audio(getAssetPath("message.mp3"));
          audio.volume = 0.7; // Set volume to 70%
          audio.play().catch(error => {
            console.log("Could not play message sound:", error);
          });
        } catch (error) {
          console.log("Error creating audio:", error);
        }
      }


      // ========================================
      // END MESSAGE SOUND FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE CREATION FUNCTIONALITY
      // ========================================
      
      // ========================================
      // CONVERT URLS TO CLICKABLE LINKS
      // ========================================
      // This function detects URLs in text and converts them to clickable anchor tags
      // Links open in a new tab and are styled blue for visibility
      function linkifyText(text) {
        // Regular expression to match URLs (http, https, ftp, and www)
        const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
        
        return text.replace(urlPattern, function(url) {
          // Add https:// if the URL starts with www.
          const href = url.startsWith('www.') ? 'https://' + url : url;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
        });
      }
      // ========================================
      // END CONVERT URLS TO CLICKABLE LINKS
      // ========================================
      
      // Add messages to detail chat without individual timestamps
      function addDetailMessage(text, isUser = true, updateTimestamp = false) {
        addDetailMessageWithImage(text, null, isUser, updateTimestamp);
      }

      // Add message with optional image (imageDataUrl = data URL string, or null for text only)
      function addDetailMessageWithImage(text, imageDataUrl, isUser = true, updateTimestamp = false) {
        addDetailMessageWithFile(text, imageDataUrl, "image", null, isUser, updateTimestamp);
      }

      // Add message with optional file (image, PDF, or other). filePreviewUrl = data URL or blob URL; fileType = 'image'|'pdf'|'other'; fileName for display.
      function addDetailMessageWithFile(text, filePreviewUrl, fileType, fileName, isUser = true, updateTimestamp = false) {
        if (!messageDetailMessages) return;
        
        removeLoadingIndicator();
        
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message ${isUser ? "chat-message-user" : "chat-message-bot"}`;
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "chat-message-content";
        
        if (filePreviewUrl && fileType === "image") {
          const imgWrap = document.createElement("div");
          imgWrap.className = "chat-message-image-wrap";
          const img = document.createElement("img");
          img.className = "chat-message-img";
          img.src = filePreviewUrl;
          img.alt = "Image";
          img.loading = "lazy";
          if (fileName) img.setAttribute("data-file-name", fileName);
          imgWrap.appendChild(img);
          contentDiv.appendChild(imgWrap);
        } else if (filePreviewUrl && fileType === "video") {
          const videoWrap = document.createElement("div");
          videoWrap.className = "chat-message-video-wrap";
          const video = document.createElement("video");
          video.className = "chat-message-video";
          video.src = filePreviewUrl;
          video.setAttribute("preload", "metadata");
          video.setAttribute("playsinline", "");
          video.muted = true;
          if (fileName) video.setAttribute("data-file-name", fileName);
          videoWrap.appendChild(video);
          contentDiv.appendChild(videoWrap);
        } else if (filePreviewUrl && (fileType === "pdf" || fileType === "word" || fileType === "excel" || fileType === "other")) {
          const fileCard = document.createElement("div");
          fileCard.className = "chat-message-file";
          fileCard.setAttribute("data-preview-url", filePreviewUrl);
          fileCard.setAttribute("data-file-type", fileType);
          let defaultName = "File";
          let icon = "📎";
          if (fileType === "pdf") {
            defaultName = "Document.pdf";
            icon = "📄";
          } else if (fileType === "word") {
            defaultName = "Document.docx";
            icon = "📝";
          } else if (fileType === "excel") {
            defaultName = "Spreadsheet.xlsx";
            icon = "📊";
          }
          fileCard.setAttribute("data-file-name", fileName || defaultName);
          fileCard.textContent = `${icon} ${fileName || defaultName}`;
          contentDiv.appendChild(fileCard);
        }
        
        if (text && text.trim() !== "") {
          const textP = document.createElement("p");
          textP.innerHTML = linkifyText(text.replace(/\n/g, '<br>'));
          contentDiv.appendChild(textP);
        }
        
        messageDiv.appendChild(contentDiv);
        messageDetailMessages.appendChild(messageDiv);
        
        // Handle timestamp based on message type
        if (updateTimestamp) {
          // Bot message: Remove existing timestamp first, then add new one
          const existingTimestamp = messageDetailMessages.querySelector(".last-message-timestamp");
          if (existingTimestamp) {
            existingTimestamp.remove();
          }
          updateLastMessageTimestamp();
          
          // Re-enable input field when bot responds
          if (messageDetailInput) {
            messageDetailInput.disabled = false;
            messageDetailInput.removeAttribute('readonly');
          }
          
          // Re-enable send button when bot responds
          if (messageDetailSendBtn) {
            messageDetailSendBtn.disabled = false;
            toggleMessageDetailSendButtonState();
          }
        } else if (isUser) {
          // User message: Remove timestamp immediately (timestamp only shows for bot messages)
          const existingTimestamp = messageDetailMessages.querySelector(".last-message-timestamp");
          if (existingTimestamp) {
            existingTimestamp.remove();
          }
        }
        
        // Play message sound notification
        playMessageSound();
        
        // Scroll to bottom
        setTimeout(() => {
          messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight;
        }, 50);
      }


      // Function to update the last message timestamp
      function updateLastMessageTimestamp() {
        if (!messageDetailMessages) return;
        
        // Remove existing timestamp
        const existingTimestamp = messageDetailMessages.querySelector(".last-message-timestamp");
        if (existingTimestamp) {
          existingTimestamp.remove();
        }
        
        // Timestamp div creation disabled - keeping logic for safety
        // Add new timestamp for the last message
        // const timestampDiv = document.createElement("div");
        // timestampDiv.className = "last-message-timestamp chat-message-datetime";
        // timestampDiv.textContent = formatDateTime();
        // messageDetailMessages.appendChild(timestampDiv);
        
        // Store current minute and hour (no seconds) for 5-minute comparison
        const now = new Date();
        lastTimestampMinute = now.getMinutes();
        lastTimestampHour = now.getHours();
      }

      // Variable to store the timestamp update interval
      let timestampUpdateInterval = null;
      // Store the minute value when timestamp was last updated (only minutes, no seconds)
      let lastTimestampMinute = null;
      let lastTimestampHour = null;

      // Function to start the 5-minute timestamp update
      function startTimestampUpdates() {
        // Clear any existing interval
        if (timestampUpdateInterval) {
          clearInterval(timestampUpdateInterval);
        }
        
        // Helper function to check and update timestamp
        function checkAndUpdateTimestamp() {
          if (!messageDetailMessages) return;
          
          // Get all actual chat messages (excluding timestamp and loading indicator)
          const allMessages = Array.from(messageDetailMessages.children).filter(child => {
            return child.classList.contains("chat-message") && 
                   !child.classList.contains("last-message-timestamp") &&
                   !child.classList.contains("chat-message-loading");
          });
          
          const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
          const isLastMessageFromBot = lastMessage && lastMessage.classList.contains("chat-message-bot");
          
          if (isLastMessageFromBot) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Check if 5 minutes have passed (comparing only minutes and hours, ignoring seconds)
            let shouldUpdate = false;
            
            if (lastTimestampMinute === null || lastTimestampHour === null) {
              // First time, create timestamp
              shouldUpdate = true;
            } else {
              // Calculate minutes difference (handling hour rollover)
              let minutesDiff = 0;
              if (currentHour === lastTimestampHour) {
                // Same hour, simple subtraction
                minutesDiff = currentMinute - lastTimestampMinute;
              } else if (currentHour === lastTimestampHour + 1 || (currentHour === 0 && lastTimestampHour === 23)) {
                // Next hour (or hour rollover from 23 to 0)
                minutesDiff = (60 - lastTimestampMinute) + currentMinute;
              } else {
                // More than 1 hour difference, definitely update
                shouldUpdate = true;
              }
              
              // Update if 5 or more minutes have passed
              if (minutesDiff >= 5) {
                shouldUpdate = true;
              }
            }
            
            if (shouldUpdate) {
              // Update or create timestamp
              const lastTimestamp = messageDetailMessages.querySelector(".last-message-timestamp");
              if (lastTimestamp) {
                lastTimestamp.textContent = formatDateTime();
              } else {
                // Create timestamp if it doesn't exist
                updateLastMessageTimestamp();
              }
              // Store current minute and hour (no seconds)
              lastTimestampMinute = currentMinute;
              lastTimestampHour = currentHour;
            }
          } else {
            // Remove timestamp if last message is not from bot
            const lastTimestamp = messageDetailMessages.querySelector(".last-message-timestamp");
            if (lastTimestamp) {
              lastTimestamp.remove();
            }
            lastTimestampMinute = null;
            lastTimestampHour = null;
          }
        }
        
        // Check every second for exact 5-minute updates (only compares minutes, ignores seconds)
        // This ensures the timestamp updates exactly when the minute changes to be 5 minutes later
        timestampUpdateInterval = setInterval(checkAndUpdateTimestamp, 1000); // 1 second
        
        // Also check immediately to ensure timestamp is shown if needed
        checkAndUpdateTimestamp();
      }

      // Function to stop timestamp updates
      function stopTimestampUpdates() {
        if (timestampUpdateInterval) {
          clearInterval(timestampUpdateInterval);
          timestampUpdateInterval = null;
        }
      }


      // ========================================
      // END MESSAGE CREATION FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE SENDING FUNCTIONALITY
      // ========================================
      // Handle sending messages in detail chat with validation and bot responses
      function sendDetailMessage() {
        if (!messageDetailInput || !messageDetailSendBtn) return;
        
        // Don't send if button is inactive
        if (messageDetailSendBtn.classList.contains("inactive")) return;
        
        const message = messageDetailInput.value.trim();
        const file = messageDetailFileInput && messageDetailFileInput.files && messageDetailFileInput.files[0];
        const hasImage = file && file.type && file.type.startsWith("image/");
        const hasVideo = file && file.type && file.type.startsWith("video/");
        
        if (!message && !file) return;
        
        if (hasImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            addDetailMessageWithImage(message || "", imageDataUrl, true, false);
            messageDetailInput.value = "";
            if (typeof hideFilePreview === "function") hideFilePreview();
            autoResizeTextarea();
            toggleMessageDetailSendButtonState();
            showLoadingIndicator();
            setTimeout(() => {
              addDetailMessageWithImage("شكراً لك! تم استلام صورتك.", imageDataUrl, false, true);
            }, 1500);
          };
          reader.readAsDataURL(file);
        } else if (hasVideo) {
          const blobUrl = URL.createObjectURL(file);
          addDetailMessageWithFile(message || file.name, blobUrl, "video", file.name, true, false);
          messageDetailInput.value = "";
          if (typeof hideFilePreview === "function") hideFilePreview();
          autoResizeTextarea();
          toggleMessageDetailSendButtonState();
          showLoadingIndicator();
          setTimeout(() => {
            addDetailMessageWithFile("شكراً لك! تم استلام الفيديو.", blobUrl, "video", file.name, false, true);
          }, 1500);
        } else if (file) {
          const isPdf = file.type === "application/pdf";
          const isWord = file.type === "application/msword" || 
                         file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                         file.name.toLowerCase().endsWith(".doc") || 
                         file.name.toLowerCase().endsWith(".docx");
          const isExcel = file.type === "application/vnd.ms-excel" || 
                          file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                          file.name.toLowerCase().endsWith(".xls") || 
                          file.name.toLowerCase().endsWith(".xlsx");
          const blobUrl = URL.createObjectURL(file);
          let fileType = "other";
          if (isPdf) fileType = "pdf";
          else if (isWord) fileType = "word";
          else if (isExcel) fileType = "excel";
          addDetailMessageWithFile(message || file.name, blobUrl, fileType, file.name, true, false);
          messageDetailInput.value = "";
          if (typeof hideFilePreview === "function") hideFilePreview();
          autoResizeTextarea();
          toggleMessageDetailSendButtonState();
          showLoadingIndicator();
          setTimeout(() => {
            addDetailMessageWithFile("شكراً لك! تم استلام الملف.", blobUrl, fileType, file.name, false, true);
          }, 1500);
        } else {
          addDetailMessage(message, true, false);
          messageDetailInput.value = "";
          if (typeof hideFilePreview === "function") hideFilePreview();
          autoResizeTextarea();
          toggleMessageDetailSendButtonState();
          showLoadingIndicator();
          setTimeout(() => {
            addDetailMessage("شكراً لك! سأقوم بالرد عليك قريباً.", false, true);
          }, 1500);
        }
      }


      // ========================================
      // END MESSAGE SENDING FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE DETAIL EVENT LISTENERS FUNCTIONALITY
      // ========================================
      // Add event listeners for message detail input and send button
      if (messageDetailSendBtn) {
        messageDetailSendBtn.addEventListener("click", sendDetailMessage);
      }

      // ========================================
      // FILE UPLOAD PREVIEW FUNCTIONALITY
      // ========================================
      const messageDetailFileInput = shadow.querySelector("#message-detail-file-input");
      const filePreviewContainer = shadow.querySelector("#message-detail-file-preview");
      const filePreviewName = shadow.querySelector("#file-preview-name");
      const filePreviewThumb = shadow.querySelector("#file-preview-thumb");
      const filePreviewRemove = shadow.querySelector("#file-preview-remove");

      function hideFilePreview() {
        if (filePreviewContainer) filePreviewContainer.style.display = "none";
        if (filePreviewThumb) {
          filePreviewThumb.style.display = "none";
          filePreviewThumb.src = "";
          filePreviewThumb.alt = "";
        }
        if (filePreviewName) filePreviewName.textContent = "";
        if (messageDetailFileInput) messageDetailFileInput.value = "";
      }

      function showFilePreview(file) {
        if (!filePreviewContainer || !filePreviewName) return;
        filePreviewContainer.style.display = "block";
        filePreviewName.textContent = file.name;
        if (filePreviewThumb) {
          const isImage = file.type && file.type.startsWith("image/");
          const isVideo = file.type && file.type.startsWith("video/");
          if (isImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
              filePreviewThumb.src = e.target.result;
              filePreviewThumb.alt = file.name;
              filePreviewThumb.style.display = "block";
            };
            reader.readAsDataURL(file);
          } else if (isVideo) {
            const videoUrl = URL.createObjectURL(file);
            const tempVideo = document.createElement("video");
            tempVideo.muted = true;
            tempVideo.preload = "metadata";
            tempVideo.onloadeddata = function() {
              tempVideo.currentTime = 0.1;
            };
            tempVideo.onseeked = function() {
              const canvas = document.createElement("canvas");
              canvas.width = tempVideo.videoWidth || 120;
              canvas.height = tempVideo.videoHeight || 90;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
              filePreviewThumb.src = canvas.toDataURL("image/png");
              filePreviewThumb.alt = file.name;
              filePreviewThumb.style.display = "block";
              URL.revokeObjectURL(videoUrl);
            };
            tempVideo.onerror = function() {
              filePreviewThumb.style.display = "none";
              filePreviewThumb.src = "";
              URL.revokeObjectURL(videoUrl);
            };
            tempVideo.src = videoUrl;
          } else {
            filePreviewThumb.style.display = "none";
            filePreviewThumb.src = "";
          }
        }
      }

      if (messageDetailFileInput) {
        messageDetailFileInput.addEventListener("change", (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            showFilePreview(file);
          } else {
            hideFilePreview();
          }
          toggleMessageDetailSendButtonState();
        });
      }

      if (filePreviewRemove) {
        filePreviewRemove.addEventListener("click", (e) => {
          e.preventDefault();
          hideFilePreview();
          toggleMessageDetailSendButtonState();
        });
      }

      // Open full preview when user clicks on the file preview (image opens in modal)
      const filePreviewModal = shadow.querySelector("#file-preview-modal");
      const filePreviewModalImg = shadow.querySelector("#file-preview-modal-img");
      const filePreviewModalIframe = shadow.querySelector("#file-preview-modal-iframe");
      const filePreviewModalPdfWrap = shadow.querySelector("#file-preview-modal-pdf-wrap");
      const filePreviewModalOverlay = shadow.querySelector(".file-preview-modal-overlay");
      const filePreviewModalClose = shadow.querySelector("#file-preview-modal-close-btn") || shadow.querySelector(".file-preview-modal-close");
      const filePreviewModalDownload = shadow.querySelector("#file-preview-modal-download-btn");
      
      // Elements to hide when preview modal is open
      const chatRatingHeader = shadow.querySelector(".chat-rating-header");
      const fugahFooterEnd = shadow.querySelector("#fugah-footer-end");
      
      function hideHeaderFooterForPreview() {
        if (chatRatingHeader) chatRatingHeader.style.display = "none";
        if (fugahFooterEnd) fugahFooterEnd.style.display = "none";
      }
      
      function showHeaderFooterAfterPreview() {
        if (chatRatingHeader) chatRatingHeader.style.display = "";
        if (fugahFooterEnd) fugahFooterEnd.style.display = "";
      }

      let filePreviewModalBlobUrl = null;
      let currentPreviewUrl = null; // Track current preview URL for download
      let currentPreviewFileName = null; // Track current preview file name for download
      let pdfViewerPdfDoc = null;
      let pdfViewerNumPages = 0;
      let pdfViewerCurrentPage = 1;

      function loadPdfJs() {
        if (typeof window.pdfjsLib !== "undefined") {
          return Promise.resolve(window.pdfjsLib);
        }
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = function () {
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
              resolve(window.pdfjsLib);
            } else reject(new Error("PDF.js failed to load"));
          };
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      // Load mammoth.js for Word document rendering
      function loadMammothJs() {
        if (typeof window.mammoth !== "undefined") {
          return Promise.resolve(window.mammoth);
        }
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
          s.onload = function () {
            if (window.mammoth) {
              resolve(window.mammoth);
            } else reject(new Error("Mammoth.js failed to load"));
          };
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      // Load SheetJS (xlsx) for Excel document rendering
      function loadSheetJs() {
        if (typeof window.XLSX !== "undefined") {
          return Promise.resolve(window.XLSX);
        }
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload = function () {
            if (window.XLSX) {
              resolve(window.XLSX);
            } else reject(new Error("SheetJS failed to load"));
          };
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      function renderPdfPageFit(pdfDoc, pageNum, container) {
        var cw = container.clientWidth || 300;
        var ch = container.clientHeight || 400;
        return pdfDoc.getPage(pageNum).then(function (page) {
          var vp1 = page.getViewport({ scale: 1 });
          var scale = Math.min(cw / vp1.width, ch / vp1.height);
          var viewport = page.getViewport({ scale: scale });
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");
          var dpr = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = viewport.width + "px";
          canvas.style.height = viewport.height + "px";
          ctx.scale(dpr, dpr);
          return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
            return canvas;
          });
        });
      }

      function showPdfFitToScreen(blobUrl) {
        if (!filePreviewModalPdfWrap || !filePreviewModal) return;
        if (filePreviewModalImg) filePreviewModalImg.style.display = "none";
        if (filePreviewModalIframe) {
          filePreviewModalIframe.src = "";
          filePreviewModalIframe.style.display = "none";
        }
        filePreviewModalPdfWrap.style.display = "flex";
        filePreviewModalPdfWrap.innerHTML = "";
        pdfViewerPdfDoc = null;
        pdfViewerNumPages = 0;
        pdfViewerCurrentPage = 1;
        filePreviewModal.style.display = "flex";
        filePreviewModal.setAttribute("aria-hidden", "false");
        hideHeaderFooterForPreview(); // Hide header/footer when preview modal is open

        var wrap = filePreviewModalPdfWrap;
        function doRender() {
          loadPdfJs()
            .then(function (pdfjsLib) {
              return pdfjsLib.getDocument(blobUrl).promise;
            })
            .then(function (pdf) {
              pdfViewerPdfDoc = pdf;
              pdfViewerNumPages = pdf.numPages;
              return renderPdfPageFit(pdf, 1, wrap);
            })
            .then(function (canvas) {
              wrap.appendChild(canvas);
              if (pdfViewerNumPages > 1) {
                var nav = document.createElement("div");
                nav.className = "file-preview-pdf-nav";
                var prev = document.createElement("button");
                prev.type = "button";
                prev.className = "file-preview-pdf-nav-btn";
                prev.textContent = "‹";
                prev.setAttribute("aria-label", "Previous page");
                var next = document.createElement("button");
                next.type = "button";
                next.className = "file-preview-pdf-nav-btn";
                next.textContent = "›";
                next.setAttribute("aria-label", "Next page");
                var label = document.createElement("span");
                label.className = "file-preview-pdf-nav-label";
                label.textContent = "1 / " + pdfViewerNumPages;
                nav.appendChild(prev);
                nav.appendChild(label);
                nav.appendChild(next);
                wrap.appendChild(nav);
                function go(delta) {
                  var nextPage = pdfViewerCurrentPage + delta;
                  if (nextPage < 1 || nextPage > pdfViewerNumPages) return;
                  pdfViewerCurrentPage = nextPage;
                  label.textContent = nextPage + " / " + pdfViewerNumPages;
                  var first = wrap.querySelector("canvas");
                  if (first) first.remove();
                  renderPdfPageFit(pdfViewerPdfDoc, pdfViewerCurrentPage, wrap).then(function (c) {
                    wrap.insertBefore(c, nav);
                  });
                }
                prev.addEventListener("click", function () { go(-1); });
                next.addEventListener("click", function () { go(1); });
              }
            })
            .catch(function () {
              wrap.innerHTML = "";
              wrap.style.display = "none";
              if (filePreviewModalIframe) {
                filePreviewModalIframe.style.display = "block";
                filePreviewModalIframe.src = blobUrl;
              }
            });
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(doRender);
        });
      }

      // Show Word document fit to screen using mammoth.js
      function showWordFitToScreen(blobUrl) {
        if (!filePreviewModalPdfWrap || !filePreviewModal) return;
        if (filePreviewModalImg) filePreviewModalImg.style.display = "none";
        if (filePreviewModalIframe) {
          filePreviewModalIframe.src = "";
          filePreviewModalIframe.style.display = "none";
        }
        filePreviewModalPdfWrap.style.display = "flex";
        filePreviewModalPdfWrap.innerHTML = "";
        filePreviewModal.style.display = "flex";
        filePreviewModal.setAttribute("aria-hidden", "false");
        hideHeaderFooterForPreview(); // Hide header/footer when preview modal is open

        var wrap = filePreviewModalPdfWrap;
        
        // Create loading indicator
        var loadingDiv = document.createElement("div");
        loadingDiv.className = "file-preview-loading";
        loadingDiv.innerHTML = "<p>جاري تحميل المستند...</p>";
        wrap.appendChild(loadingDiv);

        function doRender() {
          fetch(blobUrl)
            .then(function(response) {
              return response.arrayBuffer();
            })
            .then(function(arrayBuffer) {
              return loadMammothJs().then(function(mammoth) {
                return mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              });
            })
            .then(function(result) {
              wrap.innerHTML = "";
              var contentDiv = document.createElement("div");
              contentDiv.className = "file-preview-word-content";
              contentDiv.innerHTML = result.value;
              wrap.appendChild(contentDiv);
            })
            .catch(function(err) {
              console.error("Word preview error:", err);
              wrap.innerHTML = "";
              var errorDiv = document.createElement("div");
              errorDiv.className = "file-preview-error";
              errorDiv.innerHTML = "<p>تعذر عرض المستند. <a href='" + blobUrl + "' download>تحميل الملف</a></p>";
              wrap.appendChild(errorDiv);
            });
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(doRender);
        });
      }

      // Show Excel document fit to screen using SheetJS
      function showExcelFitToScreen(blobUrl) {
        if (!filePreviewModalPdfWrap || !filePreviewModal) return;
        if (filePreviewModalImg) filePreviewModalImg.style.display = "none";
        if (filePreviewModalIframe) {
          filePreviewModalIframe.src = "";
          filePreviewModalIframe.style.display = "none";
        }
        filePreviewModalPdfWrap.style.display = "flex";
        filePreviewModalPdfWrap.innerHTML = "";
        filePreviewModal.style.display = "flex";
        filePreviewModal.setAttribute("aria-hidden", "false");
        hideHeaderFooterForPreview(); // Hide header/footer when preview modal is open

        var wrap = filePreviewModalPdfWrap;
        var excelCurrentSheet = 0;
        var excelWorkbook = null;
        
        // Create loading indicator
        var loadingDiv = document.createElement("div");
        loadingDiv.className = "file-preview-loading";
        loadingDiv.innerHTML = "<p>جاري تحميل جدول البيانات...</p>";
        wrap.appendChild(loadingDiv);

        function renderSheet(sheetIndex) {
          if (!excelWorkbook) return;
          var sheetNames = excelWorkbook.SheetNames;
          if (sheetIndex < 0 || sheetIndex >= sheetNames.length) return;
          
          var sheetName = sheetNames[sheetIndex];
          var worksheet = excelWorkbook.Sheets[sheetName];
          var html = window.XLSX.utils.sheet_to_html(worksheet, { editable: false });
          
          // Find or create content container
          var contentDiv = wrap.querySelector(".file-preview-excel-content");
          if (!contentDiv) {
            contentDiv = document.createElement("div");
            contentDiv.className = "file-preview-excel-content";
            wrap.insertBefore(contentDiv, wrap.querySelector(".file-preview-excel-nav"));
          }
          contentDiv.innerHTML = html;
          
          // Update nav label
          var label = wrap.querySelector(".file-preview-excel-nav-label");
          if (label) {
            label.textContent = sheetName + " (" + (sheetIndex + 1) + "/" + sheetNames.length + ")";
          }
        }

        function doRender() {
          fetch(blobUrl)
            .then(function(response) {
              return response.arrayBuffer();
            })
            .then(function(arrayBuffer) {
              return loadSheetJs().then(function(XLSX) {
                return XLSX.read(arrayBuffer, { type: "array" });
              });
            })
            .then(function(workbook) {
              wrap.innerHTML = "";
              excelWorkbook = workbook;
              excelCurrentSheet = 0;
              
              var contentDiv = document.createElement("div");
              contentDiv.className = "file-preview-excel-content";
              wrap.appendChild(contentDiv);
              
              // Render first sheet
              var sheetNames = workbook.SheetNames;
              var sheetName = sheetNames[0];
              var worksheet = workbook.Sheets[sheetName];
              var html = window.XLSX.utils.sheet_to_html(worksheet, { editable: false });
              contentDiv.innerHTML = html;
              
              // Add navigation if multiple sheets
              if (sheetNames.length > 1) {
                var nav = document.createElement("div");
                nav.className = "file-preview-excel-nav";
                var prev = document.createElement("button");
                prev.type = "button";
                prev.className = "file-preview-excel-nav-btn";
                prev.textContent = "‹";
                prev.setAttribute("aria-label", "Previous sheet");
                var next = document.createElement("button");
                next.type = "button";
                next.className = "file-preview-excel-nav-btn";
                next.textContent = "›";
                next.setAttribute("aria-label", "Next sheet");
                var label = document.createElement("span");
                label.className = "file-preview-excel-nav-label";
                label.textContent = sheetName + " (1/" + sheetNames.length + ")";
                nav.appendChild(prev);
                nav.appendChild(label);
                nav.appendChild(next);
                wrap.appendChild(nav);
                
                function go(delta) {
                  var nextSheet = excelCurrentSheet + delta;
                  if (nextSheet < 0 || nextSheet >= sheetNames.length) return;
                  excelCurrentSheet = nextSheet;
                  renderSheet(excelCurrentSheet);
                }
                prev.addEventListener("click", function () { go(-1); });
                next.addEventListener("click", function () { go(1); });
              }
            })
            .catch(function(err) {
              console.error("Excel preview error:", err);
              wrap.innerHTML = "";
              var errorDiv = document.createElement("div");
              errorDiv.className = "file-preview-error";
              errorDiv.innerHTML = "<p>تعذر عرض جدول البيانات. <a href='" + blobUrl + "' download>تحميل الملف</a></p>";
              wrap.appendChild(errorDiv);
            });
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(doRender);
        });
      }

      function openFilePreviewModal() {
        const file = messageDetailFileInput && messageDetailFileInput.files && messageDetailFileInput.files[0];
        if (!file) return;
        if (!filePreviewModal) return;

        const isImage = file.type && file.type.startsWith("image/");
        const isVideo = file.type && file.type.startsWith("video/");
        const isPdf = file.type === "application/pdf";
        const isWord = file.type === "application/msword" || 
                       file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                       file.name.toLowerCase().endsWith(".doc") || 
                       file.name.toLowerCase().endsWith(".docx");
        const isExcel = file.type === "application/vnd.ms-excel" || 
                        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                        file.name.toLowerCase().endsWith(".xls") || 
                        file.name.toLowerCase().endsWith(".xlsx");

        if (filePreviewModalBlobUrl) {
          URL.revokeObjectURL(filePreviewModalBlobUrl);
          filePreviewModalBlobUrl = null;
        }

        // Hide video element first
        var videoEl = filePreviewModal.querySelector("#file-preview-modal-video");
        if (videoEl) {
          videoEl.pause();
          videoEl.src = "";
          videoEl.style.display = "none";
        }

        if (isImage && filePreviewModalImg && filePreviewThumb && filePreviewThumb.src) {
          if (filePreviewModalIframe) {
            filePreviewModalIframe.style.display = "none";
            filePreviewModalIframe.src = "";
          }
          if (filePreviewModalPdfWrap) filePreviewModalPdfWrap.style.display = "none";
          filePreviewModalImg.style.display = "block";
          filePreviewModalImg.src = filePreviewThumb.src;
          filePreviewModalImg.alt = file.name;
          currentPreviewUrl = filePreviewThumb.src;
          currentPreviewFileName = file.name;
          hideHeaderFooterForPreview();
        } else if (isVideo) {
          filePreviewModalBlobUrl = URL.createObjectURL(file);
          if (filePreviewModalImg) {
            filePreviewModalImg.style.display = "none";
            filePreviewModalImg.src = "";
          }
          if (filePreviewModalIframe) {
            filePreviewModalIframe.style.display = "none";
            filePreviewModalIframe.src = "";
          }
          if (filePreviewModalPdfWrap) filePreviewModalPdfWrap.style.display = "none";
          
          // Create or get video element
          if (!videoEl) {
            videoEl = document.createElement("video");
            videoEl.id = "file-preview-modal-video";
            videoEl.className = "file-preview-modal-video";
            videoEl.setAttribute("controls", "");
            videoEl.setAttribute("playsinline", "");
            videoEl.style.cssText = "max-width: 100%; max-height: 80vh; width: auto; height: auto; object-fit: contain; border-radius: 8px;";
            var modalContent = filePreviewModal.querySelector(".file-preview-modal-content");
            if (modalContent) {
              modalContent.appendChild(videoEl);
            }
          }
          videoEl.src = filePreviewModalBlobUrl;
          videoEl.style.display = "block";
          currentPreviewUrl = filePreviewModalBlobUrl;
          currentPreviewFileName = file.name;
          filePreviewModal.style.display = "flex";
          filePreviewModal.setAttribute("aria-hidden", "false");
          hideHeaderFooterForPreview();
          return;
        } else if (isPdf) {
          filePreviewModalBlobUrl = URL.createObjectURL(file);
          currentPreviewUrl = filePreviewModalBlobUrl;
          currentPreviewFileName = file.name;
          showPdfFitToScreen(filePreviewModalBlobUrl);
          return;
        } else if (isWord) {
          filePreviewModalBlobUrl = URL.createObjectURL(file);
          currentPreviewUrl = filePreviewModalBlobUrl;
          currentPreviewFileName = file.name;
          showWordFitToScreen(filePreviewModalBlobUrl);
          return;
        } else if (isExcel) {
          filePreviewModalBlobUrl = URL.createObjectURL(file);
          currentPreviewUrl = filePreviewModalBlobUrl;
          currentPreviewFileName = file.name;
          showExcelFitToScreen(filePreviewModalBlobUrl);
          return;
        } else {
          const url = URL.createObjectURL(file);
          window.open(url, "_blank");
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return;
        }

        filePreviewModal.style.display = "flex";
        filePreviewModal.setAttribute("aria-hidden", "false");
        hideHeaderFooterForPreview();
      }

      var filePreviewCloseBodyEl = null;

      function addFilePreviewCloseToBody() {
        hideHeaderFooterForPreview();
        if (filePreviewCloseBodyEl && filePreviewCloseBodyEl.parentNode) return;
        var isMobile = typeof window.matchMedia !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
        if (!isMobile) return;
        var isMobile = typeof window.matchMedia !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
        if (!isMobile) return;
        if (!document.getElementById("fugah-preview-close-body-style")) {
          var style = document.createElement("style");
          style.id = "fugah-preview-close-body-style";
          style.textContent = "#fugah-file-preview-close-body{position:fixed !important;top:max(12px, env(safe-area-inset-top, 12px)) !important;right:max(12px, env(safe-area-inset-right, 12px)) !important;width:50px !important;height:50px !important;min-width:50px !important;min-height:50px !important;border:none !important;border-radius:50% !important;background:#000 !important;color:#fff !important;font-size:32px !important;line-height:1 !important;cursor:pointer !important;z-index:2147483647 !important;display:flex !important;align-items:center !important;justify-content:center !important;padding:0 !important;box-shadow:0 2px 12px rgba(0,0,0,0.5) !important;-webkit-tap-highlight-color:transparent !important;pointer-events:auto !important;-webkit-appearance:none !important;appearance:none !important;touch-action:manipulation !important;user-select:none !important;-webkit-user-select:none !important;}";
          document.head.appendChild(style);
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", "Close and go back to chat");
        btn.id = "fugah-file-preview-close-body";
        btn.innerHTML = "&times;";
        btn.style.cssText = "position:fixed;top:12px;right:12px;width:50px;height:50px;border:none;border-radius:50%;background:#000;color:#fff;font-size:32px;z-index:2147483647;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;touch-action:manipulation;";
        
        // Track if already handled to prevent double-fire
        var closeHandled = false;
        
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (closeHandled) return;
          closeHandled = true;
          console.log('Preview close button clicked');
          closeFilePreviewModal();
          setTimeout(function() { closeHandled = false; }, 500);
        });
        
        // Use touchend for iOS reliability
        btn.addEventListener("touchend", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (closeHandled) return;
          closeHandled = true;
          console.log('Preview close button touchend');
          closeFilePreviewModal();
          setTimeout(function() { closeHandled = false; }, 500);
        }, { passive: false });
        
        // Prevent touchstart from doing anything except stopping propagation
        btn.addEventListener("touchstart", function (e) {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }, { passive: false });
        
        document.body.appendChild(btn);
        filePreviewCloseBodyEl = btn;
      }

      function removeFilePreviewCloseFromBody() {
        if (filePreviewCloseBodyEl && filePreviewCloseBodyEl.parentNode) {
          filePreviewCloseBodyEl.parentNode.removeChild(filePreviewCloseBodyEl);
          filePreviewCloseBodyEl = null;
        }
      }

      function closeFilePreviewModal() {
        removeFilePreviewCloseFromBody();
        showHeaderFooterAfterPreview();
        if (!filePreviewModal) return;
        filePreviewModal.style.display = "none";
        filePreviewModal.setAttribute("aria-hidden", "true");
        if (filePreviewModalImg) {
          filePreviewModalImg.src = "";
          filePreviewModalImg.style.display = "block";
        }
        // Pause and reset video
        var videoEl = filePreviewModal.querySelector("#file-preview-modal-video");
        if (videoEl) {
          videoEl.pause();
          videoEl.src = "";
          videoEl.style.display = "none";
        }
        if (filePreviewModalIframe) {
          filePreviewModalIframe.src = "";
          filePreviewModalIframe.style.display = "none";
        }
        if (filePreviewModalPdfWrap) {
          filePreviewModalPdfWrap.innerHTML = "";
          filePreviewModalPdfWrap.style.display = "none";
        }
        pdfViewerPdfDoc = null;
        if (filePreviewModalBlobUrl) {
          URL.revokeObjectURL(filePreviewModalBlobUrl);
          filePreviewModalBlobUrl = null;
        }
        // Clear current preview tracking
        currentPreviewUrl = null;
        currentPreviewFileName = null;
      }

      if (filePreviewContainer) {
        filePreviewContainer.addEventListener("click", (e) => {
          if (e.target.closest(".file-preview-remove")) return;
          e.preventDefault();
          e.stopPropagation();
          openFilePreviewModal();
        });
        filePreviewContainer.addEventListener("touchstart", (e) => {
          if (e.target.closest(".file-preview-remove")) return;
          e.preventDefault();
          openFilePreviewModal();
        }, { passive: false });
      }

      if (filePreviewModalOverlay) {
        filePreviewModalOverlay.addEventListener("click", closeFilePreviewModal);
        filePreviewModalOverlay.addEventListener("touchstart", function (e) {
          e.preventDefault();
          closeFilePreviewModal();
        }, { passive: false });
      }
      if (filePreviewModalClose) {
        filePreviewModalClose.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          closeFilePreviewModal();
        });
        filePreviewModalClose.addEventListener("touchend", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          closeFilePreviewModal();
        }, { passive: false });
        filePreviewModalClose.addEventListener("touchstart", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }, { passive: false });
      }
      
      // Download the current preview file
      function downloadCurrentPreview() {
        if (!currentPreviewUrl) return;
        
        // For blob URLs or same-origin URLs, we can fetch and download
        fetch(currentPreviewUrl)
          .then(function(response) {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.blob();
          })
          .then(function(blob) {
            var downloadUrl = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = downloadUrl;
            a.download = currentPreviewFileName || "download";
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
          })
          .catch(function(err) {
            // Fallback: try opening in new tab
            console.warn("Download failed, opening in new tab:", err);
            var a = document.createElement("a");
            a.href = currentPreviewUrl;
            a.download = currentPreviewFileName || "download";
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
      }
      
      // Download button in preview modal - downloads the current file
      if (filePreviewModalDownload) {
        filePreviewModalDownload.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          downloadCurrentPreview();
        });
        filePreviewModalDownload.addEventListener("touchend", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          downloadCurrentPreview();
        }, { passive: false });
        filePreviewModalDownload.addEventListener("touchstart", function (e) {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }, { passive: false });
      }
      
      const filePreviewModalCloseIos = shadow.querySelector("#file-preview-modal-close-ios");
      if (filePreviewModalCloseIos) {
        filePreviewModalCloseIos.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          closeFilePreviewModal();
        });
        filePreviewModalCloseIos.addEventListener("touchend", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          closeFilePreviewModal();
        }, { passive: false });
        filePreviewModalCloseIos.addEventListener("touchstart", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }, { passive: false });
      }

      // Click on image in chat to open full preview
      function openModalWithImageSrc(src, fileName) {
        if (!filePreviewModal || !filePreviewModalImg) return;
        if (filePreviewModalBlobUrl) {
          URL.revokeObjectURL(filePreviewModalBlobUrl);
          filePreviewModalBlobUrl = null;
        }
        // Hide video element if present
        var videoEl = filePreviewModal.querySelector("#file-preview-modal-video");
        if (videoEl) {
          videoEl.pause();
          videoEl.src = "";
          videoEl.style.display = "none";
        }
        if (filePreviewModalIframe) {
          filePreviewModalIframe.src = "";
          filePreviewModalIframe.style.display = "none";
        }
        if (filePreviewModalPdfWrap) filePreviewModalPdfWrap.style.display = "none";
        filePreviewModalImg.style.display = "block";
        filePreviewModalImg.src = src;
        filePreviewModalImg.alt = "Preview";
        filePreviewModal.style.display = "flex";
        filePreviewModal.setAttribute("aria-hidden", "false");
        // Track current preview for download
        currentPreviewUrl = src;
        currentPreviewFileName = fileName || extractFileNameFromUrl(src);
        hideHeaderFooterForPreview(); // Hide header/footer when preview modal is open
      }
      
      // Extract file name from URL
      function extractFileNameFromUrl(url) {
        if (!url) return "download";
        try {
          var urlObj = new URL(url, window.location.origin);
          var pathname = urlObj.pathname;
          var parts = pathname.split("/");
          var name = parts[parts.length - 1];
          return name && name.length > 0 ? decodeURIComponent(name) : "download";
        } catch (e) {
          return "download";
        }
      }
      
      // Open modal with video
      function openModalWithVideo(src, fileName) {
        if (!filePreviewModal) return;
        if (filePreviewModalBlobUrl) {
          URL.revokeObjectURL(filePreviewModalBlobUrl);
          filePreviewModalBlobUrl = null;
        }
        // Hide image
        if (filePreviewModalImg) {
          filePreviewModalImg.style.display = "none";
          filePreviewModalImg.src = "";
        }
        if (filePreviewModalIframe) {
          filePreviewModalIframe.src = "";
          filePreviewModalIframe.style.display = "none";
        }
        if (filePreviewModalPdfWrap) filePreviewModalPdfWrap.style.display = "none";
        
        // Create or get video element
        var videoEl = filePreviewModal.querySelector("#file-preview-modal-video");
        if (!videoEl) {
          videoEl = document.createElement("video");
          videoEl.id = "file-preview-modal-video";
          videoEl.className = "file-preview-modal-video";
          videoEl.setAttribute("controls", "");
          videoEl.setAttribute("playsinline", "");
          videoEl.style.cssText = "max-width: 100%; max-height: 80vh; width: auto; height: auto; object-fit: contain; border-radius: 8px;";
          var modalContent = filePreviewModal.querySelector(".file-preview-modal-content");
          if (modalContent) {
            modalContent.appendChild(videoEl);
          }
        }
        videoEl.src = src;
        videoEl.style.display = "block";
        
        filePreviewModal.style.display = "flex";
        filePreviewModal.setAttribute("aria-hidden", "false");
        // Track current preview for download
        currentPreviewUrl = src;
        currentPreviewFileName = fileName || extractFileNameFromUrl(src);
        hideHeaderFooterForPreview();
      }

      // Open modal with blob URL for PDF, Word, Excel (from chat) - fit to screen
      function openModalWithBlobUrl(blobUrl, fileType, fileName) {
        if (!filePreviewModal) return;
        if (filePreviewModalBlobUrl) {
          URL.revokeObjectURL(filePreviewModalBlobUrl);
          filePreviewModalBlobUrl = null;
        }
        // Track current preview for download
        currentPreviewUrl = blobUrl;
        currentPreviewFileName = fileName || extractFileNameFromUrl(blobUrl);
        if (fileType === "pdf") {
          showPdfFitToScreen(blobUrl);
          return;
        }
        if (fileType === "word") {
          showWordFitToScreen(blobUrl);
          return;
        }
        if (fileType === "excel") {
          showExcelFitToScreen(blobUrl);
          return;
        }
        filePreviewModal.style.display = "flex";
        filePreviewModal.setAttribute("aria-hidden", "false");
      }

      if (messageDetailMessages) {
        function handlePreviewClick(e) {
          const img = e.target.closest(".chat-message-img");
          if (img && img.src) {
            e.preventDefault();
            e.stopPropagation();
            var imgFileName = img.getAttribute("data-file-name") || null;
            openModalWithImageSrc(img.src, imgFileName);
            return;
          }
          const video = e.target.closest(".chat-message-video");
          if (video && video.src) {
            e.preventDefault();
            e.stopPropagation();
            var videoFileName = video.getAttribute("data-file-name") || null;
            openModalWithVideo(video.src, videoFileName);
            return;
          }
          const fileCard = e.target.closest(".chat-message-file");
          if (fileCard) {
            e.preventDefault();
            e.stopPropagation();
            const url = fileCard.getAttribute("data-preview-url");
            const type = fileCard.getAttribute("data-file-type");
            const fileName = fileCard.getAttribute("data-file-name") || null;
            if (url && type === "pdf") {
              openModalWithBlobUrl(url, "pdf", fileName);
            } else if (url && type === "word") {
              openModalWithBlobUrl(url, "word", fileName);
            } else if (url && type === "excel") {
              openModalWithBlobUrl(url, "excel", fileName);
            } else if (url && type === "video") {
              openModalWithVideo(url, fileName);
            } else if (url && type === "other") {
              window.open(url, "_blank");
            }
          }
        }
        messageDetailMessages.addEventListener("click", handlePreviewClick);
        messageDetailMessages.addEventListener("touchstart", function (e) {
          const img = e.target.closest(".chat-message-img");
          const video = e.target.closest(".chat-message-video");
          const fileCard = e.target.closest(".chat-message-file");
          if ((img && img.src) || (video && video.src) || fileCard) {
            e.preventDefault();
            handlePreviewClick(e);
          }
        }, { passive: false });
      }
      // ========================================
      // END FILE UPLOAD PREVIEW FUNCTIONALITY
      // ========================================

      if (messageDetailInput) {
        messageDetailInput.addEventListener("keydown", (e) => {
          // Allow Enter key to work normally (create new line) - do not send message
          // Users should use the send button to send messages
          // Allow all arrow keys and navigation keys for proper textarea navigation
          if (e.key === "ArrowUp" || e.key === "ArrowDown" || 
              e.key === "ArrowLeft" || e.key === "ArrowRight" ||
              e.key === "Home" || e.key === "End" || 
              e.key === "PageUp" || e.key === "PageDown") {
            // Allow default behavior for navigation keys
            return;
          }
        });

        // Auto-resize textarea function
        function autoResizeTextarea() {
          if (!messageDetailInput) return;
          
          // Store current cursor position
          const cursorPos = messageDetailInput.selectionStart;
          const cursorEnd = messageDetailInput.selectionEnd;
          
          // Reset height to auto to get the correct scrollHeight
          messageDetailInput.style.height = 'auto';
          
          // Set height based on content, with min and max limits
          const newHeight = Math.min(Math.max(messageDetailInput.scrollHeight, 20), 100);
          messageDetailInput.style.height = newHeight + 'px';
          
          // Restore cursor position after resize
          messageDetailInput.setSelectionRange(cursorPos, cursorEnd);
        }

        // Toggle send button state based on input content and auto-resize
        messageDetailInput.addEventListener("input", () => {
          toggleMessageDetailSendButtonState();
          autoResizeTextarea();
        });

        // Trigger height update when input is focused (keyboard opens) - fixes first-time gap
        messageDetailInput.addEventListener("focus", () => {
          // ========================================
          // iOS-SPECIFIC: Hide footer when input is focused (keyboard opens)
          // ========================================
          const isIOS = checkIsIOS();
          if (isIOS && checkIsMobile()) {
            const fugahFooter = shadow.querySelector("#fugah-footer");
            // Hide footer completely so only input container is visible
            if (fugahFooter) {
              fugahFooter.style.setProperty("display", "none", "important");
            }
          }
          
          // Trigger viewport update after keyboard animation completes
          if (mobileHeightUpdateHandler) {
            // Wait for keyboard to fully open before updating
            // iOS needs slightly longer delay
            const delay = isIOS ? 500 : 450;
            setTimeout(() => {
              mobileHeightUpdateHandler();
            }, delay);
          }
        });
        
        // ========================================
        // iOS-SPECIFIC: Show footer when input loses focus (keyboard closes)
        // ========================================
        messageDetailInput.addEventListener("blur", () => {
          const isIOS = checkIsIOS();
          if (isIOS && checkIsMobile()) {
            // Small delay to ensure keyboard is fully closed
            setTimeout(() => {
              const fugahFooter = shadow.querySelector("#fugah-footer");
              // Show footer again when keyboard closes
              if (fugahFooter) {
                fugahFooter.style.setProperty("display", "flex", "important");
                fugahFooter.style.removeProperty("display"); // Remove inline style to use CSS default
              }
              
              // Trigger viewport update to restore full height
              if (mobileHeightUpdateHandler) {
                mobileHeightUpdateHandler();
              }
            }, 300);
          }
        });

        // Initialize textarea size
        if (messageDetailInput) {
          autoResizeTextarea();
        }
      }


      // ========================================
      // END MESSAGE DETAIL EVENT LISTENERS FUNCTIONALITY
      // ========================================


      // ========================================
      // SEND BUTTON STATE MANAGEMENT FUNCTIONALITY
      // ========================================
      // Toggle message detail send button active/inactive state based on input content or file selection
      function toggleMessageDetailSendButtonState() {
        if (!messageDetailInput || !messageDetailSendBtn) return;
        
        const hasText = messageDetailInput.value.trim().length > 0;
        const hasFile = messageDetailFileInput && messageDetailFileInput.files && messageDetailFileInput.files.length > 0;
        
        if (hasText || hasFile) {
          messageDetailSendBtn.classList.remove("inactive");
        } else {
          messageDetailSendBtn.classList.add("inactive");
        }
      }

      // Initialize message detail send button as inactive
      if (messageDetailSendBtn) {
        messageDetailSendBtn.classList.add("inactive");
      }


      // ========================================
      // END SEND BUTTON STATE MANAGEMENT FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE LIST NAVIGATION FUNCTIONALITY
      // ========================================
      // Check if there are messages and show/hide empty state
      function checkAndUpdateEmptyState() {
        if (!messageContainer || !noMessagesEmptyState) return;
        
        // Get all message items (excluding the empty state)
        const messageItems = messageContainer.querySelectorAll(".message-item");
        const hasMessages = messageItems.length > 0;
        
        // Show empty state if no messages, hide if there are messages
        if (hasMessages) {
          noMessagesEmptyState.style.display = "none";
        } else {
          noMessagesEmptyState.style.display = "flex";
        }
      }
      
      // Handle navigation back to message list from detail view
      function goBackToMessageList() {
        if (mainMessageContainer) mainMessageContainer.style.display = "block";
        if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
        if (mainRatingContainer) mainRatingContainer.style.display = "none";
        // Remove detail-active class from footer (tabs should be visible in message list)
        if (fugahFooter) fugahFooter.classList.remove("detail-active");
        
        // Reset emoji selection when leaving rating screen
        resetRatingEmojis();
        
        // Stop timestamp updates when leaving message detail view
        stopTimestampUpdates();
        
        // Clear input when going back
        if (messageDetailInput) {
          messageDetailInput.value = "";
          toggleMessageDetailSendButtonState();
        }
        
        // Check and update empty state when returning to message list
        checkAndUpdateEmptyState();
      }

      // Helper function to show rating screen (used by message detail close button and submit ticket)
      function showRatingScreen() {
        // Copy messages from message detail to rating screen
        const ratingMessages = shadow.querySelector("#rating-messages");
        if (messageDetailMessages && ratingMessages) {
          // Clone all messages from message detail
          ratingMessages.innerHTML = messageDetailMessages.innerHTML;
          
          // Always append mobile rating container after copying messages
          // (since innerHTML overwrites everything, we need to add it back)
          const mobileRatingContainer = document.createElement("div");
          mobileRatingContainer.className = "chat-message chat-message-rating";
          
          // Get asset paths
          const emoji1Path = getAssetPath('emoji-1.png');
          const emoji2Path = getAssetPath('emoji-2.png');
          const emoji3Path = getAssetPath('emoji-3.png');
          const emoji4Path = getAssetPath('emoji-4.png');
          const emoji5Path = getAssetPath('emoji-5.png');
          
          mobileRatingContainer.innerHTML = `
            <div class="chat-message-content rating-message-content">
              <div class="rating-title">
                <p>قيم محادثتك</p>
              </div>
              <div class="rating-emoji-container">
                <img src="${emoji1Path}" alt="Rating 1" class="rating-emoji" data-rating="1" />
                <img src="${emoji2Path}" alt="Rating 2" class="rating-emoji" data-rating="2" />
                <img src="${emoji3Path}" alt="Rating 3" class="rating-emoji" data-rating="3" />
                <img src="${emoji4Path}" alt="Rating 4" class="rating-emoji" data-rating="4" />
                <img src="${emoji5Path}" alt="Rating 5" class="rating-emoji" data-rating="5" />
              </div>
            </div>
          `;
          ratingMessages.appendChild(mobileRatingContainer);
          
          // Scroll to bottom of rating messages
          setTimeout(() => {
            ratingMessages.scrollTop = ratingMessages.scrollHeight;
          }, 100);
        }
        
        // Hide message detail container
        if (mainMessageDetailContainer) {
          mainMessageDetailContainer.style.display = "none";
        }
        
        // Show rating container
        if (mainRatingContainer) {
          mainRatingContainer.style.display = "flex";
        }
        
        // Add detail-active class on footer (tabs should be hidden in rating view)
        if (fugahFooter) {
          fugahFooter.classList.add("detail-active");
        }
        
        // Setup emoji hover and click functionality
        setupRatingEmojis();
      }

      // Add click handler to message detail back button (X button)
      // Flow: Chat page → Confirm → Rating screen
      if (messageDetailBackBtn) {
        messageDetailBackBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          
          // Show custom confirmation message
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", () => {
            // Show rating screen after confirmation
            showRatingScreen();
          });
        });
        
        // Add touch event listener for mobile devices (preventDefault stops synthetic click closing modal on Android)
        messageDetailBackBtn.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          e.preventDefault();
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", () => {
            showRatingScreen();
          });
        }, { passive: false });
      }

      // Add click handler to message detail back tick button
      // Flow: Chat page → Messages list (no confirmation)
      if (messageDetailBackTickBtn) {
        messageDetailBackTickBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          
          // Navigate directly to messages list without confirmation
          goBackToMessageList();
        });
        
        // Add touch event listener for mobile devices (preventDefault stops synthetic click closing modal on Android)
        messageDetailBackTickBtn.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          e.preventDefault();
          // Navigate directly to messages list without confirmation
          goBackToMessageList();
        }, { passive: false });
      }

      // Add click handler to rating screen back button (X button)
      // Flow: X again → Close page (no confirmation)
      if (ratingBackBtn) {
        ratingBackBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          
          // Reset to home screen before closing
          if (mainHomeContainer) mainHomeContainer.style.display = "flex";
          if (mainMessageContainer) mainMessageContainer.style.display = "none";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer) mainRatingContainer.style.display = "none";
          if (fugahFooter) fugahFooter.classList.remove("detail-active");
          
          // Reset footer tabs to home
          switchTab("home");
          
          // Close chat
          toggleChat();
        });
        
        // Add touch event listener for mobile devices (preventDefault avoids double-fire / phantom close on Android)
        ratingBackBtn.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          e.preventDefault();
          // Reset to home screen before closing
          if (mainHomeContainer) mainHomeContainer.style.display = "flex";
          if (mainMessageContainer) mainMessageContainer.style.display = "none";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer) mainRatingContainer.style.display = "none";
          if (fugahFooter) fugahFooter.classList.remove("detail-active");
          
          // Reset footer tabs to home
          switchTab("home");
          
          // Close chat
          toggleChat();
        }, { passive: false });
      }

      // Function to reset emoji selection
      function resetRatingEmojis() {
        const ratingEmojis = shadow.querySelectorAll(".rating-emoji");
        ratingEmojis.forEach((emoji) => {
          emoji.classList.remove("selected");
          if (emoji.dataset.originalSrc) {
            emoji.src = emoji.dataset.originalSrc;
          }
        });
      }

      // Function to setup emoji hover and click functionality
      function setupRatingEmojis() {
        // Reset any previous selection first
        resetRatingEmojis();
        
        const ratingEmojis = shadow.querySelectorAll(".rating-emoji");
        let selectedRating = null;
        
        // Helper function to check if any emoji is currently selected
        function hasSelectedEmoji() {
          return Array.from(ratingEmojis).some(e => e.classList.contains("selected"));
        }
        
        // Helper function to get the currently selected emoji
        function getSelectedEmoji() {
          return Array.from(ratingEmojis).find(e => e.classList.contains("selected"));
        }
        
        ratingEmojis.forEach((emoji) => {
          const rating = emoji.getAttribute("data-rating");
          
          // Get current src and create active src path
          const currentSrc = emoji.src;
          // Extract the path and replace emoji-X with active-emoji-X
          const originalSrc = currentSrc.includes("emoji-") ? currentSrc : getAssetPath(`emoji-${rating}.png`);
          const activeSrc = originalSrc.replace(/emoji-(\d+)\.png/, "active-emoji-$1.png");
          
          // Store original and active sources
          emoji.dataset.originalSrc = originalSrc;
          emoji.dataset.activeSrc = activeSrc;
          
          // Ensure initial src is set correctly
          if (!emoji.src.includes("emoji-")) {
            emoji.src = originalSrc;
          }
          
          // Hover event - always show active emoji on hover
          emoji.addEventListener("mouseenter", () => {
            // Always show active version on hover, regardless of selection
            emoji.src = activeSrc;
          });
          
          // Mouse leave event - revert to original if not selected, keep active if selected
          emoji.addEventListener("mouseleave", () => {
            // If this emoji is selected, keep it active
            if (emoji.classList.contains("selected")) {
              emoji.src = activeSrc;
            } else {
              // If not selected, revert to original
              emoji.src = originalSrc;
            }
          });
          
          // Click event - select emoji and keep it active (only one at a time)
          emoji.addEventListener("click", () => {
            // Remove selected class from all emojis and revert to original
            ratingEmojis.forEach((e) => {
              e.classList.remove("selected");
              e.src = e.dataset.originalSrc;
            });
            
            // Add selected class to clicked emoji and set to active
            emoji.classList.add("selected");
            emoji.src = activeSrc;
            selectedRating = rating;
          });
        });
      }


      // ========================================
      // END MESSAGE LIST NAVIGATION FUNCTIONALITY
      // ========================================


      // ========================================
      // DROPDOWN MENU FUNCTIONALITY
      // ========================================
      // Guard so "close when clicking outside" doesn't run in same tap on mobile
      let lastDropdownOpenAt = 0;
      const DROPDOWN_OPEN_GUARD_MS = 400;

      function toggleMessageDetailDropdown() {
        if (!fugahMessageDetailDropdown) return;
        const isVisible = fugahMessageDetailDropdown.style.display === "block";
        fugahMessageDetailDropdown.style.display = isVisible ? "none" : "block";
        if (!isVisible) lastDropdownOpenAt = Date.now();
      }
      function toggleRatingDropdown() {
        if (!fugahRatingDropdown) return;
        const isVisible = fugahRatingDropdown.style.display === "block";
        fugahRatingDropdown.style.display = isVisible ? "none" : "block";
        if (!isVisible) lastDropdownOpenAt = Date.now();
      }

      // Handle message detail dropdown menu toggle (click + touch for mobile)
      if (fugahMessageDetailDropdownIcon) {
        fugahMessageDetailDropdownIcon.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleMessageDetailDropdown();
        });
        fugahMessageDetailDropdownIcon.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          e.preventDefault(); // prevent synthetic click that can trigger outside-close on same tap
          toggleMessageDetailDropdown();
        }, { passive: false });
      }

      // Handle rating dropdown menu toggle (click + touch for mobile)
      if (fugahRatingDropdownIcon) {
        fugahRatingDropdownIcon.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleRatingDropdown();
        });
        fugahRatingDropdownIcon.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          e.preventDefault(); // prevent synthetic click that can trigger outside-close on same tap
          toggleRatingDropdown();
        }, { passive: false });
      }

      // Close dropdown when clicking outside (ignore within guard window to fix mobile “open then disappear”)
      shadow.addEventListener("click", (e) => {
        if (Date.now() - lastDropdownOpenAt < DROPDOWN_OPEN_GUARD_MS) return;

        if (fugahMessageDetailDropdown && fugahMessageDetailDropdownIcon) {
          if (!fugahMessageDetailDropdown.contains(e.target) && !fugahMessageDetailDropdownIcon.contains(e.target)) {
            fugahMessageDetailDropdown.style.display = "none";
          }
        }
        if (fugahRatingDropdown && fugahRatingDropdownIcon) {
          if (!fugahRatingDropdown.contains(e.target) && !fugahRatingDropdownIcon.contains(e.target)) {
            fugahRatingDropdown.style.display = "none";
          }
        }
      });


      // ========================================
      // END DROPDOWN MENU FUNCTIONALITY
      // ========================================


      // ========================================
      // DROPDOWN MENU ACTIONS FUNCTIONALITY
      // ========================================
      // Guard so overlay doesn’t close confirmation from same tap on Android
      let lastConfirmationOpenAt = 0;
      const CONFIRMATION_OPEN_GUARD_MS = 450;

      // Custom confirmation dialog function
      let currentConfirmCallback = null;
      function showCustomConfirmation(message, onConfirm) {
        if (customConfirmationDialog && confirmationDialogMessage && confirmationBtnCancel && confirmationBtnConfirm) {
          confirmationDialogMessage.textContent = message;
          customConfirmationDialog.style.display = "flex";
          currentConfirmCallback = onConfirm;
          lastConfirmationOpenAt = Date.now();
        } else {
          // Fallback to browser confirm
          if (confirm(message)) {
            if (onConfirm) onConfirm();
          }
        }
      }

      function closeConfirmationIfAllowed() {
        if (Date.now() - lastConfirmationOpenAt < CONFIRMATION_OPEN_GUARD_MS) return;
        if (customConfirmationDialog) {
          customConfirmationDialog.style.display = "none";
        }
        currentConfirmCallback = null;
      }
      
      // Handle confirmation dialog buttons
      if (confirmationBtnCancel) {
        confirmationBtnCancel.addEventListener("click", () => {
          if (customConfirmationDialog) {
            customConfirmationDialog.style.display = "none";
          }
          currentConfirmCallback = null;
        });
      }
      
      if (confirmationBtnConfirm) {
        confirmationBtnConfirm.addEventListener("click", () => {
          if (customConfirmationDialog) {
            customConfirmationDialog.style.display = "none";
          }
          if (currentConfirmCallback) {
            currentConfirmCallback();
            currentConfirmCallback = null;
          }
        });
      }
      
      // Close on overlay click/tap (guard so Android same-tap doesn’t close)
      if (customConfirmationDialog) {
        const overlay = customConfirmationDialog.querySelector(".confirmation-dialog-overlay");
        if (overlay) {
          overlay.addEventListener("click", () => { closeConfirmationIfAllowed(); });
          overlay.addEventListener("touchstart", (e) => {
            e.preventDefault();
            closeConfirmationIfAllowed();
          }, { passive: false });
        }
      }

      // Handle dropdown menu item actions (close chat, create ticket)
      // Flow: Three dots → Close chat → Confirm → Rating screen (same as X button)
      if (closeChatDetailMenuItem) {
        closeChatDetailMenuItem.addEventListener("click", (e) => {
          e.stopPropagation();
          fugahMessageDetailDropdown.style.display = "none";
          
          // Show custom confirmation message before closing
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", () => {
            // Show rating screen after confirmation (same as X button)
            showRatingScreen();
          });
        });
        
        // Add touch event listener for mobile devices
        closeChatDetailMenuItem.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          fugahMessageDetailDropdown.style.display = "none";
          
          // Show custom confirmation message before closing
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", () => {
            // Show rating screen after confirmation (same as X button)
            showRatingScreen();
          });
        });
      }

      if (createTicketDetailMenuItem) {
        createTicketDetailMenuItem.addEventListener("click", (e) => {
          e.stopPropagation();
          fugahMessageDetailDropdown.style.display = "none";
          
          // Show custom confirmation message before creating ticket
          showCustomConfirmation("هل أنت متأكد من رفع تذكرة؟", () => {
            // Show rating screen after confirmation
            showRatingScreen();
          });
        });
        
        // Add touch event listener for mobile devices
        createTicketDetailMenuItem.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          fugahMessageDetailDropdown.style.display = "none";
          
          // Show custom confirmation message before creating ticket
          showCustomConfirmation("هل أنت متأكد من رفع تذكرة؟", () => {
            // Show rating screen after confirmation
            showRatingScreen();
          });
        });
      }

      // Close chat from rating menu item
      if (closeRatingMenuItem) {
        closeRatingMenuItem.addEventListener("click", (e) => {
          e.stopPropagation();
          fugahRatingDropdown.style.display = "none";
          
          // Show custom confirmation message before closing
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", () => {
            // Reset to home screen before closing
            if (mainHomeContainer) mainHomeContainer.style.display = "flex";
            if (mainMessageContainer) mainMessageContainer.style.display = "none";
            if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
            if (mainRatingContainer) mainRatingContainer.style.display = "none";
            if (fugahFooter) fugahFooter.classList.remove("detail-active");
            
            // Reset footer tabs to home
            switchTab("home");
            
            // Close chat
            toggleChat();
          });
        });
      }


      // ========================================
      // END DROPDOWN MENU ACTIONS FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE ITEM CLICK HANDLERS FUNCTIONALITY
      // ========================================
      // Add click handlers to message items for opening detail view
      messageItems.forEach(item => {
        item.addEventListener("click", () => {
          const messageId = item.getAttribute("data-message-id");
          if (messageId) {
            openMessageDetail(messageId);
          }
        });
        // Make message items look clickable
        item.style.cursor = "pointer";
      });


      // ========================================
      // END MESSAGE ITEM CLICK HANDLERS FUNCTIONALITY
      // ========================================


      // ========================================
      // FOOTER TAB CLICK HANDLERS FUNCTIONALITY
      // ========================================
      // Add click handlers to footer tabs for tab switching
      footerTabItems.forEach(item => {
        item.addEventListener("click", () => {
          const tabType = item.getAttribute("data-tab");
          switchTab(tabType);
        });
      });


      // ========================================
      // END FOOTER TAB CLICK HANDLERS FUNCTIONALITY
      // ========================================


      // ========================================
      // INITIAL DISPLAY STATE FUNCTIONALITY
      // ========================================
      // Initialize display states and set home tab as active by default
      if (mainHomeContainer) {
        mainHomeContainer.style.display = "flex";
      }
      if (mainMessageContainer) {
        mainMessageContainer.style.display = "none";
      }
      if (mainMessageDetailContainer) {
        mainMessageDetailContainer.style.display = "none";
      }
      
      // Initialize tab state (Home active by default)
      switchTab("home");
      
      // Check and update empty state on initial load
      checkAndUpdateEmptyState();


      // ========================================
      // END INITIAL DISPLAY STATE FUNCTIONALITY
      // ========================================


      // ========================================
      // THEME SWITCHING FUNCTIONALITY
      // ========================================
      // Main theme switching function that updates all UI elements based on selected theme
      function changeTheme(themeName) {
        const chatWindow = shadow.querySelector("#chat-window");
        const chatIcon = shadow.querySelector("#chat-icon");
        const sendButton = shadow.querySelector("#message-detail-send-btn img");
        const mainSendButton = shadow.querySelector(".fugah-send-button img");
        const footerTabItems = shadow.querySelectorAll(".fugah-footer-tab-item");
        const backArrow = shadow.querySelector("#message-detail-back-btn");
        const messageListArrows = shadow.querySelectorAll(".message-item img");
        const messageCloseBtn = shadow.querySelector("#message-close-btn");
        const footerLogo = shadow.querySelector("#footer-logo");
        const fileUploadIcon = shadow.querySelector("#file-upload-icon");
        const dropdownIcon = shadow.querySelector("#fugah-message-detail-dropdown-icon");
        
        // Change main page background image based on theme
        const fugahBody = document.querySelector('.fugah-body');
        if (fugahBody) {
          let backgroundImagePath;
          switch(themeName) {
            case 'green':
              backgroundImagePath = "url('" + getAssetPath("main-bg.png") + "')";
              break;
            case 'red':
              backgroundImagePath = "url('" + getAssetPath("main-red-bg.png") + "')";
              break;
            case 'blue':
              backgroundImagePath = "url('" + getAssetPath("main-blue-bg.png") + "')";
              break;
            case 'yellow':
              backgroundImagePath = "url('" + getAssetPath("main-yellow-bg.png") + "')";
              break;
            case 'cyan':
              backgroundImagePath = "url('" + getAssetPath("main-cyan-bg.png") + "')";
              break;
            case 'black':
              backgroundImagePath = "url('" + getAssetPath("main-black-bg.png") + "')";
              break;
            case 'white':
              backgroundImagePath = "url('" + getAssetPath("main-white-bg.png") + "')";
              break;
            default:
              backgroundImagePath = "url('" + getAssetPath("main-bg.png") + "')";
              break;
          }
          // Only set background image if chat is not open OR if not mobile (on tablet/desktop, keep background even when chat is open)
          const isMobile = window.innerWidth <= 767;
          if (!isOpen || !isMobile) {
            fugahBody.style.backgroundImage = backgroundImagePath;
          }
        }
        
        if (chatWindow) {
          // Remove all existing theme classes
          chatWindow.classList.remove('theme-green', 'theme-red', 'theme-blue', 'theme-yellow', 'theme-cyan', 'theme-black', 'theme-white');
          
          // Add the new theme class
          chatWindow.classList.add(`theme-${themeName}`);
          
          // Change chat bubble icon based on theme and current state (open/closed)
          if (chatIcon) {
            let iconPath;
            
            // COMMENTED OUT: X icon logic when chat is open - bubble will be hidden instead
            // Uncomment below if you need to show X icon when chat is open in the future
            if (isOpen) {
              // Use theme-specific X icon - COMMENTED OUT
              /*
              switch(themeName) {
                case 'green':
                  iconPath = getAssetPath("X-green.png");
                  break;
                case 'red':
                  iconPath = getAssetPath("X-red.png");
                  break;
                case 'blue':
                  iconPath = getAssetPath("x-blue.png");
                  break;
                case 'yellow':
                  iconPath = getAssetPath("X-yellow.png");
                  break;
                case 'cyan':
                  iconPath = getAssetPath("X-cyan.png");
                  break;
                case 'white':
                  iconPath = getAssetPath("X.png");
                  break;
                case 'black':
                default:
                  iconPath = getAssetPath("X.png");
                  break;
              }
              chatIcon.src = iconPath;
              */
              // Don't change icon when chat is open - bubble will be hidden
              // Skip icon change, continue with rest of theme changes
            } else {
              // Use theme-specific message icon
              switch(themeName) {
                case 'green':
                  iconPath = getAssetPath("message-green.png");
                  break;
                case 'red':
                  iconPath = getAssetPath("message-red.png");
                  break;
                case 'blue':
                  iconPath = getAssetPath("message-blue.png");
                  break;
                case 'yellow':
                  iconPath = getAssetPath("message-yellow.png");
                  break;
                case 'cyan':
                  iconPath = getAssetPath("message-cyan.png");
                  break;
                case 'white':
                  iconPath = getAssetPath("message-white.png");
                  break;
                case 'black':
                default:
                  iconPath = getAssetPath("message.png"); // Keep default for black theme
                  break;
              }
            }
            // Only set icon if chat is closed (when chat is open, bubble is hidden)
            if (!isOpen && iconPath) {
              chatIcon.src = iconPath;
            }
          }
          
          // Change message detail send button icon based on theme
          if (sendButton) {
            let sendButtonPath;
            switch(themeName) {
              case 'green':
                sendButtonPath = getAssetPath("fugah-send-button-green.png");
                break;
              case 'red':
                sendButtonPath = getAssetPath("fugah-send-button-red.png");
                break;
              case 'blue':
                sendButtonPath = getAssetPath("fugah-send-button-cyan.png");
                break;
              case 'yellow':
                sendButtonPath = getAssetPath("fugah-send-button-yellow.png");
                break;
              case 'cyan':
                sendButtonPath = getAssetPath("fugah-send-button-blue.png");
                break;
              case 'white':
                sendButtonPath = getAssetPath("fugah-send-button-white.png");
                break;
              case 'black':
              default:
                sendButtonPath = getAssetPath("black-arrow.png"); // Black arrow for black theme
                break;
            }
            sendButton.src = sendButtonPath;
          }
          
          // Change main send button icon based on theme
          if (mainSendButton) {
            let mainSendIconPath;
            switch(themeName) {
              case 'green':
                mainSendIconPath = getAssetPath("send-icon.png");
                break;
              case 'red':
                mainSendIconPath = getAssetPath("send-icon.png");
                break;
              case 'blue':
                mainSendIconPath = getAssetPath("send-icon.png");
                break;
              case 'yellow':
                mainSendIconPath = getAssetPath("send-icon.png");
                break;
              case 'cyan':
                mainSendIconPath = getAssetPath("send-icon.png");
                break;
              case 'white':
                mainSendIconPath = getAssetPath("send-icon.png");
                break;
              case 'black':
              default:
                mainSendIconPath = getAssetPath("send-icon.png"); // Default for black theme
                break;
            }
            mainSendButton.src = mainSendIconPath;
          }
          
          // Change footer tab images based on theme and active state
          if (footerTabItems && footerTabItems.length > 0) {
            footerTabItems.forEach(item => {
              const tabType = item.getAttribute("data-tab");
              const img = item.querySelector("img");
              const isActive = item.classList.contains("active");
              
              if (img && tabType) {
                let imagePath;
                
                if (themeName === 'black') {
                  // Use black theme specific images
                  if (tabType === "message") {
                    imagePath = isActive ? 
                      getAssetPath("active-message-footer-black.png") : 
                      getAssetPath("inactive-message-footer-black.png.png");
                  } else if (tabType === "home") {
                    imagePath = isActive ? 
                      getAssetPath("active-home-footer-black.png") : 
                      getAssetPath("inactive-home-footer.png.png");
                  }
                } else {
                  // Use default images for all other themes
                  if (tabType === "message") {
                    imagePath = isActive ? 
                      getAssetPath("active-message-footer.png") : 
                      getAssetPath("inactive-message-footer.png");
                  } else if (tabType === "home") {
                    imagePath = isActive ? 
                      getAssetPath("active-home-footer.png") : 
                      getAssetPath("inactive-home-footer-black.png.png");
                  }
                }
                
                if (imagePath) {
                  img.src = imagePath;
                }
              }
            });
          }
          
          // Set message detail back button based on theme
          if (backArrow) {
            if (themeName === 'black') {
              backArrow.src = getAssetPath("exit-button-for-black.png");
              console.log("Set message detail back button to exit-button-for-black.png for black theme");
            } else {
              backArrow.src = getAssetPath("white-exit-button.png");
              console.log("Set message detail back button to white-exit-button.png for theme:", themeName);
            }
          }
          
          // Set message detail back tick button (always uses back-tick-black.png regardless of theme)
          const backTickArrow = shadow.querySelector("#message-detail-back-tick-btn");
          if (backTickArrow) {
            backTickArrow.src = getAssetPath("back-tick-black.png");
            console.log("Set message detail back tick button to back-tick-black.png");
          }
          
          // Set rating screen back button based on theme (same as chat screen – white-exit / exit-for-black)
          const ratingBackButton = shadow.querySelector("#rating-back-btn");
          if (ratingBackButton) {
            if (themeName === 'black') {
              ratingBackButton.src = getAssetPath("exit-button-for-black.png");
              console.log("Set rating back button to exit-button-for-black.png for black theme");
            } else {
              ratingBackButton.src = getAssetPath("white-exit-button.png");
              console.log("Set rating back button to white-exit-button.png for theme:", themeName);
            }
          }
          
          // Set message list arrows for ALL users based on theme
          const messageListArrows = shadow.querySelectorAll(".message-item img");
          console.log(`Found ${messageListArrows.length} message list arrows for theme: ${themeName}`);
          messageListArrows.forEach((arrow, index) => {
            if (themeName === 'black') {
              arrow.src = getAssetPath("arrow-for-black1.png");
              console.log(`Set message list arrow ${index + 1} to arrow-for-black1.png for black theme`);
            } else {
              arrow.src = getAssetPath("right-arrow.png");
              console.log(`Set message list arrow ${index + 1} to right-arrow.png for theme: ${themeName}`);
            }
          });
          
          // Set message close button icon based on theme
          if (messageCloseBtn) {
            if (themeName === 'black') {
              messageCloseBtn.src = getAssetPath("exit-button-for-black.png");
              console.log("Set message close button to exit-button-for-black.png for black theme");
            } else {
              messageCloseBtn.src = getAssetPath("X.png");
              console.log("Set message close button to X.png for theme:", themeName);
            }
          }
          
          // Set footer logo based on theme
          if (footerLogo) {
            if (themeName === 'black') {
              footerLogo.src = getAssetPath("black-logo.png");
              console.log("Set footer logo to black-logo.png for black theme");
            } else {
              footerLogo.src = getAssetPath("fugah-footer-end.png");
              console.log("Set footer logo to fugah-footer-end.png for theme:", themeName);
            }
          }
          
          // Set file upload icon based on theme
          if (fileUploadIcon) {
            if (themeName === 'black') {
              fileUploadIcon.src = getAssetPath("black-new.png");
              console.log("Set file upload icon to black-new.png for black theme");
            } else {
              fileUploadIcon.src = getAssetPath("fugah-file-icon.png");
              console.log("Set file upload icon to fugah-file-icon.png for theme:", themeName);
            }
          }
          
          // Set dropdown icon based on theme
          if (dropdownIcon) {
            if (themeName === 'black') {
              dropdownIcon.src = getAssetPath("white-dropdown.png");
              console.log("Set dropdown icon to white-dropdown.png for black theme");
            } else {
              dropdownIcon.src = getAssetPath("fugah-menue-dropdown.png");
              console.log("Set dropdown icon to fugah-menue-dropdown.png for theme:", themeName);
            }
          }
          
          // Set rating dropdown icon based on theme
          const ratingDropdownIcon = shadow.querySelector("#fugah-rating-dropdown-icon");
          if (ratingDropdownIcon) {
            if (themeName === 'black') {
              ratingDropdownIcon.src = getAssetPath("white-dropdown.png");
              console.log("Set rating dropdown icon to white-dropdown.png for black theme");
            } else {
              ratingDropdownIcon.src = getAssetPath("fugah-menue-dropdown.png");
              console.log("Set rating dropdown icon to fugah-menue-dropdown.png for theme:", themeName);
            }
          }
          
          // Initialize footer tab images based on current active state
          if (footerTabItems && footerTabItems.length > 0) {
            footerTabItems.forEach(item => {
              const tabType = item.getAttribute("data-tab");
              const img = item.querySelector("img");
              const isActive = item.classList.contains("active");

              if (img && tabType) {
                let imagePath;
                if (themeName === 'black') {
                  if (tabType === "message") {
                    imagePath = isActive ? getAssetPath("active-message-footer-black.png") : getAssetPath("inactive-message-footer-black.png.png");
                  } else if (tabType === "home") {
                    imagePath = isActive ? getAssetPath("active-home-footer-black.png") : getAssetPath("new-img.png");
                  }
                } else {
                  if (tabType === "message") {
                    imagePath = isActive ? getAssetPath("active-message-footer.png") : getAssetPath("inactive-message-footer.png");
                  } else if (tabType === "home") {
                    imagePath = isActive ? getAssetPath("active-home-footer.png") : getAssetPath("inactive-home-footer.png.png");
                  }
                }
                if (imagePath) {
                  img.src = imagePath;
                  console.log(`Initialized ${tabType} tab image (${isActive ? 'active' : 'inactive'}) for theme ${themeName}:`, imagePath);
                }
              }
            });
          }
          
          console.log("Theme changed to:", themeName);
          console.log("Chat window classes:", chatWindow.className);
          console.log("Chat icon changed to:", chatIcon ? chatIcon.src : "not found");
          console.log("Send button changed to:", sendButton ? sendButton.src : "not found");
          console.log("Main send button changed to:", mainSendButton ? mainSendButton.src : "not found");
          console.log("Footer tab images updated for theme:", themeName);
        } else {
          console.error("Chat window not found in shadow DOM");
        }
      }


      // ========================================
      // END THEME SWITCHING FUNCTIONALITY
      // ========================================


      // ========================================
      // GLOBAL THEME FUNCTION EXPOSURE FUNCTIONALITY
      // ========================================
      // Expose theme changing function globally for external access
      window.changeChatbotTheme = changeTheme;


      // ========================================
      // END GLOBAL THEME FUNCTION EXPOSURE FUNCTIONALITY
      // ========================================


      // ========================================
      // INITIAL THEME SETUP FUNCTIONALITY
      // ========================================
      // Use our widget script tag (not querySelector) so we don't pick up another app's data-theme on Salla
      const initialTheme = scriptTag.getAttribute('data-theme');
      if (initialTheme) {
        setTimeout(() => {
          changeTheme(initialTheme);
        }, 100);
      }


      // ========================================
      // END INITIAL THEME SETUP FUNCTIONALITY
      // ========================================


      // ========================================
      // MESSAGE ADDING UTILITY FUNCTIONALITY
      // ========================================
      // Utility function to add messages to main message container (for future use)
      function addMessage(text, type) {
        if (!mainMessageContainer) return;
        
        const messageDiv = document.createElement("div");
        messageDiv.className = `message`;
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
          padding: 12px 16px;
          margin-bottom: 10px;
          border-radius: 18px;
          max-width: 80%;
          word-wrap: break-word;
        `;
        mainMessageContainer.appendChild(messageDiv);
        mainMessageContainer.scrollTop = mainMessageContainer.scrollHeight;
      }


      // ========================================
      // END MESSAGE ADDING UTILITY FUNCTIONALITY
      // ========================================

    })
    .catch(err => console.error("Failed to load ui.html:", err));

})();