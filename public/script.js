// --- ENHANCED LOGGING SYSTEM ---
/**
 * Advanced logging utility with different log levels and timestamps
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
function log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[Proposal Portal][${timestamp}][${level.toUpperCase()}]`;
    
    switch (level) {
        case 'warn':
            console.warn(`${prefix} ${message}`);
            break;
        case 'error':
            console.error(`${prefix} ${message}`);
            break;
        default:
            console.log(`${prefix} ${message}`);
    }
}

log("Script loaded. Initializing application...");

// --- Global Variables ---
let isAdmin = false; // Track admin login status
let formFieldsConfig = null; // Store form configuration from backend

// --- DOM Elements ---
// Get references to various elements needed for the script
const form = document.getElementById('proposalForm');
const budgetItemsContainer = document.getElementById('budgetItemsContainer');
const addBudgetItemBtn = document.getElementById('addBudgetItemBtn');
const stakeholdersContainer = document.getElementById('stakeholdersContainer');
const addStakeholderBtn = document.getElementById('addStakeholderBtn');
const budgetTotalInput = document.getElementById('budgetTotal');
const modal = document.getElementById('proposalModal');
const projectIDDisplay = document.getElementById('projectIDDisplay');
const formattedProposalText = document.getElementById('formattedProposalText');
const copyButton = document.getElementById('copyButton');
const adminProjectIDInput = document.getElementById('adminProjectID');

// Login simulation elements
const loginForm = document.getElementById('loginForm');
const loggedInMessage = document.getElementById('loggedInMessage');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');


// --- Word Count Configuration ---
// Define fields that require word count validation and their limits
const wordCountFields = [
    { id: 'projectTitle', limit: 20 },
    { id: 'abstract', limit: 200 },
    { id: 'introduction', limit: 500 },
    { id: 'objectives', limit: 100 },
    { id: 'methodology', limit: 500 },
    { id: 'timeline', limit: 300 },
    { id: 'outcomes', limit: 200 },
    { id: 'references', limit: 300 },
];

// --- API Integration ---
const API_URL = window.location.origin;

/**
 * Fetches form field configuration from the backend
 * @returns {Promise<Object>} Form fields configuration
 */
