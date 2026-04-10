// ========================================
// FUGAH CHATBOT WIDGET - MAIN JAVASCRIPT
// ========================================
// WHERE THIS FILE LIVES: Vercel repo root
// URL: https://fugah-chatbot-variantsssz.vercel.app/widget.js
//
// CHANGES FROM PREVIOUS VERSION:
//   ✅ get_config called on init — theme + position + status from backend
//   ✅ iconDesign mapped to theme names
//   ✅ position (bottom-right / bottom-left) applied dynamically
//   ✅ autoOpen supported
//   ✅ status:inactive hides widget
//   ✅ Dead n8n fetch REMOVED
//   ✅ body.overflow / body.classList scroll lock REMOVED (iframe handles isolation)
//   ✅ document.querySelector('.fugah-body') references REMOVED
//   ✅ window.fugahChatScrollPosition REMOVED
//   ✅ touchmove/touchstart prevention on document.body REMOVED
//   ✅ document.body.appendChild (close button) REMOVED
//   ✅ data-theme static reading REMOVED
//   ✅ postMessage to parent for pointer-events control ADDED
// ========================================

(function () {

  // ── CONSTANTS ──────────────────────────────────────────────────────────────
  var BACKEND_URL = "https://pmzhsxlsnxvpzkiflxww.supabase.co/functions/v1/chatbot-api";

  // Maps iconDesign values from get_config to internal theme class names
  var ICON_DESIGN_TO_THEME = {
    "default": "green",
    "black":   "black",
    "yellow":  "yellow",
    "red":     "red",
    "navy":    "blue",
    "blue":    "cyan",
    "green":   "green"
  };

  // ── iOS DETECTION ──────────────────────────────────────────────────────────
  function checkIsIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // ========================================
  // STORE ID CONFIGURATION
  // ========================================
  var scriptTag = document.currentScript;
  var storeId = scriptTag ? scriptTag.getAttribute("data-store-id") : null;

  // Fallback: read from URL param (when loaded inside widget-frame.html)
  if (!storeId) {
    var urlParams = new URLSearchParams(window.location.search);
    storeId = urlParams.get("storeId");
  }

  if (!storeId) {
    console.warn("[Fuqah] No storeId found. Widget will not load.");
    return;
  }

  console.log("[Fuqah] Widget loading for store:", storeId);

  // ========================================
  // SHADOW DOM SETUP
  // ========================================
  var wrapper = document.createElement("div");
  wrapper.id = "chatbot-widget-root";
  document.body.appendChild(wrapper);
  var shadow = wrapper.attachShadow({ mode: "open" });

  // ========================================
  // CSS LOADING
  // ========================================
  var style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "widget.css";
  shadow.appendChild(style);

  // ========================================
  // HTML LOADING
  // ========================================
  fetch("ui.html")
    .then(function (res) { return res.text(); })
    .then(function (html) {
      shadow.innerHTML += html;

      // ── DOM ELEMENT SELECTION ────────────────────────────────────────────
      var bubble                        = shadow.querySelector("#chat-bubble");
      var chatIcon                      = shadow.querySelector("#chat-icon");
      var chatWindow                    = shadow.querySelector("#chat-window");
      var sendMessageBtn                = shadow.querySelector(".fugah-send-button");
      var phoneInput                    = shadow.querySelector("#phone-input");
      var customPlaceholder             = shadow.querySelector("#custom-placeholder");
      var countryCodeBtn                = shadow.querySelector("#country-code-btn");
      var countryCodeDropdown           = shadow.querySelector("#country-code-dropdown");
      var countryList                   = shadow.querySelector("#country-list");
      var countryFlag                   = shadow.querySelector("#country-flag");
      var countryCodeText               = shadow.querySelector("#country-code-text");
      var numberFormat                  = shadow.querySelector("#number-format");
      var phoneValidationError          = shadow.querySelector("#phone-validation-error");
      var mainHomeContainer             = shadow.querySelector(".main-home-container");
      var mainMessageContainer          = shadow.querySelector(".main-message-container");
      var mainMessageDetailContainer    = shadow.querySelector(".main-message-detail-container");
      var mainRatingContainer           = shadow.querySelector(".main-rating-container");
      var ratingBackBtn                 = shadow.querySelector("#rating-back-btn");
      var messageCloseBtn               = shadow.querySelector("#message-close-btn");
      var messageDetailBackBtn          = shadow.querySelector("#message-detail-back-btn");
      var messageDetailBackTickBtn      = shadow.querySelector("#message-detail-back-tick-btn");
      var fugahMessageDetailDropdownIcon = shadow.querySelector("#fugah-message-detail-dropdown-icon");
      var fugahMessageDetailDropdown    = shadow.querySelector("#fugah-message-detail-dropdown");
      var closeChatDetailMenuItem       = shadow.querySelector("#close-chat-detail-menu-item");
      var createTicketDetailMenuItem    = shadow.querySelector("#create-ticket-detail-menu-item");
      var customConfirmationDialog      = shadow.querySelector("#custom-confirmation-dialog");
      var confirmationDialogMessage     = shadow.querySelector("#confirmation-dialog-message");
      var confirmationBtnCancel         = shadow.querySelector("#confirmation-btn-cancel");
      var confirmationBtnConfirm        = shadow.querySelector("#confirmation-btn-confirm");
      var fugahRatingDropdownIcon       = shadow.querySelector("#fugah-rating-dropdown-icon");
      var fugahRatingDropdown           = shadow.querySelector("#fugah-rating-dropdown");
      var closeRatingMenuItem           = shadow.querySelector("#close-rating-menu-item");
      var messageDetailInput            = shadow.querySelector("#message-detail-input");
      var messageDetailSendBtn          = shadow.querySelector("#message-detail-send-btn");
      var messageDetailMessages         = shadow.querySelector("#message-detail-messages");
      var messageItems                  = shadow.querySelectorAll(".message-item");
      var messageContainer              = shadow.querySelector(".message-container");
      var noMessagesEmptyState          = shadow.querySelector("#no-messages-empty-state");
      var footerTabItems                = shadow.querySelectorAll(".fugah-footer-tab-item");
      var fugahFooter                   = shadow.querySelector("#fugah-footer");

      // ── ASSET PATH HELPER ────────────────────────────────────────────────
      function getAssetPath(filename) {
        return "../assets/" + filename;
      }

      // ── INITIAL ICON SETUP ───────────────────────────────────────────────
      if (chatIcon) chatIcon.src = getAssetPath("message.png");

      var backArrow     = shadow.querySelector("#message-detail-back-btn");
      var backTickArrow = shadow.querySelector("#message-detail-back-tick-btn");
      var ratingBackArrow = shadow.querySelector("#rating-back-btn");
      if (backArrow)      backArrow.src      = getAssetPath("white-exit-button.png");
      if (backTickArrow)  backTickArrow.src  = getAssetPath("back-tick-black.png");
      if (ratingBackArrow) ratingBackArrow.src = getAssetPath("white-exit-button.png");


      // ======================================================================
      // ✅ NEW: postMessage helpers — tell loader iframe when to enable/disable
      //         pointer events on the host page
      // ======================================================================
      function notifyParentActive() {
        // Chat is open — iframe needs pointer events
        if (window.fuqahActivate) window.fuqahActivate();
        else if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "fuqah:active" }, "*");
        }
      }

      function notifyParentInactive() {
        // Chat is closed — pass all clicks through to store
        if (window.fuqahDeactivate) window.fuqahDeactivate();
        else if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "fuqah:inactive" }, "*");
        }
      }


      // ======================================================================
      // ✅ NEW: APPLY POSITION FROM get_config
      //   Applies bottom-right or bottom-left to bubble and chat window
      // ======================================================================
      function applyPosition(position) {
        if (!bubble || !chatWindow) return;
        if (position === "bottom-left") {
          bubble.style.setProperty("left",  "20px",   "important");
          bubble.style.setProperty("right", "unset",  "important");
          chatWindow.style.setProperty("left",  "20px",  "important");
          chatWindow.style.setProperty("right", "unset", "important");
        } else {
          // default: bottom-right
          bubble.style.setProperty("right", "20px",   "important");
          bubble.style.setProperty("left",  "unset",  "important");
          chatWindow.style.setProperty("right", "20px",  "important");
          chatWindow.style.setProperty("left",  "unset", "important");
        }
      }


      // ======================================================================
      // ✅ NEW: INIT — fetch get_config, apply theme + position + status
      // ======================================================================
      function initWidget() {
        return fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_config", storeId: storeId })
        })
          .then(function (res) { return res.json(); })
          .then(function (config) {
            console.log("[Fuqah] Config loaded:", config);

            // Hide widget entirely if not active
            if (config.status && config.status !== "active") {
              wrapper.style.display = "none";
              return;
            }

            // Apply theme from iconDesign
            var themeName = ICON_DESIGN_TO_THEME[config.iconDesign] || "green";
            changeTheme(themeName);

            // Apply position
            applyPosition(config.position || "bottom-right");

            // Auto-open if configured
            if (config.autoOpen) {
              toggleChat();
            }
          })
          .catch(function (err) {
            // Fail silently — widget loads with default green theme
            console.warn("[Fuqah] get_config failed, using defaults:", err);
            changeTheme("green");
            applyPosition("bottom-right");
          });
      }


      // ========================================
      // CHAT WINDOW TOGGLE
      // ========================================
      var isOpen = false;

      // Force close chat — ensures complete cleanup (iOS fix)
      var forceCloseChat = function () {
        chatWindow.classList.remove("opening", "open", "closing");
        chatWindow.style.display = "none";
        chatWindow.classList.remove("chat-window-open");

        chatWindow.style.removeProperty("background-image");
        chatWindow.style.removeProperty("background-size");
        chatWindow.style.removeProperty("background-position");
        chatWindow.style.removeProperty("background-repeat");

        bubble.classList.remove("chat-open");
        bubble.style.display = "flex";
        bubble.style.visibility = "visible";
        bubble.style.opacity = "1";
        bubble.style.pointerEvents = "auto";

        var currentTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
        var themeName = currentTheme ? currentTheme[1] : "green";
        var iconMap = {
          green:  "message-green.png",
          red:    "message-red.png",
          blue:   "message-blue.png",
          yellow: "message-yellow.png",
          cyan:   "message-cyan.png",
          white:  "message-white.png",
          black:  "message.png"
        };
        if (chatIcon) chatIcon.src = getAssetPath(iconMap[themeName] || "message.png");

        isOpen = false;

        // ✅ Tell parent iframe is idle — pass events through to store
        notifyParentInactive();

        stopTimestampUpdates();
      };

      var toggleChat = function () {
        isOpen = !isOpen;

        // ── ANIMATIONS ──────────────────────────────────────────────────────
        if (isOpen) {
          chatWindow.classList.remove("closing", "open");
          chatWindow.style.display = "flex";
          void chatWindow.offsetWidth;
          chatWindow.classList.add("opening");

          var openDone = false;
          chatWindow.addEventListener("animationend", function onOpen() {
            if (openDone) return;
            openDone = true;
            chatWindow.removeEventListener("animationend", onOpen);
            chatWindow.classList.remove("opening");
            chatWindow.classList.add("open");
          }, { once: true });
          setTimeout(function () {
            if (!openDone) {
              openDone = true;
              chatWindow.classList.remove("opening");
              chatWindow.classList.add("open");
            }
          }, 500);

        } else {
          chatWindow.classList.remove("opening", "open");
          chatWindow.classList.add("closing");

          var closeDone = false;
          chatWindow.addEventListener("animationend", function onClose() {
            if (closeDone) return;
            closeDone = true;
            chatWindow.removeEventListener("animationend", onClose);
            chatWindow.classList.remove("closing");
            chatWindow.style.display = "none";
          }, { once: true });
          setTimeout(function () {
            if (!closeDone) {
              closeDone = true;
              chatWindow.classList.remove("closing");
              chatWindow.style.display = "none";
            }
          }, 500);
        }

        // ── MOBILE FULLSCREEN (no body pollution) ────────────────────────────
        if (isOpen) {
          var isMobile = window.innerWidth <= 767;
          chatWindow.classList.add("chat-window-open");

          if (isMobile) {
            var dynamicHeight = window.visualViewport
              ? window.visualViewport.height
              : window.innerHeight;
            chatWindow.style.setProperty("position",     "fixed",         "important");
            chatWindow.style.setProperty("top",          "0",             "important");
            chatWindow.style.setProperty("left",         "0",             "important");
            chatWindow.style.setProperty("right",        "0",             "important");
            chatWindow.style.setProperty("bottom",       "0",             "important");
            chatWindow.style.setProperty("width",        "100vw",         "important");
            chatWindow.style.setProperty("height",       dynamicHeight + "px", "important");
            chatWindow.style.setProperty("max-width",    "none",          "important");
            chatWindow.style.setProperty("max-height",   "none",          "important");
            chatWindow.style.setProperty("border-radius","0",             "important");

            setupMobileHeightUpdates();
          }

          bubble.classList.add("chat-open");
          bubble.style.display = "none";

          // Reset to home on open
          if (mainHomeContainer)          mainHomeContainer.style.display          = "flex";
          if (mainMessageContainer)       mainMessageContainer.style.display       = "none";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer)        mainRatingContainer.style.display        = "none";
          if (fugahFooter)                fugahFooter.classList.remove("detail-active");
          switchTab("home");

          // ✅ Tell parent to enable pointer events on iframe
          notifyParentActive();

        } else {
          // Closing
          chatWindow.classList.remove("chat-window-open");
          var isMobileClose = window.innerWidth <= 767;
          if (isMobileClose) {
            removeMobileHeightUpdates();
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
          }

          var closeTheme = chatWindow.classList.toString().match(/theme-(\w+)/);
          var closeThemeName = closeTheme ? closeTheme[1] : "green";
          var closeIconMap = {
            green: "message-green.png", red: "message-red.png",
            blue: "message-blue.png", yellow: "message-yellow.png",
            cyan: "message-cyan.png", white: "message-white.png",
            black: "message.png"
          };
          if (chatIcon) chatIcon.src = getAssetPath(closeIconMap[closeThemeName] || "message.png");

          bubble.classList.remove("chat-open");
          bubble.style.display = "flex";

          // ✅ Tell parent iframe is idle
          notifyParentInactive();

          stopTimestampUpdates();
        }

        // Phone input cleanup on close
        if (!isOpen && phoneInput) {
          phoneInput.value = "";
          if (customPlaceholder) {
            customPlaceholder.classList.remove("invalid");
            customPlaceholder.style.display = "block";
          }
          if (phoneValidationError) phoneValidationError.style.display = "none";
          phoneInput.classList.remove("valid", "invalid");
        }
      };


      // ========================================
      // MOBILE KEYBOARD / HEIGHT HANDLING
      // (ISOLATED — no document.body changes)
      // ========================================
      var mobileHeightUpdateHandler = null;

      function setupMobileHeightUpdates() {
        if (mobileHeightUpdateHandler) {
          window.removeEventListener("resize", mobileHeightUpdateHandler);
          if (window.visualViewport) {
            window.visualViewport.removeEventListener("resize", mobileHeightUpdateHandler);
            window.visualViewport.removeEventListener("scroll", mobileHeightUpdateHandler);
          }
        }

        mobileHeightUpdateHandler = function () {
          if (!isOpen || window.innerWidth > 767) return;

          if (window.visualViewport) {
            var vvHeight    = window.visualViewport.height;
            var vvOffsetTop = window.visualViewport.offsetTop || 0;

            if (vvOffsetTop > 0) {
              // Keyboard is open
              var kbHeight = window.innerHeight;
              var isIOS    = checkIsIOS();

              chatWindow.style.setProperty("inset",  "unset",  "important");
              chatWindow.style.removeProperty("inset");
              chatWindow.style.removeProperty("bottom");
              chatWindow.style.setProperty("top",    "0",              "important");
              chatWindow.style.setProperty("left",   "0",              "important");
              chatWindow.style.setProperty("right",  "0",              "important");
              chatWindow.style.setProperty("height", kbHeight + "px",  "important");
              chatWindow.style.setProperty("width",  "100vw",          "important");

              // iOS: hide footer so input is visible above keyboard
              if (isIOS && fugahFooter) {
                fugahFooter.style.setProperty("display", "none", "important");
              }

            } else {
              // Keyboard closed — restore full viewport
              var fullHeight = window.visualViewport
                ? window.visualViewport.height
                : window.innerHeight;

              chatWindow.style.setProperty("inset",  "unset", "important");
              chatWindow.style.removeProperty("inset");
              chatWindow.style.setProperty("top",    "0",             "important");
              chatWindow.style.setProperty("left",   "0",             "important");
              chatWindow.style.setProperty("right",  "0",             "important");
              chatWindow.style.setProperty("bottom", "0",             "important");
              chatWindow.style.setProperty("width",  "100vw",         "important");
              chatWindow.style.setProperty("height", fullHeight + "px","important");

              // iOS: show footer again
              if (checkIsIOS() && fugahFooter) {
                fugahFooter.style.removeProperty("display");
              }
            }
          } else {
            // Fallback
            var fallbackH = window.innerHeight;
            chatWindow.style.setProperty("height", fallbackH + "px", "important");
          }
        };

        window.addEventListener("resize", mobileHeightUpdateHandler, { passive: true });
        window.addEventListener("orientationchange", mobileHeightUpdateHandler, { passive: true });
        if (window.visualViewport) {
          window.visualViewport.addEventListener("resize", mobileHeightUpdateHandler, { passive: true });
          window.visualViewport.addEventListener("scroll", mobileHeightUpdateHandler, { passive: true });
        }
      }

      function removeMobileHeightUpdates() {
        if (!mobileHeightUpdateHandler) return;
        window.removeEventListener("resize", mobileHeightUpdateHandler);
        window.removeEventListener("orientationchange", mobileHeightUpdateHandler);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", mobileHeightUpdateHandler);
          window.visualViewport.removeEventListener("scroll", mobileHeightUpdateHandler);
        }
        mobileHeightUpdateHandler = null;
      }


      // ========================================
      // BUBBLE — pointer events to notify parent
      // ========================================
      var bubbleTouchHandled = false;

      bubble.addEventListener("mouseenter", function () {
        // Hover on bubble — enable iframe events so click registers
        notifyParentActive();
      });
      bubble.addEventListener("mouseleave", function () {
        // Only deactivate if chat is closed
        if (!isOpen) notifyParentInactive();
      });

      bubble.addEventListener("touchend", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (bubbleTouchHandled) return;
        bubbleTouchHandled = true;
        toggleChat();
        setTimeout(function () { bubbleTouchHandled = false; }, 500);
      }, { passive: false });

      bubble.addEventListener("click", function (e) {
        if (bubbleTouchHandled) { bubbleTouchHandled = false; return; }
        toggleChat();
      });

      // ── Close buttons ────────────────────────────────────────────────────
      var closeButtons = shadow.querySelectorAll(".close-button");
      closeButtons.forEach(function (btn) {
        var touchHandled = false;
        btn.addEventListener("touchend", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (touchHandled) return;
          touchHandled = true;
          if (isOpen) forceCloseChat(); else toggleChat();
          setTimeout(function () { touchHandled = false; }, 500);
        }, { passive: false });
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          e.preventDefault();
          if (touchHandled) { touchHandled = false; return; }
          if (isOpen) forceCloseChat(); else toggleChat();
        });
      });

      if (messageCloseBtn) {
        messageCloseBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleChat();
        });
      }

      chatIcon.addEventListener("click", function (e) {
        if (isOpen) { e.stopPropagation(); toggleChat(); }
      });


      // ========================================
      // COUNTRY CODES + PHONE VALIDATION
      // ========================================
      var countryCodes = [
        { code: "966", flag: "🇸🇦", name: "Saudi Arabia",        iso: "SA", format: "5xxxxxxxx",      pattern: /^5\d{8}$/,      minLength: 9,  maxLength: 9  },
        { code: "1",   flag: "🇺🇸", name: "United States",       iso: "US", format: "(xxx) xxx-xxxx", pattern: /^\d{10}$/,      minLength: 10, maxLength: 10 },
        { code: "44",  flag: "🇬🇧", name: "United Kingdom",      iso: "GB", format: "xxxx xxxxxx",    pattern: /^\d{10,11}$/,   minLength: 10, maxLength: 11 },
        { code: "971", flag: "🇦🇪", name: "United Arab Emirates",iso: "AE", format: "5x xxx xxxx",    pattern: /^5\d{8}$/,      minLength: 9,  maxLength: 9  },
        { code: "965", flag: "🇰🇼", name: "Kuwait",              iso: "KW", format: "xxxx xxxx",      pattern: /^\d{8}$/,       minLength: 8,  maxLength: 8  },
        { code: "974", flag: "🇶🇦", name: "Qatar",               iso: "QA", format: "xxxx xxxx",      pattern: /^\d{8}$/,       minLength: 8,  maxLength: 8  },
        { code: "973", flag: "🇧🇭", name: "Bahrain",             iso: "BH", format: "xxxx xxxx",      pattern: /^\d{8}$/,       minLength: 8,  maxLength: 8  },
        { code: "968", flag: "🇴🇲", name: "Oman",                iso: "OM", format: "xxxx xxxx",      pattern: /^\d{8}$/,       minLength: 8,  maxLength: 8  },
        { code: "961", flag: "🇱🇧", name: "Lebanon",             iso: "LB", format: "xx xxx xxx",     pattern: /^\d{7,8}$/,     minLength: 7,  maxLength: 8  },
        { code: "962", flag: "🇯🇴", name: "Jordan",              iso: "JO", format: "x xxxx xxxx",    pattern: /^\d{9}$/,       minLength: 9,  maxLength: 9  },
        { code: "20",  flag: "🇪🇬", name: "Egypt",               iso: "EG", format: "xxx xxx xxxx",   pattern: /^\d{10}$/,      minLength: 10, maxLength: 10 },
        { code: "212", flag: "🇲🇦", name: "Morocco",             iso: "MA", format: "xxxx-xxxxxx",    pattern: /^\d{9}$/,       minLength: 9,  maxLength: 9  },
        { code: "33",  flag: "🇫🇷", name: "France",              iso: "FR", format: "x xx xx xx xx",  pattern: /^\d{9}$/,       minLength: 9,  maxLength: 9  },
        { code: "49",  flag: "🇩🇪", name: "Germany",             iso: "DE", format: "xxxx xxxxxxx",   pattern: /^\d{10,11}$/,   minLength: 10, maxLength: 11 },
        { code: "91",  flag: "🇮🇳", name: "India",               iso: "IN", format: "xxxxx xxxxx",    pattern: /^\d{10}$/,      minLength: 10, maxLength: 10 },
        { code: "86",  flag: "🇨🇳", name: "China",               iso: "CN", format: "xxx xxxx xxxx",  pattern: /^\d{11}$/,      minLength: 11, maxLength: 11 },
        { code: "81",  flag: "🇯🇵", name: "Japan",               iso: "JP", format: "xx-xxxx-xxxx",   pattern: /^\d{10,11}$/,   minLength: 10, maxLength: 11 },
        { code: "7",   flag: "🇷🇺", name: "Russia",              iso: "RU", format: "xxx xxx-xx-xx",  pattern: /^\d{10}$/,      minLength: 10, maxLength: 10 },
        { code: "55",  flag: "🇧🇷", name: "Brazil",              iso: "BR", format: "(xx) xxxxx-xxxx",pattern: /^\d{10,11}$/,   minLength: 10, maxLength: 11 },
        { code: "90",  flag: "🇹🇷", name: "Turkey",              iso: "TR", format: "xxx xxx xx xx",  pattern: /^\d{10}$/,      minLength: 10, maxLength: 10 }
      ];

      var selectedCountry = countryCodes.find(function (c) { return c.code === "966"; }) || countryCodes[0];

      function validatePhoneNumber() {
        if (!phoneInput || !phoneValidationError) return;
        var phoneNumber = phoneInput.value.trim().replace(/\D/g, "");
        if (!phoneNumber) {
          phoneInput.classList.remove("valid", "invalid");
          if (customPlaceholder) customPlaceholder.classList.remove("invalid");
          phoneValidationError.style.display = "none";
          return;
        }
        var sortedCodes = countryCodes.slice().sort(function (a, b) { return b.code.length - a.code.length; });
        var detectedCountry = null;
        for (var i = 0; i < sortedCodes.length; i++) {
          if (phoneNumber.startsWith(sortedCodes[i].code)) {
            detectedCountry = sortedCodes[i];
            break;
          }
        }
        if (!detectedCountry) detectedCountry = countryCodes.find(function (c) { return c.code === "966"; }) || countryCodes[0];
        var phoneWithoutCode = phoneNumber.startsWith(detectedCountry.code)
          ? phoneNumber.substring(detectedCountry.code.length)
          : phoneNumber;

        if (phoneWithoutCode.length < detectedCountry.minLength || phoneWithoutCode.length > detectedCountry.maxLength
            || (detectedCountry.pattern && !detectedCountry.pattern.test(phoneWithoutCode))) {
          phoneInput.classList.remove("valid");
          phoneInput.classList.add("invalid");
          if (customPlaceholder) customPlaceholder.classList.add("invalid");
          phoneValidationError.textContent = "الرجاء إدخال رقم صحيح";
          phoneValidationError.style.display = "block";
        } else {
          phoneInput.classList.remove("invalid");
          phoneInput.classList.add("valid");
          if (customPlaceholder) customPlaceholder.classList.remove("invalid");
          phoneValidationError.style.display = "none";
        }
      }

      function updatePlaceholderVisibility() {
        if (!customPlaceholder || !phoneInput) return;
        if (phoneInput.value.trim().length > 0) {
          customPlaceholder.style.display = "none";
        } else {
          customPlaceholder.style.display = "flex";
          customPlaceholder.classList.remove("invalid");
        }
      }

      if (phoneInput) {
        phoneInput.value = "";
        phoneInput.addEventListener("input", function (e) {
          phoneInput.value = e.target.value.replace(/\D/g, "");
          updatePlaceholderVisibility();
          validatePhoneNumber();
        });
        phoneInput.addEventListener("blur", function () {
          validatePhoneNumber();
          updatePlaceholderVisibility();
        });
        phoneInput.addEventListener("focus", function () {
          if (customPlaceholder) customPlaceholder.style.display = "none";
          if (checkIsIOS() && window.innerWidth <= 767 && fugahFooter) {
            fugahFooter.style.setProperty("display", "none", "important");
          }
        });
        phoneInput.addEventListener("blur", function () {
          validatePhoneNumber();
          updatePlaceholderVisibility();
          if (checkIsIOS() && window.innerWidth <= 767) {
            setTimeout(function () {
              if (fugahFooter) {
                fugahFooter.style.removeProperty("display");
              }
              if (mobileHeightUpdateHandler) mobileHeightUpdateHandler();
            }, 300);
          }
        });
        phoneInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && sendMessageBtn) {
            e.preventDefault();
            if (!phoneInput.classList.contains("invalid") && phoneInput.value.trim()) {
              sendMessageBtn.click();
            }
          }
        });
        phoneInput.addEventListener("touchstart", function () {
          if (customPlaceholder) customPlaceholder.style.display = "none";
          phoneInput.focus();
        });
      }


      // ========================================
      // MAIN SEND BUTTON
      // ========================================
      function handleSendPhone() {
        if (!phoneInput) {
          openChatDetail();
          return;
        }
        var phoneNumber = phoneInput.value.trim().replace(/\D/g, "");
        if (!phoneNumber) {
          phoneInput.classList.add("invalid");
          if (customPlaceholder) customPlaceholder.classList.add("invalid");
          if (phoneValidationError) {
            phoneValidationError.textContent = "الرجاء إدخال رقم الهاتف";
            phoneValidationError.style.display = "block";
          }
          return;
        }
        var sortedCodes = countryCodes.slice().sort(function (a, b) { return b.code.length - a.code.length; });
        var detectedCountry = null;
        for (var i = 0; i < sortedCodes.length; i++) {
          if (phoneNumber.startsWith(sortedCodes[i].code)) { detectedCountry = sortedCodes[i]; break; }
        }
        if (!detectedCountry) detectedCountry = countryCodes.find(function (c) { return c.code === "966"; }) || countryCodes[0];
        var phoneWithoutCode = phoneNumber.startsWith(detectedCountry.code)
          ? phoneNumber.substring(detectedCountry.code.length) : phoneNumber;
        var valid = phoneWithoutCode.length >= detectedCountry.minLength
          && phoneWithoutCode.length <= detectedCountry.maxLength
          && (!detectedCountry.pattern || detectedCountry.pattern.test(phoneWithoutCode))
          && !phoneInput.classList.contains("invalid");
        if (valid) {
          // Clear phone input
          phoneInput.value = "";
          if (customPlaceholder) { customPlaceholder.classList.remove("invalid"); customPlaceholder.style.display = "flex"; }
          if (phoneValidationError) phoneValidationError.style.display = "none";
          phoneInput.classList.remove("valid", "invalid");
          openChatDetail();
        } else {
          validatePhoneNumber();
        }
      }

      function openChatDetail() {
        if (mainHomeContainer)          mainHomeContainer.style.display          = "none";
        if (mainMessageContainer)       mainMessageContainer.style.display       = "none";
        if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "flex";
        if (mainRatingContainer)        mainRatingContainer.style.display        = "none";
        if (fugahFooter)                fugahFooter.classList.add("detail-active");
        updateFooterTabImages("message");
        if (messageDetailMessages) {
          setTimeout(function () { messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight; }, 100);
        }
      }

      function updateFooterTabImages(activeTab) {
        footerTabItems.forEach(function (item) {
          var tabType  = item.getAttribute("data-tab");
          var img      = item.querySelector("img");
          var themeMatch = chatWindow.classList.toString().match(/theme-(\w+)/);
          var tName    = themeMatch ? themeMatch[1] : "green";
          var isActive = tabType === activeTab;
          item.classList.toggle("active", isActive);
          if (!img) return;
          if (tabType === "message") {
            img.src = getAssetPath(isActive
              ? (tName === "black" ? "active-message-footer-black.png" : "active-message-footer.png")
              : (tName === "black" ? "inactive-message-footer-black.png.png" : "inactive-message-footer.png"));
          } else if (tabType === "home") {
            img.src = getAssetPath(isActive
              ? (tName === "black" ? "active-home-footer-black.png" : "active-home-footer.png")
              : (tName === "black" ? "new-img.png" : "inactive-home-footer.png.png"));
          }
        });
      }

      if (sendMessageBtn) {
        sendMessageBtn.addEventListener("click", handleSendPhone);
        sendMessageBtn.addEventListener("touchstart", function (e) {
          e.preventDefault();
          handleSendPhone();
        });
      }


      // ========================================
      // TAB SWITCHING
      // ========================================
      function switchTab(tabName) {
        if (tabName !== "home" && phoneInput) {
          phoneInput.value = "";
          if (customPlaceholder) { customPlaceholder.classList.remove("invalid"); customPlaceholder.style.display = "block"; }
          if (phoneValidationError) phoneValidationError.style.display = "none";
          phoneInput.classList.remove("valid", "invalid");
        }
        updateFooterTabImages(tabName);
        if (tabName === "home") {
          if (phoneInput) { phoneInput.value = ""; if (customPlaceholder) { customPlaceholder.classList.remove("invalid"); customPlaceholder.style.display = "flex"; } if (phoneValidationError) phoneValidationError.style.display = "none"; phoneInput.classList.remove("valid", "invalid"); }
          if (mainHomeContainer)          mainHomeContainer.style.display          = "flex";
          if (mainMessageContainer)       mainMessageContainer.style.display       = "none";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer)        mainRatingContainer.style.display        = "none";
          if (fugahFooter)                fugahFooter.classList.remove("detail-active");
        } else if (tabName === "message") {
          if (mainHomeContainer)          mainHomeContainer.style.display          = "none";
          if (mainMessageContainer)       mainMessageContainer.style.display       = "block";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer)        mainRatingContainer.style.display        = "none";
          if (fugahFooter)                fugahFooter.classList.remove("detail-active");
          goBackToMessageList();
          checkAndUpdateEmptyState();
        }
      }

      footerTabItems.forEach(function (item) {
        item.addEventListener("click", function () { switchTab(item.getAttribute("data-tab")); });
      });


      // ========================================
      // MESSAGE DETAIL NAVIGATION
      // ========================================
      function openMessageDetail(messageId) {
        if (phoneInput) { phoneInput.value = ""; if (customPlaceholder) { customPlaceholder.classList.remove("invalid"); customPlaceholder.style.display = "block"; } if (phoneValidationError) phoneValidationError.style.display = "none"; phoneInput.classList.remove("valid", "invalid"); }
        if (mainMessageContainer)       mainMessageContainer.style.display       = "none";
        if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "flex";
        if (fugahFooter)                fugahFooter.classList.add("detail-active");
        startTimestampUpdates();
        if (messageDetailMessages) setTimeout(function () { messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight; }, 100);
      }

      messageItems.forEach(function (item) {
        item.addEventListener("click", function () {
          var msgId = item.getAttribute("data-message-id");
          if (msgId) openMessageDetail(msgId);
        });
        item.style.cursor = "pointer";
      });


      // ========================================
      // LOADING INDICATOR
      // ========================================
      function showLoadingIndicator() {
        if (!messageDetailMessages) return null;
        var existing = messageDetailMessages.querySelector(".chat-message-loading");
        if (existing) existing.remove();
        var existingTs = messageDetailMessages.querySelector(".last-message-timestamp");
        if (existingTs) existingTs.remove();
        if (messageDetailInput) { messageDetailInput.disabled = true; messageDetailInput.setAttribute("readonly", "readonly"); }
        if (messageDetailSendBtn) { messageDetailSendBtn.classList.add("inactive"); messageDetailSendBtn.disabled = true; }
        var msgDiv = document.createElement("div");
        msgDiv.className = "chat-message chat-message-bot";
        var contentDiv = document.createElement("div");
        contentDiv.className = "chat-message-content";
        var loadingDiv = document.createElement("div");
        loadingDiv.className = "chat-message-loading";
        loadingDiv.innerHTML = '<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>';
        contentDiv.appendChild(loadingDiv);
        msgDiv.appendChild(contentDiv);
        messageDetailMessages.appendChild(msgDiv);
        setTimeout(function () { messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight; }, 50);
        return msgDiv;
      }

      function removeLoadingIndicator() {
        if (!messageDetailMessages) return;
        var el = messageDetailMessages.querySelector(".chat-message-loading");
        if (el) el.closest(".chat-message").remove();
      }


      // ========================================
      // DATE / TIME
      // ========================================
      function formatDateTime() {
        var now = new Date();
        var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        var hours = now.getHours();
        var ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        var minutes = now.getMinutes().toString().padStart(2, "0");
        return now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear() + ", " + hours + ":" + minutes + " " + ampm;
      }


      // ========================================
      // SOUND
      // ========================================
      function playMessageSound() {
        try {
          var audio = new Audio(getAssetPath("message.mp3"));
          audio.volume = 0.7;
          audio.play().catch(function () {});
        } catch (e) {}
      }


      // ========================================
      // MESSAGE CREATION
      // ========================================
      function linkifyText(text) {
        var urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
        return text.replace(urlPattern, function (url) {
          var href = url.startsWith("www.") ? "https://" + url : url;
          return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" class="chat-link">' + url + "</a>";
        });
      }

      function addDetailMessage(text, isUser, updateTimestamp) {
        addDetailMessageWithFile(text, null, "image", null, isUser, updateTimestamp);
      }

      function addDetailMessageWithFile(text, filePreviewUrl, fileType, fileName, isUser, updateTimestamp) {
        if (!messageDetailMessages) return;
        removeLoadingIndicator();
        var msgDiv = document.createElement("div");
        msgDiv.className = "chat-message " + (isUser ? "chat-message-user" : "chat-message-bot");
        var contentDiv = document.createElement("div");
        contentDiv.className = "chat-message-content";
        if (filePreviewUrl && fileType === "image") {
          var imgWrap = document.createElement("div"); imgWrap.className = "chat-message-image-wrap";
          var img = document.createElement("img"); img.className = "chat-message-img"; img.src = filePreviewUrl; img.alt = "Image"; img.loading = "lazy";
          if (fileName) img.setAttribute("data-file-name", fileName);
          imgWrap.appendChild(img); contentDiv.appendChild(imgWrap);
        } else if (filePreviewUrl && (fileType === "pdf" || fileType === "word" || fileType === "excel" || fileType === "other")) {
          var fileCard = document.createElement("div"); fileCard.className = "chat-message-file";
          fileCard.setAttribute("data-preview-url", filePreviewUrl);
          fileCard.setAttribute("data-file-type", fileType);
          fileCard.setAttribute("data-file-name", fileName || "File");
          fileCard.textContent = (fileType === "pdf" ? "📄 " : fileType === "word" ? "📝 " : fileType === "excel" ? "📊 " : "📎 ") + (fileName || "File");
          contentDiv.appendChild(fileCard);
        }
        if (text && text.trim() !== "") {
          var textP = document.createElement("p");
          textP.innerHTML = linkifyText(text.replace(/\n/g, "<br>"));
          contentDiv.appendChild(textP);
        }
        msgDiv.appendChild(contentDiv);
        messageDetailMessages.appendChild(msgDiv);
        if (updateTimestamp) {
          var existingTs = messageDetailMessages.querySelector(".last-message-timestamp");
          if (existingTs) existingTs.remove();
          updateLastMessageTimestamp();
          if (messageDetailInput) { messageDetailInput.disabled = false; messageDetailInput.removeAttribute("readonly"); }
          if (messageDetailSendBtn) { messageDetailSendBtn.disabled = false; toggleMessageDetailSendButtonState(); }
        } else if (isUser) {
          var existingTs2 = messageDetailMessages.querySelector(".last-message-timestamp");
          if (existingTs2) existingTs2.remove();
        }
        playMessageSound();
        setTimeout(function () { messageDetailMessages.scrollTop = messageDetailMessages.scrollHeight; }, 50);
      }

      function updateLastMessageTimestamp() {
        if (!messageDetailMessages) return;
        var existing = messageDetailMessages.querySelector(".last-message-timestamp");
        if (existing) existing.remove();
        var now = new Date();
        lastTimestampMinute = now.getMinutes();
        lastTimestampHour   = now.getHours();
      }

      var timestampUpdateInterval = null;
      var lastTimestampMinute = null;
      var lastTimestampHour   = null;

      function startTimestampUpdates() {
        if (timestampUpdateInterval) clearInterval(timestampUpdateInterval);
        timestampUpdateInterval = setInterval(function () {
          if (!messageDetailMessages) return;
          var allMsgs = Array.from(messageDetailMessages.children).filter(function (c) {
            return c.classList.contains("chat-message") && !c.classList.contains("last-message-timestamp");
          });
          var lastMsg = allMsgs.length > 0 ? allMsgs[allMsgs.length - 1] : null;
          if (lastMsg && lastMsg.classList.contains("chat-message-bot")) {
            var now = new Date();
            var minutesDiff = (now.getHours() - (lastTimestampHour || 0)) * 60 + (now.getMinutes() - (lastTimestampMinute || 0));
            if (lastTimestampMinute === null || minutesDiff >= 5) {
              updateLastMessageTimestamp();
            }
          }
        }, 1000);
      }

      function stopTimestampUpdates() {
        if (timestampUpdateInterval) { clearInterval(timestampUpdateInterval); timestampUpdateInterval = null; }
      }


      // ========================================
      // MESSAGE SENDING
      // ========================================
      var messageDetailFileInput = shadow.querySelector("#message-detail-file-input");

      function sendDetailMessage() {
        if (!messageDetailInput || !messageDetailSendBtn) return;
        if (messageDetailSendBtn.classList.contains("inactive")) return;
        var message = messageDetailInput.value.trim();
        var file    = messageDetailFileInput && messageDetailFileInput.files && messageDetailFileInput.files[0];
        if (!message && !file) return;

        if (file && file.type && file.type.startsWith("image/")) {
          var reader = new FileReader();
          reader.onload = function (e) {
            addDetailMessageWithFile(message || "", e.target.result, "image", file.name, true, false);
            messageDetailInput.value = ""; hideFilePreview(); autoResizeTextarea(); toggleMessageDetailSendButtonState();
            showLoadingIndicator();
            setTimeout(function () { addDetailMessageWithFile("شكراً لك! تم استلام صورتك.", e.target.result, "image", file.name, false, true); }, 1500);
          };
          reader.readAsDataURL(file);
        } else if (file) {
          var blobUrl = URL.createObjectURL(file);
          var fType = file.type === "application/pdf" ? "pdf" : file.name.match(/\.docx?$/i) ? "word" : file.name.match(/\.xlsx?$/i) ? "excel" : "other";
          addDetailMessageWithFile(message || file.name, blobUrl, fType, file.name, true, false);
          messageDetailInput.value = ""; hideFilePreview(); autoResizeTextarea(); toggleMessageDetailSendButtonState();
          showLoadingIndicator();
          setTimeout(function () { addDetailMessageWithFile("شكراً لك! تم استلام الملف.", blobUrl, fType, file.name, false, true); }, 1500);
        } else {
          addDetailMessage(message, true, false);
          messageDetailInput.value = ""; hideFilePreview(); autoResizeTextarea(); toggleMessageDetailSendButtonState();
          showLoadingIndicator();
          setTimeout(function () { addDetailMessage("شكراً لك! سأقوم بالرد عليك قريباً.", false, true); }, 1500);
        }
      }

      if (messageDetailSendBtn) messageDetailSendBtn.addEventListener("click", sendDetailMessage);

      // ── File preview ──────────────────────────────────────────────────────
      var filePreviewContainer = shadow.querySelector("#message-detail-file-preview");
      var filePreviewName      = shadow.querySelector("#file-preview-name");
      var filePreviewThumb     = shadow.querySelector("#file-preview-thumb");
      var filePreviewRemove    = shadow.querySelector("#file-preview-remove");

      function hideFilePreview() {
        if (filePreviewContainer) filePreviewContainer.style.display = "none";
        if (filePreviewThumb) { filePreviewThumb.style.display = "none"; filePreviewThumb.src = ""; }
        if (filePreviewName) filePreviewName.textContent = "";
        if (messageDetailFileInput) messageDetailFileInput.value = "";
      }

      function showFilePreview(file) {
        if (!filePreviewContainer || !filePreviewName) return;
        filePreviewContainer.style.display = "block";
        filePreviewName.textContent = file.name;
        if (filePreviewThumb && file.type && file.type.startsWith("image/")) {
          var reader = new FileReader();
          reader.onload = function (e) { filePreviewThumb.src = e.target.result; filePreviewThumb.style.display = "block"; };
          reader.readAsDataURL(file);
        }
      }

      if (messageDetailFileInput) {
        messageDetailFileInput.addEventListener("change", function (e) {
          var f = e.target.files && e.target.files[0];
          if (f) showFilePreview(f); else hideFilePreview();
          toggleMessageDetailSendButtonState();
        });
      }
      if (filePreviewRemove) {
        filePreviewRemove.addEventListener("click", function (e) {
          e.preventDefault();
          hideFilePreview();
          toggleMessageDetailSendButtonState();
        });
      }

      // ── Textarea auto-resize ──────────────────────────────────────────────
      function autoResizeTextarea() {
        if (!messageDetailInput) return;
        messageDetailInput.style.height = "auto";
        messageDetailInput.style.height = Math.min(Math.max(messageDetailInput.scrollHeight, 20), 100) + "px";
      }

      if (messageDetailInput) {
        messageDetailInput.addEventListener("input", function () {
          toggleMessageDetailSendButtonState();
          autoResizeTextarea();
        });
        messageDetailInput.addEventListener("focus", function () {
          if (checkIsIOS() && window.innerWidth <= 767 && fugahFooter) {
            fugahFooter.style.setProperty("display", "none", "important");
          }
          if (mobileHeightUpdateHandler) {
            setTimeout(mobileHeightUpdateHandler, checkIsIOS() ? 500 : 450);
          }
        });
        messageDetailInput.addEventListener("blur", function () {
          if (checkIsIOS() && window.innerWidth <= 767) {
            setTimeout(function () {
              if (fugahFooter) fugahFooter.style.removeProperty("display");
              if (mobileHeightUpdateHandler) mobileHeightUpdateHandler();
            }, 300);
          }
        });
        autoResizeTextarea();
      }


      // ========================================
      // SEND BUTTON STATE
      // ========================================
      function toggleMessageDetailSendButtonState() {
        if (!messageDetailInput || !messageDetailSendBtn) return;
        var hasText = messageDetailInput.value.trim().length > 0;
        var hasFile = messageDetailFileInput && messageDetailFileInput.files && messageDetailFileInput.files.length > 0;
        messageDetailSendBtn.classList.toggle("inactive", !(hasText || hasFile));
      }
      if (messageDetailSendBtn) messageDetailSendBtn.classList.add("inactive");


      // ========================================
      // MESSAGE LIST NAVIGATION
      // ========================================
      function checkAndUpdateEmptyState() {
        if (!messageContainer || !noMessagesEmptyState) return;
        var hasMessages = messageContainer.querySelectorAll(".message-item").length > 0;
        noMessagesEmptyState.style.display = hasMessages ? "none" : "flex";
      }

      function goBackToMessageList() {
        if (mainMessageContainer)       mainMessageContainer.style.display       = "block";
        if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
        if (mainRatingContainer)        mainRatingContainer.style.display        = "none";
        if (fugahFooter)                fugahFooter.classList.remove("detail-active");
        resetRatingEmojis();
        stopTimestampUpdates();
        if (messageDetailInput) { messageDetailInput.value = ""; toggleMessageDetailSendButtonState(); }
        checkAndUpdateEmptyState();
      }

      function showRatingScreen() {
        var ratingMessages = shadow.querySelector("#rating-messages");
        if (messageDetailMessages && ratingMessages) {
          ratingMessages.innerHTML = messageDetailMessages.innerHTML;
          var mobileRating = document.createElement("div");
          mobileRating.className = "chat-message chat-message-rating";
          mobileRating.innerHTML = '<div class="chat-message-content rating-message-content">'
            + '<div class="rating-title"><p>قيم محادثتك</p></div>'
            + '<div class="rating-emoji-container">'
            + [1,2,3,4,5].map(function(n) {
                return '<img src="' + getAssetPath("emoji-" + n + ".png") + '" alt="Rating ' + n + '" class="rating-emoji" data-rating="' + n + '" />';
              }).join("")
            + "</div></div>";
          ratingMessages.appendChild(mobileRating);
          setTimeout(function () { ratingMessages.scrollTop = ratingMessages.scrollHeight; }, 100);
        }
        if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
        if (mainRatingContainer)        mainRatingContainer.style.display        = "flex";
        if (fugahFooter)                fugahFooter.classList.add("detail-active");
        setupRatingEmojis();
      }

      if (messageDetailBackBtn) {
        messageDetailBackBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", showRatingScreen);
        });
        messageDetailBackBtn.addEventListener("touchstart", function (e) {
          e.stopPropagation(); e.preventDefault();
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", showRatingScreen);
        }, { passive: false });
      }

      if (messageDetailBackTickBtn) {
        messageDetailBackTickBtn.addEventListener("click", function (e) { e.stopPropagation(); goBackToMessageList(); });
        messageDetailBackTickBtn.addEventListener("touchstart", function (e) { e.stopPropagation(); e.preventDefault(); goBackToMessageList(); }, { passive: false });
      }

      if (ratingBackBtn) {
        function closeFromRating() {
          if (mainHomeContainer)          mainHomeContainer.style.display          = "flex";
          if (mainMessageContainer)       mainMessageContainer.style.display       = "none";
          if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
          if (mainRatingContainer)        mainRatingContainer.style.display        = "none";
          if (fugahFooter)                fugahFooter.classList.remove("detail-active");
          switchTab("home");
          toggleChat();
        }
        ratingBackBtn.addEventListener("click",      function (e) { e.stopPropagation(); closeFromRating(); });
        ratingBackBtn.addEventListener("touchstart", function (e) { e.stopPropagation(); e.preventDefault(); closeFromRating(); }, { passive: false });
      }

      function resetRatingEmojis() {
        shadow.querySelectorAll(".rating-emoji").forEach(function (e) {
          e.classList.remove("selected");
          if (e.dataset.originalSrc) e.src = e.dataset.originalSrc;
        });
      }

      function setupRatingEmojis() {
        resetRatingEmojis();
        shadow.querySelectorAll(".rating-emoji").forEach(function (emoji) {
          var rating = emoji.getAttribute("data-rating");
          var originalSrc = emoji.src.includes("emoji-") ? emoji.src : getAssetPath("emoji-" + rating + ".png");
          var activeSrc   = originalSrc.replace(/emoji-(\d+)\.png/, "active-emoji-$1.png");
          emoji.dataset.originalSrc = originalSrc;
          emoji.dataset.activeSrc   = activeSrc;
          emoji.addEventListener("mouseenter", function () { emoji.src = activeSrc; });
          emoji.addEventListener("mouseleave", function () { emoji.src = emoji.classList.contains("selected") ? activeSrc : originalSrc; });
          emoji.addEventListener("click", function () {
            shadow.querySelectorAll(".rating-emoji").forEach(function (e) { e.classList.remove("selected"); e.src = e.dataset.originalSrc; });
            emoji.classList.add("selected");
            emoji.src = activeSrc;
          });
        });
      }


      // ========================================
      // DROPDOWN MENUS
      // ========================================
      var lastDropdownOpenAt = 0;

      function toggleMessageDetailDropdown() {
        if (!fugahMessageDetailDropdown) return;
        var vis = fugahMessageDetailDropdown.style.display === "block";
        fugahMessageDetailDropdown.style.display = vis ? "none" : "block";
        if (!vis) lastDropdownOpenAt = Date.now();
      }
      function toggleRatingDropdown() {
        if (!fugahRatingDropdown) return;
        var vis = fugahRatingDropdown.style.display === "block";
        fugahRatingDropdown.style.display = vis ? "none" : "block";
        if (!vis) lastDropdownOpenAt = Date.now();
      }

      if (fugahMessageDetailDropdownIcon) {
        fugahMessageDetailDropdownIcon.addEventListener("click",      function (e) { e.stopPropagation(); toggleMessageDetailDropdown(); });
        fugahMessageDetailDropdownIcon.addEventListener("touchstart", function (e) { e.stopPropagation(); e.preventDefault(); toggleMessageDetailDropdown(); }, { passive: false });
      }
      if (fugahRatingDropdownIcon) {
        fugahRatingDropdownIcon.addEventListener("click",      function (e) { e.stopPropagation(); toggleRatingDropdown(); });
        fugahRatingDropdownIcon.addEventListener("touchstart", function (e) { e.stopPropagation(); e.preventDefault(); toggleRatingDropdown(); }, { passive: false });
      }

      shadow.addEventListener("click", function (e) {
        if (Date.now() - lastDropdownOpenAt < 400) return;
        if (fugahMessageDetailDropdown && fugahMessageDetailDropdownIcon) {
          if (!fugahMessageDetailDropdown.contains(e.target) && !fugahMessageDetailDropdownIcon.contains(e.target)) fugahMessageDetailDropdown.style.display = "none";
        }
        if (fugahRatingDropdown && fugahRatingDropdownIcon) {
          if (!fugahRatingDropdown.contains(e.target) && !fugahRatingDropdownIcon.contains(e.target)) fugahRatingDropdown.style.display = "none";
        }
      });


      // ========================================
      // DROPDOWN ACTIONS + CONFIRMATION DIALOG
      // ========================================
      var lastConfirmationOpenAt = 0;
      var currentConfirmCallback = null;

      function showCustomConfirmation(message, onConfirm) {
        if (customConfirmationDialog && confirmationDialogMessage) {
          confirmationDialogMessage.textContent = message;
          customConfirmationDialog.style.display = "flex";
          currentConfirmCallback = onConfirm;
          lastConfirmationOpenAt = Date.now();
        } else {
          if (confirm(message) && onConfirm) onConfirm();
        }
      }

      function closeConfirmationIfAllowed() {
        if (Date.now() - lastConfirmationOpenAt < 450) return;
        if (customConfirmationDialog) customConfirmationDialog.style.display = "none";
        currentConfirmCallback = null;
      }

      if (confirmationBtnCancel) {
        confirmationBtnCancel.addEventListener("click", function () {
          if (customConfirmationDialog) customConfirmationDialog.style.display = "none";
          currentConfirmCallback = null;
        });
      }
      if (confirmationBtnConfirm) {
        confirmationBtnConfirm.addEventListener("click", function () {
          if (customConfirmationDialog) customConfirmationDialog.style.display = "none";
          if (currentConfirmCallback) { currentConfirmCallback(); currentConfirmCallback = null; }
        });
      }
      if (customConfirmationDialog) {
        var overlay = customConfirmationDialog.querySelector(".confirmation-dialog-overlay");
        if (overlay) {
          overlay.addEventListener("click", closeConfirmationIfAllowed);
          overlay.addEventListener("touchstart", function (e) { e.preventDefault(); closeConfirmationIfAllowed(); }, { passive: false });
        }
      }

      if (closeChatDetailMenuItem) {
        closeChatDetailMenuItem.addEventListener("click",      function (e) { e.stopPropagation(); fugahMessageDetailDropdown.style.display = "none"; showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", showRatingScreen); });
        closeChatDetailMenuItem.addEventListener("touchstart", function (e) { e.stopPropagation(); fugahMessageDetailDropdown.style.display = "none"; showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", showRatingScreen); });
      }
      if (createTicketDetailMenuItem) {
        createTicketDetailMenuItem.addEventListener("click",      function (e) { e.stopPropagation(); fugahMessageDetailDropdown.style.display = "none"; showCustomConfirmation("هل أنت متأكد من رفع تذكرة؟", showRatingScreen); });
        createTicketDetailMenuItem.addEventListener("touchstart", function (e) { e.stopPropagation(); fugahMessageDetailDropdown.style.display = "none"; showCustomConfirmation("هل أنت متأكد من رفع تذكرة؟", showRatingScreen); });
      }
      if (closeRatingMenuItem) {
        closeRatingMenuItem.addEventListener("click", function (e) {
          e.stopPropagation(); fugahRatingDropdown.style.display = "none";
          showCustomConfirmation("هل أنت متأكد من إغلاق الدردشة؟", function () {
            if (mainHomeContainer)          mainHomeContainer.style.display          = "flex";
            if (mainMessageContainer)       mainMessageContainer.style.display       = "none";
            if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
            if (mainRatingContainer)        mainRatingContainer.style.display        = "none";
            if (fugahFooter)                fugahFooter.classList.remove("detail-active");
            switchTab("home");
            toggleChat();
          });
        });
      }


      // ========================================
      // INITIAL DISPLAY STATE
      // ========================================
      if (mainHomeContainer)          mainHomeContainer.style.display          = "flex";
      if (mainMessageContainer)       mainMessageContainer.style.display       = "none";
      if (mainMessageDetailContainer) mainMessageDetailContainer.style.display = "none";
      switchTab("home");
      checkAndUpdateEmptyState();
      if (messageDetailSendBtn)       messageDetailSendBtn.classList.add("inactive");


      // ========================================
      // THEME SWITCHING
      // ========================================
      function changeTheme(themeName) {
        var cw              = shadow.querySelector("#chat-window");
        var ci              = shadow.querySelector("#chat-icon");
        var sendBtn         = shadow.querySelector("#message-detail-send-btn img");
        var mainSendBtn     = shadow.querySelector(".fugah-send-button img");
        var tabItems        = shadow.querySelectorAll(".fugah-footer-tab-item");
        var bArrow          = shadow.querySelector("#message-detail-back-btn");
        var bTickArrow      = shadow.querySelector("#message-detail-back-tick-btn");
        var rBackBtn        = shadow.querySelector("#rating-back-btn");
        var mListArrows     = shadow.querySelectorAll(".message-item img");
        var mCloseBtn       = shadow.querySelector("#message-close-btn");
        var footerLogo      = shadow.querySelector("#footer-logo");
        var fileUploadIcon  = shadow.querySelector("#file-upload-icon");
        var dropdownIco     = shadow.querySelector("#fugah-message-detail-dropdown-icon");
        var ratingDropIco   = shadow.querySelector("#fugah-rating-dropdown-icon");

        if (!cw) return;

        cw.classList.remove("theme-green","theme-red","theme-blue","theme-yellow","theme-cyan","theme-black","theme-white");
        cw.classList.add("theme-" + themeName);

        var isBlack = themeName === "black";

        // Bubble icon (only when closed)
        if (ci && !isOpen) {
          var bubbleIcons = { green:"message-green.png", red:"message-red.png", blue:"message-blue.png", yellow:"message-yellow.png", cyan:"message-cyan.png", white:"message-white.png", black:"message.png" };
          ci.src = getAssetPath(bubbleIcons[themeName] || "message.png");
        }

        // Send buttons
        if (sendBtn) {
          var sendIcons = { green:"fugah-send-button-green.png", red:"fugah-send-button-red.png", blue:"fugah-send-button-cyan.png", yellow:"fugah-send-button-yellow.png", cyan:"fugah-send-button-blue.png", white:"fugah-send-button-white.png", black:"black-arrow.png" };
          sendBtn.src = getAssetPath(sendIcons[themeName] || "black-arrow.png");
        }
        if (mainSendBtn) mainSendBtn.src = getAssetPath("send-icon.png");

        // Back / close buttons
        if (bArrow)    bArrow.src    = getAssetPath(isBlack ? "exit-button-for-black.png" : "white-exit-button.png");
        if (bTickArrow) bTickArrow.src = getAssetPath("back-tick-black.png");
        if (rBackBtn)  rBackBtn.src  = getAssetPath(isBlack ? "exit-button-for-black.png" : "white-exit-button.png");
        if (mCloseBtn) mCloseBtn.src = getAssetPath(isBlack ? "exit-button-for-black.png" : "X.png");

        // Message list arrows
        mListArrows.forEach(function (a) { a.src = getAssetPath(isBlack ? "arrow-for-black1.png" : "right-arrow.png"); });

        // Footer logo
        if (footerLogo)     footerLogo.src    = getAssetPath(isBlack ? "black-logo.png" : "fugah-footer-end.png");
        if (fileUploadIcon) fileUploadIcon.src = getAssetPath(isBlack ? "black-new.png"  : "fugah-file-icon.png");
        if (dropdownIco)    dropdownIco.src    = getAssetPath(isBlack ? "white-dropdown.png" : "fugah-menue-dropdown.png");
        if (ratingDropIco)  ratingDropIco.src  = getAssetPath(isBlack ? "white-dropdown.png" : "fugah-menue-dropdown.png");

        // Footer tabs
        tabItems.forEach(function (item) {
          var tabType  = item.getAttribute("data-tab");
          var img      = item.querySelector("img");
          var active   = item.classList.contains("active");
          if (!img || !tabType) return;
          if (tabType === "message") {
            img.src = getAssetPath(active ? (isBlack ? "active-message-footer-black.png" : "active-message-footer.png") : (isBlack ? "inactive-message-footer-black.png.png" : "inactive-message-footer.png"));
          } else if (tabType === "home") {
            img.src = getAssetPath(active ? (isBlack ? "active-home-footer-black.png" : "active-home-footer.png") : (isBlack ? "new-img.png" : "inactive-home-footer.png.png"));
          }
        });
      }

      // Expose globally for external access
      window.changeChatbotTheme = changeTheme;


      // ======================================================================
      // ✅ INIT — call get_config, apply everything, then widget is ready
      // ======================================================================
      initWidget();


    }) // end .then(html =>
    .catch(function (err) { console.error("[Fuqah] Failed to load ui.html:", err); });

})();
