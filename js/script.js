document.getElementById("urlForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = document.getElementById("urlInput").value;
    const contentDisplay = document.getElementById("contentDisplay");
    contentDisplay.innerHTML = "<p>Loading content...</p>";

    try {
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const contentType = response.headers.get("content-type");
        let data;
        let htmlData;

        data = await response.text();
        htmlData = data;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlData, "text/html");

        const title = doc.querySelector("title")?.innerText || "No title found";

        const mainContent = doc.querySelector("article")?.innerText || doc.body.innerText; // Limit to first 1000 characters

        const header = doc.querySelector("header");
        const footer = doc.querySelector("footer");
        
        if (header) header.remove();
        if (footer) footer.remove();

        contentDisplay.innerHTML = `<h2>${title}</h2><p>${mainContent}</p>`;
        

    } catch (error) {
        contentDisplay.innerHTML = `<p>${error.message}</p>`;
        console.error(error);
    }
});