async function fetchFormConfiguration() {
    try {
        const response = await fetch(`${API_URL}/api/proposals/form-fields`);
        if (!response.ok) {
            throw new Error('Failed to fetch form configuration');
        }
        
        const result = await response.json();
        if (result.success) {
            log("Form configuration fetched successfully");
            return result.data;
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (error) {
        log(`Error fetching form configuration: ${error.message}`);
        return null;
    }
}

/**
 * Applies form field configuration from the backend
 * @param {Object} config - Form fields configuration
 */
function applyFormConfiguration(config) {
    if (!config) return;
    
    formFieldsConfig = config;
    
    // Update word count fields based on configuration
    if (formFieldsConfig) {
        const updatedWordCountFields = [];
        
        // Iterate through all sections and fields
        Object.values(formFieldsConfig).forEach(section => {
            section.forEach(field => {
                if (field.word_limit) {
                    updatedWordCountFields.push({
                        id: field.field_name,
                        limit: field.word_limit
                    });
                    
                    // Update any existing elements in the DOM
                    const element = document.getElementById(field.field_name);
                    if (element) {
                        element.dataset.wordLimit = field.word_limit;
                        // Update label if it exists
                        const label = document.querySelector(`label[for="${field.field_name}"]`);
                        if (label) {
                            // Update label text while preserving any required asterisk
                            let labelText = field.field_label;
                            if (!labelText.includes('*')) {
                                labelText = field.required ? labelText + '*' : labelText;
                            }
                            label.textContent = labelText;
                        }
                    }
                }
            });
        });
        
        // Replace the default word count fields with updated ones from backend
        if (updatedWordCountFields.length > 0) {
            wordCountFields.length = 0;
            updatedWordCountFields.forEach(field => {
                wordCountFields.push(field);
            });
        }
        
        // Re-initialize word count listeners
        initWordCountListeners();
    }
}

/**
 * Makes an API call to submit the proposal form
 * @param {FormData} formData - The form data to submit
 * @returns {Promise<Object>} The response from the server
 */
async function submitProposal(formData) {
    try {
        const response = await fetch(`${API_URL}/api/proposals`, {
            method: 'POST',
            body: formData // FormData sends as multipart/form-data for file uploads
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        log(`Error submitting proposal: ${error.message}`);
        throw error;
    }
}

/**
 * Makes an API call to login as admin
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<Object>} The login response
 */
async function loginAdmin(username, password) {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // Important for cookies
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        log(`Login error: ${error.message}`);
        throw error;
    }
}

/**
 * Makes an API call to logout admin
 * @returns {Promise<Object>} The logout response
 */
async function logoutAdmin() {
    try {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include' // Important for cookies
        });
        
        if (!response.ok) {
            throw new Error(`Server error ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        log(`Logout error: ${error.message}`);
        throw error;
    }
}

/**
 * Checks if the user is already logged in as admin
 * @returns {Promise<boolean>} True if logged in
 */
async function checkAdminLoginStatus() {
    try {
        const response = await fetch(`${API_URL}/api/auth/verify`, {
            credentials: 'include' // Important for cookies
        });
        
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        return data.isAuthenticated === true;
    } catch (error) {
        log(`Authentication check error: ${error.message}`);
        return false;
    }
}

// --- Event Listeners ---
// Attach event listeners to buttons and containers
if (addBudgetItemBtn) addBudgetItemBtn.addEventListener('click', addBudgetItem);
if (addStakeholderBtn) addStakeholderBtn.addEventListener('click', addStakeholder);
if (form) form.addEventListener('submit', handleFormSubmit);
// Use event delegation for budget cost inputs for efficiency
if (budgetItemsContainer) budgetItemsContainer.addEventListener('input', handleBudgetInput);
if (copyButton) copyButton.addEventListener('click', copyToClipboard);
if (loginButton) loginButton.addEventListener('click', handleLogin);
if (logoutButton) logoutButton.addEventListener('click', handleLogout);

// Add word count listeners to specified fields
wordCountFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
        element.addEventListener('input', () => updateWordCount(element, field.limit));
        updateWordCount(element, field.limit); // Initial count check on page load
    } else {
        log(`Warning: Element with ID "${field.id}" not found for word count.`);
    }
});

// --- Functions ---

/**
 * Handles the simulated admin login.
 * WARNING: Basic Simulation ONLY - Not Secure!
 * @function handleLogin
 */
async function handleLogin() {
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert("Please enter username and password");
        return;
    }
    
    try {
        // Backend login (for production)
        const loginResult = await loginAdmin(username, password);
        if (loginResult.success) {
            log("Admin login successful.");
            isAdmin = true;
            document.body.classList.add('admin-logged-in'); // Add class to body
            loginForm.classList.add('hidden'); // Hide login form
            loggedInMessage.classList.remove('hidden'); // Show logged-in message
            passwordInput.value = ''; // Clear password field
        } else {
            throw new Error("Login failed");
        }
    } catch (error) {
        // Fallback to simulation for development without backend
        if (username === 'admin' && password === 'password') {
            log("Admin login successful (simulation).");
            document.body.classList.add('admin-logged-in'); // Add class to body
            loginForm.classList.add('hidden'); // Hide login form
            loggedInMessage.classList.remove('hidden'); // Show logged-in message
        } else {
            log("Admin login failed.");
            alert("Invalid credentials (Use admin/password for demo).");
        }
        passwordInput.value = ''; // Clear password field
    }
}

/**
 * Handles the simulated admin logout.
 * @function handleLogout
 */
async function handleLogout() {
    try {
        // Backend logout (for production)
        await logoutAdmin();
        isAdmin = false;
    } catch (error) {
        log("Error logging out or using simulation mode");
    }
    
    // Always perform these UI updates
    log("Admin logout.");
    document.body.classList.remove('admin-logged-in'); // Remove class from body
    loggedInMessage.classList.add('hidden'); // Hide logged-in message
    loginForm.classList.remove('hidden'); // Show login form
    usernameInput.value = ''; // Clear username on logout
}


/**
 * Adds a new dynamic row for entering budget items, including justification.
 * @function addBudgetItem
 */
function addBudgetItem() {
    log("Adding new budget item row.");
    const newRow = document.createElement('div');
    newRow.className = 'dynamic-row'; // Uses CSS grid layout defined in style.css
    // HTML structure for the new budget item row
    newRow.innerHTML = `
        <input type="text" name="budgetItem[]" class="form-input" placeholder="Item Description">
        <input type="number" name="budgetCost[]" class="form-input w-32" placeholder="Cost" step="any" min="0">
        <button type="button" class="remove-row-btn" onclick="removeRow(this, true)">
            <i class="fas fa-trash-alt" aria-hidden="true"></i> <span class="sr-only">Remove Budget Item</span> </button>
        <div class="budget-justification">
            <label class="block text-xs font-medium text-text-label mb-1">Justification*</label>
            <textarea name="budgetJustificationItem[]" rows="2" class="form-input text-sm" placeholder="Why is this item needed?" required></textarea>
        </div>
    `;
    budgetItemsContainer.appendChild(newRow);
    calculateTotalBudget(); // Recalculate total after adding
}

/**
 * Adds a new dynamic row for entering stakeholders with a role dropdown.
 * @function addStakeholder
 */
function addStakeholder() {
    log("Adding new stakeholder row.");
    const newRow = document.createElement('div');
    newRow.className = 'dynamic-row-stakeholder'; // Uses CSS grid layout
    // HTML structure for the new stakeholder row
    newRow.innerHTML = `
        <input type="text" name="stakeholderName[]" class="form-input" placeholder="Stakeholder Name/Group">
        <select name="stakeholderRole[]" class="form-input">
            <option value="" disabled selected>Select Role/Interest</option>
            <option value="Supervisor">Supervisor/Mentor</option>
            <option value="Client">Client/Customer</option>
            <option value="End User">End User</option>
            <option value="Team Member">Team Member</option>
            <option value="Department Head">Department Head</option>
            <option value="External Collaborator">External Collaborator</option>
            <option value="Funding Body">Funding Body</option>
            <option value="Other">Other</option>
        </select>
        <button type="button" class="remove-row-btn" onclick="removeRow(this, false)">
            <i class="fas fa-trash-alt" aria-hidden="true"></i>
            <span class="sr-only">Remove Stakeholder</span>
        </button>
    `;
    stakeholdersContainer.appendChild(newRow);
}

/**
 * Removes the parent row (budget item or stakeholder) of the clicked button.
 * Uses closest() to find the correct parent element based on class.
 * @param {HTMLButtonElement} button - The remove button that was clicked.
 * @param {boolean} isBudgetItem - Flag to indicate if it's a budget item row (for recalculation).
 * @function removeRow
 */
function removeRow(button, isBudgetItem) {
    // Find the closest ancestor element that is a dynamic row
    const row = button.closest('.dynamic-row, .dynamic-row-stakeholder');
    if (row) {
        log(`Removing row: ${isBudgetItem ? 'Budget Item' : 'Stakeholder'}`);
        row.remove(); // Remove the row element from the DOM
        // If a budget item was removed, recalculate the total budget
        if (isBudgetItem) {
            calculateTotalBudget();
        }
    } else {
        // Log an error if the parent row couldn't be found (shouldn't normally happen)
        log("Error: Could not find parent row to remove.");
    }
}

/**
 * Handles input events within the budget container (event delegation).
 * Recalculates total budget only if a cost input changed.
 * @param {Event} event - The input event.
 * @function handleBudgetInput
 */
function handleBudgetInput(event) {
     // Check if the event target exists and is a budget cost input field
     if (event.target && event.target.matches('input[name="budgetCost[]"]')) {
         log("Budget cost input changed, recalculating total.");
         calculateTotalBudget(); // Trigger recalculation
     }
}


/**
 * Calculates the total budget by summing up all budget item costs.
 * Updates the read-only total budget input field.
 * @function calculateTotalBudget
 */
function calculateTotalBudget() {
    // Select all input fields for budget costs within the container
    const costInputs = budgetItemsContainer.querySelectorAll('input[name="budgetCost[]"]');
    let total = 0;
    // Iterate over each cost input field
    costInputs.forEach(input => {
        // Parse the value as a float, default to 0 if empty or invalid
        const cost = parseFloat(input.value) || 0;
        total += cost; // Add the cost to the total
    });
    // Update the value of the total budget display field, formatted to 2 decimal places
    budgetTotalInput.value = total.toFixed(2);
    log(`Calculated total budget: ${total.toFixed(2)}`);
}

/**
 * Counts words in a given textarea or input element and updates its associated display element.
 * Also applies styling if the word count exceeds the limit.
 * @param {HTMLTextAreaElement|HTMLInputElement} element - The input/textarea element.
 * @param {number} limit - The word limit for this field.
 * @function updateWordCount
 */
function updateWordCount(element, limit) {
    const text = element.value.trim(); // Get text content, remove leading/trailing whitespace
    // Simple word count: split by one or more whitespace characters, filter out empty strings
    const wordCount = text === '' ? 0 : text.split(/\s+/).filter(Boolean).length;
    // Find the corresponding display element (e.g., 'abstract-word-count' for 'abstract')
    const displayElement = document.getElementById(`${element.id}-word-count`);

    if (displayElement) {
        // Update the text content of the display element
        displayElement.textContent = `${wordCount} / ${limit} words`;
        // Add or remove 'limit-exceeded' class based on comparison with the limit
        displayElement.classList.toggle('limit-exceeded', wordCount > limit);
        // Optionally change border color of the input element itself
        element.style.borderColor = wordCount > limit ? '#DC2626' : ''; // Use red border if exceeded
    } else {
         // Log a warning if the display element wasn't found
         log(`Warning: Word count display element for ID "${element.id}-word-count" not found.`);
    }
}

/**
 * Validates word counts for all fields defined in wordCountFields.
 * Checks if any field exceeds its limit.
 * @returns {boolean} True if all counts are within limits, false otherwise.
 * @function validateWordCounts
 */
function validateWordCounts() {
    let allValid = true; // Assume valid initially
    log("Validating word counts...");
    // Iterate through each field configured for word count validation
    for (const field of wordCountFields) {
        const element = document.getElementById(field.id);
         if (!element) continue; // Skip if element doesn't exist

        const text = element.value.trim();
        const wordCount = text === '' ? 0 : text.split(/\s+/).filter(Boolean).length;

        // Check if the current field exceeds its limit
        if (wordCount > field.limit) {
            log(`Validation failed: Field "${field.id}" exceeds limit (${wordCount}/${field.limit}).`);
            allValid = false; // Mark validation as failed
            // Apply visual indication of error
            element.style.borderColor = '#DC2626'; // Red border
            const displayElement = document.getElementById(`${field.id}-word-count`);
            if(displayElement) displayElement.classList.add('limit-exceeded'); // Ensure count text is red
        } else {
             // Ensure visual indication is removed if valid
             element.style.borderColor = ''; // Reset border
             const displayElement = document.getElementById(`${field.id}-word-count`);
            if(displayElement) displayElement.classList.remove('limit-exceeded'); // Ensure count text is normal
        }
    }
     // If any field failed validation, show an alert message
     if (!allValid) {
         alert("One or more sections exceed the specified word limit. Please review the highlighted fields.");
     }
    return allValid; // Return overall validation status
}


/**
 * Handles the form submission event.
 * Performs validation, collects data, formats it, and displays the modal.
 * In a real application, this would send data to a backend.
 * @param {Event} event - The form submission event.
 * @function handleFormSubmit
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default browser form submission
    log("Form submission initiated.");

     // 1. Perform HTML5 built-in validation first
     if (!form.checkValidity()) {
        log("HTML5 validation failed.");
        form.reportValidity(); // Display browser's validation messages
        return; // Stop submission
    }
    // 2. Perform custom word count validation
    if (!validateWordCounts()) {
         log("Word count validation failed.");
         return; // Stop submission if limits exceeded
    }

    // 3. Get Admin Assigned Project ID (ensure it's provided)
    const projectID = adminProjectIDInput.value.trim();
    if (!projectID) {
        log("Validation failed: Admin Project ID is required.");
        alert("Admin Assigned Project ID is required.");
        adminProjectIDInput.focus(); // Focus the field for user convenience
        return; // Stop submission
    }
    projectIDDisplay.textContent = projectID; // Display ID in modal later
    log(`Using Project ID: ${projectID}`);

    // Display loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        // Create FormData object for submission (handles file uploads)
        const formData = new FormData(form);
        
        // 4. Backend Submission
        const result = await submitProposal(formData);
        
        if (result.success) {
            log("Proposal submitted successfully!");
            
            // Display success
            projectIDDisplay.textContent = result.projectId || projectID;
            
            // Format proposal text for display (using existing function)
            const data = collectFormData();
            const formattedText = formatProposalAsText(projectID, data);
            formattedProposalText.value = formattedText;
            
            // Show modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Optional: Reset form if submission was successful
            // form.reset();
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (error) {
        log(`Submission error: ${error.message}`);
        alert(`Error submitting proposal: ${error.message}`);
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

/**
 * Collects and structures all form data
 * @returns {Object} The structured form data
 * @function collectFormData
 */
function collectFormData() {
    const formData = new FormData(form);
    const data = {};
    
    // Collect standard fields
    ['studentName', 'studentId', 'sapCode', 'college', 'studentEmail', 'course', 'supervisor', 
     'supervisorEmail', 'projectTitle', 'abstract', 'introduction', 'objectives', 'methodology', 
     'timeline', 'outcomes', 'references'].forEach(key => {
        data[key] = formData.get(key)?.trim() || 'N/A';
    });
    
    // Collect budget items
    data.budgetItems = [];
    const budgetDescriptions = formData.getAll('budgetItem[]');
    const budgetCosts = formData.getAll('budgetCost[]');
    const budgetJustifications = formData.getAll('budgetJustificationItem[]');
    
    for (let i = 0; i < budgetDescriptions.length; i++) {
        if (budgetDescriptions[i]?.trim() || budgetCosts[i]?.trim() || budgetJustifications[i]?.trim()) {
            data.budgetItems.push({
                item: budgetDescriptions[i]?.trim() || 'N/A',
                cost: parseFloat(budgetCosts[i] || 0).toFixed(2),
                justification: budgetJustifications[i]?.trim() || 'N/A'
            });
        }
    }
    data.budgetTotal = budgetTotalInput.value;
    
    // Collect stakeholders
    data.stakeholders = [];
    const stakeholderNames = formData.getAll('stakeholderName[]');
    const stakeholderRoles = formData.getAll('stakeholderRole[]');
    
    for (let i = 0; i < stakeholderNames.length; i++) {
        if (stakeholderNames[i]?.trim() || stakeholderRoles[i]?.trim()) {
            data.stakeholders.push({
                name: stakeholderNames[i]?.trim() || 'N/A',
                role: stakeholderRoles[i] || 'N/A'
            });
        }
    }
    
    return data;
}

/**
 * Formats the collected proposal data into a structured, readable text string.
 * @param {string} projectID - The admin-assigned project ID.
 * @param {object} data - The collected form data object.
 * @returns {string} The formatted proposal text.
 * @function formatProposalAsText
 */
function formatProposalAsText(projectID, data) {
    // Build the text string section by section
    let text = `PROJECT PROPOSAL\n`;
    text += `========================================\n\n`;
    text += `Project ID: ${projectID}\n\n`;

    text += `--- STUDENT/TEAM INFORMATION ---\n`;
    text += `Name(s): ${data.studentName}\n`;
    text += `Student ID(s): ${data.studentId}\n`;
    text += `SAP Code: ${data.sapCode}\n`;
    text += `College: ${data.college}\n`;
    text += `Student Email: ${data.studentEmail}\n`;
    text += `Course/Department: ${data.course}\n`;
    text += `Supervisor Name: ${data.supervisor}\n`;
    text += `Supervisor Email: ${data.supervisorEmail}\n\n`;

    text += `--- PROJECT DETAILS ---\n`;
    text += `Title: ${data.projectTitle}\n\n`;
    text += `Abstract/Summary:\n${data.abstract}\n\n`;
    text += `----INTRODUCION---\n`;
    text += `Does ${data.projectTitle} align with the problem statement?\n`;
    text += `Yes, ${data.projectTitle} aims to provide a solution to the problem statement\n\n`;
    text += `Introduction/Background:\n${data.introduction}\n\n`;
    text += `Objectives:\n${data.objectives}\n\n`;
    text += `Methodology:\n${data.methodology}\n\n`;
    text += `Timeline/Schedule:\n${data.timeline || 'N/A'}\n\n`; // Handle optional timeline
    text += `Expected Outcomes/Deliverables:\n${data.outcomes}\n\n`;

    text += `--- BUDGET ---\n`;
    if (data.budgetItems.length > 0) {
        data.budgetItems.forEach(item => {
            text += `- Item: ${item.item}\n`;
            text += `  Cost: ${item.cost}\n`;
            text += `  Justification: ${item.justification}\n\n`;
        });
    } else {
        text += `No specific budget items listed.\n\n`;
    }
    text += `Estimated Total Cost: ${data.budgetTotal}\n\n`;

    text += `--- STAKEHOLDERS ---\n`;
     if (data.stakeholders.length > 0) {
        data.stakeholders.forEach(stakeholder => {
            text += `- Name/Group: ${stakeholder.name}\n  Role/Interest: ${stakeholder.role}\n\n`;
        });
    } else {
        text += `No specific stakeholders listed.\n\n`;
    }

    text += `--- REFERENCES ---\n`;
    text += `${data.references || 'No references provided.'}\n\n`; // Handle optional references

    text += `========================================\n`;
    text += `End of Proposal\n`;
    text += `Note: Your proposal has been submitted to the system and is being processed by our AI assistant.\n`;
    text += `You will receive an email with detailed feedback soon.\n`;

    return text;
}

/**
 * Closes the results modal and resets related elements.
 * @function closeModal
 */
function closeModal() {
    log("Closing modal.");
    modal.style.display = 'none'; // Hide the modal
    document.body.style.overflow = 'unset'; // Restore background scrolling
    // Clear potentially sensitive info from modal elements for security/privacy
    formattedProposalText.value = '';
    projectIDDisplay.textContent = '';
    // Reset copy button state
    copyButton.textContent = 'Copy Text';
    copyButton.disabled = false;
}

/**
 * Copies the formatted proposal text from the modal's textarea to the clipboard.
 * Uses modern Clipboard API with fallback to deprecated execCommand.
 * @function copyToClipboard
 */
function copyToClipboard() {
    log("Attempting to copy text to clipboard...");
    formattedProposalText.select(); // Select the text in the textarea
    formattedProposalText.setSelectionRange(0, 99999); // For mobile devices compatibility

    try {
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(formattedProposalText.value).then(() => {
                log("Text copied successfully using Clipboard API.");
                copyButton.textContent = 'Copied!'; // Provide visual feedback
                copyButton.disabled = true; // Temporarily disable button
                // Reset button after a short delay
                setTimeout(() => {
                    copyButton.textContent = 'Copy Text';
                    copyButton.disabled = false;
                }, 2000);
            }).catch(err => {
                 // Log error and attempt fallback if Clipboard API fails
                 log(`Clipboard API copy failed: ${err}`);
                 fallbackCopy();
            });
        } else {
             // Use deprecated execCommand as fallback if Clipboard API not supported
             log("Clipboard API not available, using fallback execCommand.");
             fallbackCopy();
        }
    } catch (err) {
        // Catch any unexpected errors during the copy attempt
        log(`Error during copy attempt: ${err}`);
        alert('Failed to copy text automatically. Please select and copy manually.'); // Inform user
    }
}

/**
 * Fallback copy method using the deprecated document.execCommand('copy').
 * @function fallbackCopy
 */
function fallbackCopy() {
     try {
        const successful = document.execCommand('copy'); // Execute copy command
        if (successful) {
             log("Text copied successfully using execCommand.");
            copyButton.textContent = 'Copied!'; // Provide visual feedback
            copyButton.disabled = true; // Temporarily disable button
            // Reset button after a short delay
            setTimeout(() => {
                copyButton.textContent = 'Copy Text';
                copyButton.disabled = false;
            }, 2000);
        } else {
            // execCommand might return false if it failed
            log("execCommand copy failed.");
            alert('Failed to copy text automatically. Please select and copy manually.');
        }
    } catch (err) {
         // Catch errors specific to execCommand
         log(`execCommand copy error: ${err}`);
        alert('Failed to copy text automatically. Please select and copy manually.');
    }
}


// --- Global Event Listener ---
// Close modal if user clicks outside of the modal content area
window.onclick = function(event) {
    if (event.target == modal) { // Check if the click target is the modal backdrop itself
        log("Clicked outside modal content, closing modal.");
        closeModal();
    }
}

// --- Initial Setup ---
// Run necessary functions when the script loads
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is already logged in as admin
    try {
        isAdmin = await checkAdminLoginStatus();
        if (isAdmin) {
            document.body.classList.add('admin-logged-in');
            loginForm.classList.add('hidden');
            loggedInMessage.classList.remove('hidden');
        }
    } catch (error) {
        log("Error checking login status");
    }

    // Initialize form configuration from backend
    try {
        const config = await fetchFormConfiguration();
        if (config) {
            applyFormConfiguration(config);
        }
    } catch (error) {
        log("Using default form configuration");
    }
    
    // Add initial budget item and stakeholder if containers exist
    if (budgetItemsContainer) addBudgetItem();
    if (stakeholdersContainer) addStakeholder();
    
    // Calculate initial budget (which will be 0 if no default values)
    if (budgetTotalInput) calculateTotalBudget();
    
    // Attach event listeners
    if (addBudgetItemBtn) addBudgetItemBtn.addEventListener('click', addBudgetItem);
    if (addStakeholderBtn) addStakeholderBtn.addEventListener('click', addStakeholder);
    if (form) form.addEventListener('submit', handleFormSubmit);
    if (budgetItemsContainer) budgetItemsContainer.addEventListener('input', handleBudgetInput);
    if (copyButton) copyButton.addEventListener('click', copyToClipboard);
    if (loginButton) loginButton.addEventListener('click', handleLogin);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    
    // Admin edit icons (visible when logged in)
    document.querySelectorAll('.admin-only-icon').forEach(icon => {
        icon.addEventListener('click', handleAdminEdit);
    });
    
    // Admin add field button
    document.querySelectorAll('.admin-only-button').forEach(button => {
        button.addEventListener('click', handleAddNewField);
    });

    log("Initialization complete. Page ready.");
});

// --- Admin Functions ---

/**
 * Handles when admin clicks the edit icon next to section titles
 * @param {Event} event - The click event
 * @function handleAdminEdit
 */
function handleAdminEdit(event) {
    if (!isAdmin) return;
    
    const icon = event.currentTarget;
    const sectionHeading = icon.closest('h2');
    
    if (!sectionHeading) return;
    
    const sectionName = sectionHeading.querySelector('span').textContent;
    const section = icon.closest('.form-section');
    
    // Just show an alert in the frontend demo
    // In a real implementation, this would open a modal for editing section fields
    alert(`Admin: You clicked to edit the "${sectionName}" section.\n\nIn a complete implementation, this would open a modal dialog to edit all fields in this section.`);
}

/**
 * Handles when admin clicks to add a new field
 * @param {Event} event - The click event
 * @function handleAddNewField
 */
function handleAddNewField(event) {
    if (!isAdmin) return;
    
    // Just show an alert in the frontend demo
    // In a real implementation, this would open a modal for adding a new field
    alert('Admin: You clicked to add a new field.\n\nIn a complete implementation, this would open a modal dialog to define a new form field and its properties.');
}

// --- Form Functions ---

/**
 * Initialize event listeners for word count tracking
 * @function initWordCountListeners
 */
function initWordCountListeners() {
    wordCountFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            // Remove existing listener if any
            element.removeEventListener('input', () => updateWordCount(element, field.limit));
            // Add new listener
            element.addEventListener('input', () => updateWordCount(element, field.limit));
            updateWordCount(element, field.limit); // Initial count check
        } else {
            log(`Warning: Element with ID "${field.id}" not found for word count.`);
        }
    });
}


// JavaScript code to handle the proposal form submission, word count, and modal display
        document.addEventListener('DOMContentLoaded', function () {
            const proposalForm = document.getElementById('proposalForm');
            const proposalModal = document.getElementById('proposalModal');
            const formattedProposalText = document.getElementById('formattedProposalText');
            const projectIDDisplay = document.getElementById('projectIDDisplay');
            const copyButton = document.getElementById('copyButton');

            // Function to calculate word count
            function updateWordCount(textarea) {
                const wordLimit = parseInt(textarea.dataset.wordLimit);
                const wordCount = textarea.value.split(/\s+/).filter(word => word.length > 0).length;
                const wordCountDisplay = textarea.nextElementSibling;
                wordCountDisplay.textContent = `${wordCount} / ${wordLimit} words`;
                if (wordCount > wordLimit) {
                    textarea.classList.add('border-red-500');
                    wordCountDisplay.classList.add('text-red-500');
                } else {
                    textarea.classList.remove('border-red-500');
                    wordCountDisplay.classList.remove('text-red-500');
                }
            }
            // Function to handle form submission
        })

/** Tailwind config */
window.tailwind = {};
window.tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'dominant-bg': '#F0F8FF', // AliceBlue
                        'dominant-bg-alt': '#FFFFFF', // White
                        'secondary-bg': '#E0F2FE', // sky-100
                        'secondary-border': '#7DD3FC', // sky-300
                        'secondary-text': '#0369A1', // sky-800
                        'secondary-accent': '#38BDF8', // sky-400
                        'accent-main': '#F59E0B', // amber-500
                        'accent-hover': '#D97706', // amber-600
                        'accent-text': '#92400E', // amber-800
                        'text-primary': '#1f2937', // gray-800
                        'text-secondary': '#4b5563', // gray-600
                        'text-label': '#374151', // gray-700
                    }
                }
            }
        }