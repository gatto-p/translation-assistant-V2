function flipLanguages() {
    let fromLanguage = document.getElementById('fromLanguage');
    let toLanguage = document.getElementById('toLanguage');
    
    let temp = fromLanguage.value;
    fromLanguage.value = toLanguage.value;
    toLanguage.value = temp;
}

function divideText() {
    let frenchText = document.getElementById('frenchText').value;

    // Check if the textarea is empty
    if (!frenchText.trim()) {
        restart(); // Call the restart function if the text area is empty
        return;  // Return early to prevent further processing
    }

    // If the textarea contains new text after a reset or repaste, reset the chunks and process the new input
    let chunksContainer = document.getElementById('chunksContainer');
    if (chunksContainer.innerHTML !== '') {
        // If chunks already exist, clear them before processing new content
        chunksContainer.innerHTML = '';
        document.getElementById('finalTranslation').value = '';
    }

    let customLimitInput = document.getElementById('customCharLimit').value;
    let chunkSize = customLimitInput && parseInt(customLimitInput) > 0 ? parseInt(customLimitInput) : 2000;

    let chunks = [];
    let start = 0;

    // Update the French text character count
    updateFrenchCharCount(frenchText.length);

    // Update current character limit display
    document.getElementById('currentCharLimit').innerText = `Current character limit: ${chunkSize}`;

    // Show the hidden section (this ensures all parts are visible)
    document.getElementById('hiddenSection').style.display = 'block';

    // Split the text into chunks, strictly adhering to the character limit
    while (start < frenchText.length) {
        let end = Math.min(start + chunkSize, frenchText.length);

        // Try to find a space to split the chunk at a word boundary
        if (end < frenchText.length && frenchText[end] !== ' ') {
            let spaceIndex = frenchText.lastIndexOf(' ', end);
            if (spaceIndex > start) {
                end = spaceIndex; // Adjust the end index to the last space before exceeding the limit
            }
        }

        let chunk = frenchText.substring(start, end).trim();
        chunks.push(chunk);
        start = end;
    }

    // Create a box for each chunk
    chunks.forEach((chunk, index) => {
        let chunkContainer = document.createElement('div');
        chunkContainer.classList.add('chunk-box');
        chunkContainer.innerHTML = 
            `<textarea class="french-box" readonly>${chunk}</textarea>
            <textarea class="english-box" placeholder="Translate this chunk..." id="english-${index}" oninput="updateEnglishCharCount()"></textarea>
            <button class="copy-btn" onclick="copyToClipboard(${index})">Copy</button>
            <button class="paste-btn" onclick="pasteFromClipboard(${index})">Paste</button>`;
        document.getElementById('chunksContainer').appendChild(chunkContainer);
    });

    // Update the progress text to reflect the number of chunks created
    updateProgressText();
    
    // Make sure the "Combine" section is visible after dividing text
    document.querySelector('.combine-section').style.display = 'block';
    document.querySelector('.progress-circle-container').style.display = 'block';
}




// Update the French character count display
function updateFrenchCharCount(count) {
    document.getElementById('frenchCharCount').innerText = `Character count: ${count}`;
}

// Copy French text chunk to clipboard and trigger the Flask route
function copyToClipboard(index) {
    let frenchText = document.querySelector(`#chunksContainer #english-${index}`).previousElementSibling.value;

    // Create a temporary textarea to copy the text from
    let tempTextArea = document.createElement("textarea");
    tempTextArea.value = frenchText;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);

    // Now trigger the Flask route to open the Reverso link
    fetch('/trigger-translate')
        .then(response => response.text())
        .then(data => {
            console.log(data); // You can log the response if you want

            // Open the Reverso translation page
            window.open('https://www.reverso.net/text-translation', '_blank');
        })
        .catch(error => {
            console.error("Error triggering translation:", error);
        });
}

// Paste translated text from clipboard into the corresponding English box
function pasteFromClipboard(index) {
    navigator.clipboard.readText()
        .then(text => {
            let englishBox = document.getElementById(`english-${index}`);
            englishBox.value = text;
            updateProgressText(); // Update progress text after paste
            updateEnglishCharCount(); // Update the English character count after paste

            // Change the background colour to pale green if translated
            updateBackgroundColour(englishBox);

            // Show the progress circle when the user starts pasting the translation
            if (!progressCircleVisible) {
                progressCircleContainer.style.visibility = 'visible';
                progressCircleVisible = true;
            }
        })
        .catch(err => {
            console.error("Failed to read clipboard contents:", err);
        });
}

// Helper function to update the background colour of the English box
function updateBackgroundColour(englishBox) {
    if (englishBox.value.trim() !== '') {
        englishBox.style.backgroundColor = '#d4f7d4';  // Pale green colour
    } else {
        englishBox.style.backgroundColor = '#f1f1f1';  // Default greyish colour
    }
}

// Combine all English translations into one
function combineTranslations() {
    let combinedText = '';
    let englishTexts = document.querySelectorAll('.english-box');

    englishTexts.forEach((textBox) => {
        combinedText += textBox.value + '\n\n';
    });
    // Apply the text formatting logic
    combinedText = formatText(combinedText);
    document.getElementById('finalTranslation').value = combinedText.trim();

    // Update the English character count after combining translations
    updateEnglishCharCount();

    // Hide the progress circle once combine is clicked
    progressCircleContainer.style.visibility = 'hidden';
}

