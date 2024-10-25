document.getElementById('urlForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = document.getElementById('urlInput').value;
    const contentDisplay = document.getElementById('contentDisplay');
    contentDisplay.innerHTML = '<p>Loading content...</p>';

    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
        
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const article = new Readability(doc).parse();

        contentDisplay.innerHTML = `<h3>${article.title}</h3><div>${article.content}</div>`;
    } catch (error) {
        contentDisplay.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
});
