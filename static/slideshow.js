// Slideshow functionality
let slideIndex = 1;

// Initialize slideshow when DOM content is loaded
document.addEventListener("DOMContentLoaded", function() {
  showSlides(slideIndex);
  
  // Set up the accordion functionality
  setupAccordion();
  
  // Set up file upload dropzone
  setupFileUpload();
  
  // Set up the "Let's get started" button to link to next page
  setupStartButton();
});

// Function to set up the "Let's get started" button
function setupStartButton() {
  const startButton = document.querySelector('.button-container').parentElement;
  
  // Make sure the button link goes to next page
  if (startButton && startButton.tagName === 'A') {
    startButton.href = "http://127.0.0.1:8000/";
    startButton.target = "_blank"; // Open in new tab
  } else {
    // If the HTML structure is different, find and update the link
    const startButtonLink = document.querySelector('.upload-area a');
    if (startButtonLink) {
      startButtonLink.href = "http://127.0.0.1:5000";
      startButtonLink.target = "_blank";
    }
  }
}

// Function to show a specific slide
function showSlides(n) {
  let slides = document.querySelectorAll(".slide");
  let dots = document.querySelectorAll(".dot");
  
  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }
  
  // Hide all slides
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  
  // Remove "active" class from all dots
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }
  
  // Show the current slide and set the current dot to active
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].classList.add("active");
}

// Function to move to next/previous slide
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Function to show a specific slide when clicking on a dot
function currentSlide(n) {
  showSlides(slideIndex = n);
}

// Auto slideshow functionality
function startAutoSlideshow() {
  setInterval(function() {
    plusSlides(1);
  }, 5000); // Change slide every 5 seconds
}

// Start auto slideshow
startAutoSlideshow();

// Set up accordion functionality
function setupAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const accordionItem = header.parentElement;
      const accordionContent = header.nextElementSibling;
      
      // Toggle active class
      const isActive = accordionItem.classList.contains('active');
      
      // Close all accordion items
      document.querySelectorAll('.accordion-item').forEach(item => {
        item.classList.remove('active');
        const content = item.querySelector('.accordion-content');
        content.style.height = '0';
      });
      
      // If current item wasn't active, open it
      if (!isActive) {
        accordionItem.classList.add('active');
        accordionContent.style.height = accordionContent.scrollHeight + 'px';
      }
    });
  });
}

// Set up file upload functionality
function setupFileUpload() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  
  if (dropZone && fileInput) {
      dropZone.addEventListener('click', (e) => {
          if (!e.target.closest('.button-container')) {
              fileInput.click();
          }
      });
  }
  
  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  // Highlight drop zone when dragging file over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('dragging');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('dragging');
    }, false);
  });
  
  // Handle dropped files
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }, false);
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Process the uploaded files
  function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    const fileType = file.type;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(fileType)) {
      fileInfo.textContent = 'Error: Please upload a PDF, DOC, or DOCX file.';
      fileInfo.style.color = '#f56565';
      return;
    }
    
    // Display file information
    fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
    fileInfo.style.color = '#4a5568';
    
    // Show and animate progress bar
    progressBar.style.display = 'block';
    
    let width = 0;
    const interval = setInterval(() => {
      if (width >= 100) {
        clearInterval(interval);
        
        // Simulate completion after 100%
        setTimeout(() => {
          fileInfo.textContent = 'Upload complete! Analyzing resume...';
          fileInfo.style.color = '#38a169';
          
          // Simulate processing
          setTimeout(() => {
            fileInfo.textContent = 'Resume successfully processed! Redirecting...';
            
            // You would typically redirect here or show results
            // For demo purposes, we'll just reset after 2 seconds
            setTimeout(() => {
              resetUploadState();
            }, 2000);
          }, 1500);
        }, 500);
      } else {
        width += 2;
        progress.style.width = width + '%';
      }
    }, 50);
  }
  
  // Format file size to readable format
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Reset the upload state
  function resetUploadState() {
    fileInput.value = '';
    fileInfo.textContent = '';
    progressBar.style.display = 'none';
    progress.style.width = '0%';
  }
}
document.querySelectorAll('.nav-links a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
      // Ensure href starts with #
      if (this.getAttribute('href').startsWith("#")) {
          e.preventDefault();

          const targetId = this.getAttribute('href'); // Get section ID
          const targetElement = document.querySelector(targetId);

          if (targetElement) {
              targetElement.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
              });
          }
      }
  });
});