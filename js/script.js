import { extractIOCs } from './../js/iocextractor.js';

const options = {
  method: 'GET',
  contentType: 'text/html',
};

const cleanText = (text) => {
  return text
    .replace(/[\r\n]+/g, ' ') // Replace breaklines with a space
    .replace(/\s{2,}/g, ' ')   // Replace multiple spaces with a single space
    .trim();                   // Remove leading and trailing spaces
};

document.getElementById("urlForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = document.getElementById("urlInput").value;

    try {
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        const response = await fetch(proxyUrl, options);
        if (!response.ok) {
                throw new Error("Network response was not ok");
        }

        let data;
        let htmlData;

        data = await response.text();
        htmlData = data;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlData, "text/html");

        let mainContent = doc.querySelector("article")?.innerText || doc.body.innerText;

        const header = doc.querySelector("header");
        const footer = doc.querySelector("footer");
        
        if (header) header.remove();
        if (footer) footer.remove();

        mainContent = cleanText(mainContent);

        const extractedIOCs = extractIOCs(mainContent);

        console.log(mainContent);
        console.log(extractedIOCs);

    } catch (error) {
        contentDisplay.innerHTML = `<p>${error.message}</p>`;
        console.error(error);
    }
});
