import { showToast } from "./toastUtils.js";

// Define the formatIOCResults function
export const formatIOCResults = (results) => {
  const jsonString = JSON.stringify(results, null, 2);
  return `
    <button class="btn copy-json-btn">
        <i class="fas fa-copy"></i> Copy JSON
    </button>
    <pre class="json-display">${jsonString}</pre>
    `;
};

// Define the setupCopyButtons function
export const setupCopyButtons = () => {
  const copyJsonButton = document.querySelector(".copy-json-btn");
  if (copyJsonButton) {
    copyJsonButton.addEventListener("click", () => {
      const jsonContent = document.querySelector(".json-display").innerText;
      navigator.clipboard
        .writeText(jsonContent)
        .then(() => {
          showToast("JSON copied to clipboard!", "success");
        })
        .catch((err) => {
          showToast("Failed to copy JSON.", "danger");
        });
    });
  }
};

// Initialize the application
const initializeApp = () => {
  const urlForm = document.getElementById("urlForm");
  const contentDisplay = document.getElementById("contentDisplay");
  const websiteContainer = document.getElementById("websiteContainer");
  const spinner = document.querySelector(".loading-spinner");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = document.getElementById("urlInput").value;

    try {
      // Show loading state
      contentDisplay.style.opacity = "0.5";
      websiteContainer.style.opacity = "0.5";
      spinner.style.display = "block";

      const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch website content");
      }

      // Process the response
      const data = await response.text();
      const doc = new DOMParser().parseFromString(data, "text/html");

      // Clean up the document
      const header = doc.querySelector("header");
      const footer = doc.querySelector("footer");
      if (header) header.remove();
      if (footer) footer.remove();

      // Extract and display content
      let mainContent = doc.querySelector("article") || doc.body;
      const extractedIOCs = await extractIOCs(mainContent.innerText);

      contentDisplay.innerHTML = formatIOCResults(extractedIOCs);
      websiteContainer.innerHTML = mainContent.innerHTML;

      // Setup copy buttons and show success message
      setupCopyButtons();
      showToast("Analysis completed successfully!");
    } catch (error) {
      //showToast(error.message, 'danger');
      contentDisplay.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    } finally {
      // Reset loading state
      contentDisplay.style.opacity = "1";
      websiteContainer.style.opacity = "1";
      spinner.style.display = "none";
    }
  };

  urlForm.addEventListener("submit", handleSubmit);
};

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