// Update the English character count
function updateEnglishCharCount() {
    let englishText = document.getElementById('finalTranslation').value;
    let englishCharCount = englishText.length;
    document.getElementById('englishCharCount').innerText = `Character count: ${englishCharCount}`;
}

// Copy the combined translation to the clipboard
function copyCombinedTranslation() {
    let combinedTranslation = document.getElementById('finalTranslation').value;

    // Create a temporary textarea to copy the text from
    let tempTextArea = document.createElement("textarea");
    tempTextArea.value = combinedTranslation;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);
}

// Restart the process (reset everything)
function restart() {
    // Reset all text areas and elements
    document.getElementById('frenchText').value = '';
    document.getElementById('finalTranslation').value = '';
    document.getElementById('frenchCharCount').innerText = 'Character count: 0';
    document.getElementById('englishCharCount').innerText = 'Character count: 0';
    document.getElementById('chunksContainer').innerHTML = '';
  
    // Reset custom character limit
    document.getElementById('customCharLimit').value = '';
    // Reset the displayed current character limit to 2000
    document.getElementById('currentCharLimit').innerText = 'Current character limit: 2000';

    // Hide the progress circle
    progressCircleContainer.style.visibility = 'hidden';
    progressCircle.style.backgroundColor = '#f1f1f1';
    percentageText.innerText = '0%';
    progressCircleVisible = false;

    // Hide the hidden section
    document.getElementById('hiddenSection').style.display = 'none';

    // Hide all elements below the Divide Button
    let elementsBelowDivideButton = document.querySelectorAll('#hiddenSection, .combine-section, .progress-circle-container');
    elementsBelowDivideButton.forEach(element => element.style.display = 'none');
}

// Progress circle and drag functionality
let progressCircleVisible = false;
let isDragging = false;
let offsetX, offsetY;

// Get references to the progress circle elements
const progressCircleContainer = document.getElementById('progressCircleContainer');
const progressCircle = document.getElementById('progressCircle');
const percentageText = document.getElementById('percentageText');

// Function to update the progress circle and percentage text
function updateProgressText() {
    let totalChunks = document.querySelectorAll('.french-box').length;
    let completedChunks = 0;

    // Count how many English boxes have content
    document.querySelectorAll('.english-box').forEach((box) => {
        if (box.value.trim() !== '') {
            completedChunks++;
        }
    });

    // Calculate percentage
    let progress = (completedChunks / totalChunks) * 100;

    // Update the progress circle and percentage text
    progressCircle.style.backgroundColor = `conic-gradient(#d4f7d4 ${progress}%, #f1f1f1)`;
    percentageText.innerText = Math.round(progress) + '%';
}

// Make the progress circle draggable
progressCircleContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - progressCircleContainer.getBoundingClientRect().left;
    offsetY = e.clientY - progressCircleContainer.getBoundingClientRect().top;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        progressCircleContainer.style.left = e.clientX - offsetX + 'px';
        progressCircleContainer.style.top = e.clientY - offsetY + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Helper function to format text
function formatText(inputText) {
    let formattedText = inputText.replace(/\r?\n/g, ' ') // Replace all line breaks with spaces
                                 .replace(/  +/g, ' ') // Remove multiple spaces
                                 .replace(/(\.\s*\n|\n\n)/g, '\n\n') // Restore paragraph breaks
                                 .replace(/([.!?])(\S)/g, '$1 $2'); // Ensure proper spacing after punctuation marks
    
    // Capitalize the first letter of each sentence
    formattedText = formattedText.replace(/(^|\.\s+|\n)([a-z])/g, (match, separator, letter) => {
        return separator + letter.toUpperCase();
    });

    // Remove any leading/trailing spaces
    return formattedText.trim();
}

document.getElementById('downloadPdfBtn').addEventListener('click', function () {
    // Get the original and translated text
    const originalText = document.getElementById('frenchText').value;
    const translatedText = document.getElementById('finalTranslation').value;

    // Create a new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set document properties
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 10;
    const marginY = 30;
    const maxWidth = pageWidth - marginX * 2;
    const lineHeight = 7;
    const bottomMargin = 20;
    const availableHeight = pageHeight - marginY - bottomMargin;

    // Function to add centered title
    function addTitle(doc, title, yPosition) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        const titleWidth = doc.getTextWidth(title);
        const titleX = (pageWidth - titleWidth) / 2;
        doc.text(title, titleX, yPosition);
    }

    // Function to add text with pagination
    function addTextWithPagination(doc, text, startY) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        // Replace line breaks with spaces to create a single paragraph
        const formattedText = text.replace(/\n+/g, ' ').trim();
        const lines = doc.splitTextToSize(formattedText, maxWidth);
        let y = startY;

        lines.forEach(line => {
            if (y + lineHeight > availableHeight) {
                doc.addPage();
                y = marginY;
            }
            doc.text(line, marginX, y);
            y += lineHeight;
        });

        return y;
    }

    // Add "Original Text" section
    addTitle(doc, 'Original Text', 20);
    let yPosition = addTextWithPagination(doc, originalText, marginY);

    // Ensure "Translated Text" starts on a new page
    doc.addPage();

    // Add "Translated Text" section
    addTitle(doc, 'Translated Text', 20);
    addTextWithPagination(doc, translatedText, marginY);

    // Save the PDF
    doc.save('translated-document.pdf');
});