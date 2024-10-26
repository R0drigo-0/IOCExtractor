import { showToast } from "./toastUtils.js";
import { extractIOCs } from "./iocExtract.js";
import { formatIOCResults, setupCopyButtons } from "./iocFormatter.js";

class IOCExtractor {
  constructor() {
    this.urlForm = document.getElementById("urlForm");
    this.urlInput = document.getElementById("urlInput");
    this.contentDisplay = document.getElementById("contentDisplay");
    this.websiteContainer = document.getElementById("websiteContainer");
    this.spinner = document.querySelector(".loading-spinner");
    this.notificationShown = false;
    this.initializeEventListeners();
    this.setupResizeHandler();
  }

  initializeEventListeners() {
    this.urlForm.addEventListener("submit", this.handleSubmit.bind(this));
    this.urlInput.addEventListener("input", this.validateInput.bind(this));
  }

  setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(this.handleResize.bind(this), 250);
    });
  }

  handleResize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  validateInput(event) {
    const submitButton = this.urlForm.querySelector('button[type="submit"]');
    try {
      new URL(event.target.value);
      submitButton.disabled = false;
    } catch {
      submitButton.disabled = true;
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const url = this.urlInput.value;
    this.notificationShown = false;

    try {
      await this.setLoadingState(true);
      const data = await this.fetchWebsiteContent(url);

      if (!data) throw new Error("No content received from the URL");

      await this.processContent(data);

      if (!this.notificationShown) {
        showToast("Analysis completed successfully!");
        this.notificationShown = true;
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      await this.setLoadingState(false);
    }
  }

  async setLoadingState(isLoading) {
    const elements = [this.contentDisplay, this.websiteContainer];
    const opacity = isLoading ? "0.5" : "1";

    elements.forEach((el) => {
      el.style.opacity = opacity;
      el.style.pointerEvents = isLoading ? "none" : "auto";
    });

    // Show or hide the loading spinner based on isLoading
    this.spinner.style.display = isLoading ? "block" : "none";
    this.urlForm.querySelector('button[type="submit"]').disabled = isLoading;
  }

  async fetchWebsiteContent(url) {
    const proxyUrls = [
      "https://corsproxy.io/?" + encodeURIComponent(url),
      "https://api.allorigins.win/get?url=" + encodeURIComponent(url),
      "https://thingproxy.freeboard.io/fetch/" + encodeURIComponent(url),
      "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(url)
    ];
    for (const proxyUrl of proxyUrls) {
      try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
          // Try to parse JSON first
          try {
            const data = await response.json();
            return data.contents || (await response.text());
          } catch (jsonError) {
            // If JSON parsing fails, fallback to text response
            const textData = await response.text();
            return textData; // Return raw text if JSON parsing fails
          }
        } else {
          console.warn(
            `Failed to fetch from ${proxyUrl}: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        console.warn(`Failed to fetch using ${proxyUrl}:`, error);
      }
    }
    throw new Error("Failed to fetch website content from all proxy URLs");
  }

  async processContent(data) {
    if (!data)
      throw new Error("Empty content, cannot proceed with IOC extraction");

    const doc = new DOMParser().parseFromString(data, "text/html");

    ["header", "footer", "nav", "script", "style"].forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    const mainContent =
      doc.querySelector("article") || doc.querySelector("main") || doc.body;
    const mainText = mainContent ? mainContent.innerText.trim() : "";

    if (!mainText) throw new Error("No valid content found for IOC extraction");

    const extractedIOCs = await extractIOCs(mainText);
    this.contentDisplay.innerHTML = formatIOCResults(extractedIOCs);
    this.websiteContainer.innerHTML = this.sanitizeHTML(mainContent.innerHTML);

    setupCopyButtons();
  }

  sanitizeHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;

    const scripts = div.getElementsByTagName("script");
    const iframes = div.getElementsByTagName("iframe");

    while (scripts.length) {
      scripts[0].parentNode.removeChild(scripts[0]);
    }
    while (iframes.length) {
      iframes[0].parentNode.removeChild(iframes[0]);
    }

    return div.innerHTML;
  }
  handleError(error) {
    if (!this.notificationShown) {
      console.error("Error:", error);
      //showToast(error.message, "danger");
      this.contentDisplay.innerHTML = `
                <div class="alert alert-danger">
                    <h5 class="alert-heading">Error</h5>
                    <p>${error.message}</p>
                </div>`;
      this.notificationShown = true;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new IOCExtractor();
});
