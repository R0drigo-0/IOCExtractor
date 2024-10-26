import { extractIOCs } from './iocextractor.js';
import { showToast } from './toastUtils.js';
import { formatIOCResults, setupCopyButtons } from './iocFormatter.js';

class IOCExtractor {
    constructor() {
        this.urlForm = document.getElementById("urlForm");
        this.urlInput = document.getElementById("urlInput");
        this.contentDisplay = document.getElementById("contentDisplay");
        this.websiteContainer = document.getElementById("websiteContainer");
        this.spinner = document.querySelector(".loading-spinner");
        
        this.initializeEventListeners();
        this.setupResizeHandler();
    }

    initializeEventListeners() {
        this.urlForm.addEventListener("submit", this.handleSubmit.bind(this));
        this.urlInput.addEventListener("input", this.validateInput.bind(this));
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(this.handleResize.bind(this), 250);
        });
    }

    handleResize() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
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

        try {
            await this.setLoadingState(true);
            const data = await this.fetchWebsiteContent(url);
            await this.processContent(data);
            showToast('Analysis completed successfully!');
        } catch (error) {
            this.handleError(error);
        } finally {
            await this.setLoadingState(false);
        }
    }

    async setLoadingState(isLoading) {
        const elements = [this.contentDisplay, this.websiteContainer];
        const opacity = isLoading ? "0.5" : "1";
        
        elements.forEach(el => {
            el.style.opacity = opacity;
            el.style.pointerEvents = isLoading ? "none" : "auto";
        });
        
        this.spinner.style.display = isLoading ? "block" : "none";
        this.urlForm.querySelector('button[type="submit"]').disabled = isLoading;
    }

    async fetchWebsiteContent(url) {
        const proxyUrls = [
            'https://corsproxy.io/?' + encodeURIComponent(url),
            'https://api.allorigins.win/get?url=' + encodeURIComponent(url),
            'https://thingproxy.freeboard.io/fetch/' + encodeURIComponent(url)
        ];

        for (const proxyUrl of proxyUrls) {
            try {
                const response = await fetch(proxyUrl);
                
                if (response.ok) {
                    const data = await response.json();
                    return data.contents || await response.text();
                }
            } catch (error) {
                console.warn(`Failed to fetch using ${proxyUrl}:`, error);
            }
        }

        throw new Error('Failed to fetch website content from all proxy URLs');
    }

    async processContent(data) {
        const doc = new DOMParser().parseFromString(data, "text/html");
        
        // Clean up the document
        ['header', 'footer', 'nav', 'script', 'style'].forEach(tag => {
            doc.querySelectorAll(tag).forEach(el => el.remove());
        });

        // Extract and display content
        const mainContent = doc.querySelector("article") || doc.querySelector("main") || doc.body;
        const extractedIOCs = await extractIOCs(mainContent.innerText);

        this.contentDisplay.innerHTML = formatIOCResults(extractedIOCs);
        this.websiteContainer.innerHTML = this.sanitizeHTML(mainContent.innerHTML);
        
        setupCopyButtons();
    }

    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Remove potentially harmful elements and attributes
        const scripts = div.getElementsByTagName('script');
        const iframes = div.getElementsByTagName('iframe');
        
        while(scripts.length) {
            scripts[0].parentNode.removeChild(scripts[0]);
        }
        while(iframes.length) {
            iframes[0].parentNode.removeChild(iframes[0]);
        }
        
        return div.innerHTML;
    }

    handleError(error) {
        console.error('Error:', error);
        showToast(error.message, 'danger');
        this.contentDisplay.innerHTML = `
            <div class="alert alert-danger">
                <h5 class="alert-heading">Error</h5>
                <p>${error.message}</p>
            </div>`;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IOCExtractor();
});