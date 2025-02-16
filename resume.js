// to adapt to your needs, check for comments
// HINT: (MacOS) cmd + f ; (Windows) ctrl + f => "//" (do not input the quotes)
// I have tried to keep my naming convention intuitive, at least to me (at least when the project is recent LOL)
var activeFilter = null;
var previousFilter = null;

async function updateVersion(version_type) {
    try {
        let response = await fetch("/update-resume-version-clicks", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ type: version_type })
        });
        let result = await response.json();

        await getViewMetrics();
    } catch (error) {
        console.error("Error updating the version_button:", error);
    }
}

async function updateFilter(filterType) {
    try {
        let resonse = await fetch("/update-resume-filter-clicks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filter: filterType })
        });
        let result = await response.json();
        console.log("Filter update:", result.filters);
    } catch(error) {
        console.error("Error updating filter_button:", error);
    }
}

async function getViewMetrics() {
    try {
        let response = await fetch("/get_view_metrics_resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        let data = await response.json();
        console.log("Metric view acquired");

        document.getElementById("total-visits").textContent = data.total_visits;
        document.getElementById("html-views").textContent = data.html;
        document.getElementById("pdf-views").textContent = data.pdf;
    } catch (error) {
        console.error("Error getting metric:", error);
    }
}

document.addEventListener("DOMContentLoaded", getViewMetrics);

function toggleResume() {
    let resumeContainer = document.querySelector('.resume-container');
    let pdfContainer = document.querySelector('.pdf-container');
    let button = document.querySelector('.pdf-button');
    let queryButtons = document.querySelectorAll('.filter-button');
    let queryResultButton = document.querySelector('.query_result');
    let listItems = document.querySelectorAll('li span');
    let foot = document.querySelector('.footer');
    let search_filter = document.getElementById('searchInput');

    queryResultButton.style.display = "none";

    // if (currently @ HTML format) ; going to PDF format
    if (resumeContainer.style.display === 'none') {
        resumeContainer.style.display = 'block';
        pdfContainer.style.display = 'none';
        button.textContent = 'PDF Version';
        button.style.backgroundColor = '#ff0000';

        document.querySelector(".filter-buttons").style.display = 'inline-block';
        queryButtons.forEach(button => {
            button.style.display = 'inline-block';
            button.classList.remove("active");
        });

        listItems.forEach(item => {
            item.classList.remove("highlight-python", "highlight-frontend", "highlight-c-sharp", "highlight-db", "highlight-power", "highlight-devops", "highlight-input");
        });
        
        foot.style.paddingTop = '30px';
        foot.style.paddingBottom = '10px';
        updateVersion("html");
    } else {
        resumeContainer.style.display = 'none';
        pdfContainer.style.display = 'block';
        button.textContent = 'HTML Version';
        button.style.backgroundColor = '#005eff';
        pdfContainer.src = 'static/TASE.pdf#navpanes=1&zoom=Auto';
        search_filter.value = '';

        document.querySelector(".filter-buttons").style.display = 'none';

        activeFilter = null;
        foot.style.paddingTop = '15px';
        foot.style.paddingBottom = '0px';
        updateVersion("pdf");
    }

    getViewMetrics();
}

function filterKeywords(button) {
    const keywordClasses = {
        'highlight-python': ['py', 'py-db', 'py-po', 'py-fe', 'py-fe-db'],
        'highlight-frontend': ['fe', 'fe-po', 'fe-db-po', 'py-fe', 'py-fe-db'],
        'highlight-c-sharp': ['c-db', 'c-dev'],
        'highlight-db': ['db', 'db-po', 'c-db', 'py-db', 'py-fe-db', 'fe-db-po'],
        'highlight-power': ['po', 'po-dev', 'py-po', 'fe-po', 'fe-db-po', 'db-po'],
        'highlight-devops': ['dev', 'c-dev', 'po-dev']
    };
    let filterType = button.getAttribute("data-filter");
    let queryResultButton = document.querySelector(".query_result");
    if (previousFilter !== null) {
        let previousListItems = document.querySelectorAll("." + previousFilter);
        previousListItems.forEach( item => {
            item.classList.remove("data-action", previousFilter);
        });

        queryResultButton.style.display = "none";
        let activeQueryButton = document.querySelector(".active");
        activeQueryButton.classList.remove("active");

        if (filterType === previousFilter ){
            previousFilter = null;
            return;
        }
    }

    let search_filter = document.getElementById('searchInput');
    if (search_filter.value !== ''){
        search_filter.value = '';
        let stringFiltered = document.querySelectorAll("li span");
        stringFiltered.forEach( line => {
            line.classList.remove("highlight-input");
        })
    }

    var lineCount = 0;
    let filters = keywordClasses[filterType];
    previousFilter = filterType;
    activeFilter = filterType;
    for (let filter of filters) {
        let listItems = document.querySelectorAll("." + filter);
        listItems.forEach( item => {
            item.classList.add("data-action", filterType);
            lineCount++;
        });
    }
    queryResultButton.style.display = "block";
    button.classList.add("active");

    let totalLines = document.querySelectorAll("li span").length;
    let s = lineCount === 1 ? '' : 's';
    var lineRate = ((lineCount / totalLines) * 100).toFixed(1);

    document.getElementById("lineCount").textContent = lineCount;
    document.getElementById("s").textContent = s;
    document.getElementById("lineRate").textContent = lineRate;
    
    const filterTypeName = {
        'highlight-python': 'python',
        'highlight-frontend': 'frontend',
        'highlight-c-sharp': 'c_sharp',
        'highlight-db': 'db',
        'highlight-power': 'power',
        'highlight-devops': 'devops'
    };
    updateFilter(filterTypeName[filterType]);
}

function filterByUserInput(userInput) {
    let listItems = document.querySelectorAll("li span");
    let totalLines = listItems.length;
    let queryResultButton = document.querySelector(".query_result");

    // optimize
    // WHY: is this interfering with the highlighting
    // let activeQueryButton = document.querySelector(".active");
    //activeQueryButton.classList.remove("active");

    const filterString = userInput.trim().toLowerCase();
    let lineCount = 0;

    listItems.forEach(item => {
        // optimize, search what is the current ? previous filter
        item.classList.remove("highlight-python", "highlight-frontend", "highlight-c-sharp", "highlight-db", "highlight-power", "highlight-devops", "highlight-input");
    });

    if (filterString === "") {
        queryResultButton.style.display = "none";
        return;
    }

    listItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(filterString)) {
            item.classList.add("highlight-input");
            lineCount++;
        }
    });

    if (lineCount == 1) {
        var s = '';
    } else {
        var s = 's'
    }
    var lineRate = ((lineCount / totalLines) * 100).toFixed(1);

    document.getElementById("lineCount").textContent = lineCount;
    document.getElementById("s").textContent = s;
    document.getElementById("lineRate").textContent = lineRate;

    queryResultButton.style.display = "block";
    activeFilter = filterString;
}

async function toLink(link) {
    event.preventDefault();

    const link_dict = {
        'linkedin' : 'l'
    } 
    let response = await fetch("/links_clicked_metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_name: link })
    });

    let result = await response.json();
    console.log("Link metric updated:", result);

    window.open(document.getElementById(link).href, '_blank');
}