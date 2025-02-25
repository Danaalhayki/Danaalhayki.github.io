// Helper function to create SVG element
function createSVG(width, height) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    return svg;
}

// Draw audit ratio pie chart
function drawAuditRatioPieChart(totalUp, totalDown) {
    let totalDownInMB = (totalDown / 1000000).toFixed(2); 
            let totalupInMB = (totalUp / 1000000).toFixed(2);
    const container = document.getElementById('auditGraph');
    container.innerHTML = '<h3>Audit Ratio</h3>';
    
    const size = 200;
    const svg = createSVG(size, size);
    const center = size / 2;
    const radius = size / 2 - 10;
    
    const total = totalUp + totalDown || 1; // Prevent division by zero
    const upRatio = totalUp / total;
    
    // Calculate angles for the pie slices
    const upAngle = upRatio * 2 * Math.PI;
    
    // Create pie slices
    const createSlice = (startAngle, endAngle, color) => {
        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);
        
        const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
        
        const d = [
            "M", center, center,
            "L", x1, y1,
            "A", radius, radius, 0, largeArcFlag, 1, x2, y2,
            "Z"
        ].join(" ");
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", color);
        return path;
    };
    
    svg.appendChild(createSlice(0, upAngle, "#4CAF50"));
    svg.appendChild(createSlice(upAngle, 2 * Math.PI, "#F44336"));
    
    // Add legend
    const legend = document.createElement('div');
    legend.innerHTML = `
        <div style="margin-top: 10px;">
            <span style="color: #4CAF50">■</span> Up: ${totalupInMB}
            <span style="color: #F44336; margin-left: 10px;">■</span> Down: ${totalDownInMB}
        </div>
    `;
    
    container.appendChild(svg);
    container.appendChild(legend);
}

// Function to draw XP by Project bar chart
function drawXPByProjectGraph(transactions) {
    const container = document.getElementById('xpGraph');
    container.innerHTML = '<h3>Top 10 Projects by XP</h3>';
    
    const width = 900;
    const height = 400;
    const padding = { top: 40, right: 40, bottom: 100, left: 60 };
    
    // Filter and group XP by project
    const projectXP = transactions
        .filter(t => t.type === 'xp' && t.path.includes('bh-module'))
        .reduce((acc, t) => {
            try {
                const pathParts = t.path.split('/');
                const projectName = pathParts[pathParts.length - 1]
                    .replace(/^project-/, '')
                    .replace(/-/g, ' ');
                acc[projectName] = (acc[projectName] || 0) + t.amount;
            } catch (error) {
                console.error('Error processing transaction:', error);
            }
            return acc;
        }, {});

    // Convert to array, sort by XP amount, and take top 10
    const projectData = Object.entries(projectXP)
        .map(([project, xp]) => ({ project, xp }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10); // Take only top 10 projects

    if (projectData.length === 0) {
        container.innerHTML += '<p>No project XP data available.</p>';
        return;
    }

    const svg = createSVG(width, height);
    
    // Calculate scales
    const maxXP = Math.max(...projectData.map(d => d.xp));
    const barWidth = 60; // Fixed bar width
    const gap = 20;      // Fixed gap between bars
    const yScale = (height - padding.top - padding.bottom) / maxXP;

    // Format XP value consistently with better rounding
    function formatXP(xp) {
        const kbValue = xp / 1000;
        let formatted;
        
        if (kbValue >= 1000) {
            // For values >= 100 kB, round to nearest whole number
            formatted = Math.round(kbValue).toString();
        } else if (kbValue >= 10) {
            // For values >= 10 kB, round to one decimal place
            formatted = kbValue.toFixed(1);
        } else {
            // For values < 10 kB, round to two decimal places
            formatted = kbValue.toFixed(2);
        }
        
        // Remove trailing zeros after decimal point
        formatted = formatted.replace(/\.?0+$/, '');
        
        return `${formatted} kB`;
    }

    // Create bars
    projectData.forEach((data, i) => {
        const barHeight = data.xp * yScale;
        const x = padding.left + i * (barWidth + gap);
        const y = height - padding.bottom - barHeight;

        // Create bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("fill", "#2196F3");
        rect.setAttribute("rx", "4");
        rect.setAttribute("ry", "4");

        // Add hover effect
        rect.addEventListener('mouseover', () => {
            rect.setAttribute("fill", "#1976D2");
            tooltip.style.display = 'block';
            tooltip.style.left = `${x + barWidth/2}px`;
            tooltip.style.top = `${y - 20}px`;
            tooltip.textContent = `${data.project}: ${formatXP(data.xp)}`;
        });
        rect.addEventListener('mouseout', () => {
            rect.setAttribute("fill", "#2196F3");
            tooltip.style.display = 'none';
        });

        svg.appendChild(rect);

        // Add project name label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x + barWidth / 2);
        text.setAttribute("y", height - padding.bottom + 20);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("transform", `rotate(-45, ${x + barWidth / 2}, ${height - padding.bottom + 20})`);
        text.textContent = data.project;
        text.style.fontSize = "12px";

        // Add XP value label
        const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueText.setAttribute("x", x + barWidth / 2);
        valueText.setAttribute("y", y - 5);
        valueText.setAttribute("text-anchor", "middle");
        valueText.textContent = formatXP(data.xp);
        valueText.style.fontSize = "12px";

        svg.appendChild(text);
        svg.appendChild(valueText);
    });

    // Add Y-axis
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", padding.left);
    yAxis.setAttribute("y1", padding.top);
    yAxis.setAttribute("x2", padding.left);
    yAxis.setAttribute("y2", height - padding.bottom);
    yAxis.setAttribute("stroke", "#333");
    svg.appendChild(yAxis);

    // Add Y-axis labels
    for (let i = 0; i <= 5; i++) {
        const yValue = maxXP * i / 5;
        const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const yPos = height - padding.bottom - (i * (height - padding.top - padding.bottom) / 5);
        yLabel.setAttribute("x", padding.left - 10);
        yLabel.setAttribute("y", yPos);
        yLabel.setAttribute("text-anchor", "end");
        yLabel.setAttribute("alignment-baseline", "middle");
        yLabel.textContent = formatXP(yValue);
        yLabel.style.fontSize = "12px";
        svg.appendChild(yLabel);
    }

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: absolute;
        display: none;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        transform: translate(-50%, -100%);
    `;

    container.style.position = 'relative';
    container.appendChild(svg);
    container.appendChild(tooltip);

    // Add total XP
    const totalXP = document.createElement('div');
    const total = projectData.reduce((sum, d) => sum + d.xp, 0);
    totalXP.innerHTML = `<div style="margin-top: 10px;">Total XP for Top 10 Projects: ${formatXP(total)}</div>`;
    container.appendChild(totalXP);
}

// Function to draw pass/fail ratio graph


// Function to draw XP progress over time
function drawXPProgressGraph(transactions) {
    const container = document.getElementById('xpProgressGraph');
    container.innerHTML = '<h3>XP Progress Over Time</h3>';
    
    const width = 900;
    const height = 400;
    const padding = { top: 40, right: 60, bottom: 60, left: 80 };

    // Filter XP transactions and sort by date
    const xpData = transactions
    .filter(t => t.type === 'xp' && t.path.includes('bh-module') && !t.path.includes('/piscine-js/'))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

console.log(xpData);
    if (xpData.length === 0) {
        container.innerHTML += '<p>No XP progress data available.</p>';
        return;
    }

    // Calculate cumulative XP
    let cumulativeXP = 0;
    const progressData = xpData.map(t => {
        let amount = t.amount;
        
        if (amount >= 1000) {
            // Step 1: Convert to a decimal number (divide by 1000)
            let amountWithDecimal = amount / 1000;
            
            // Step 2: Round it to 2 decimal places
            amountWithDecimal = Math.round(amountWithDecimal * 100) / 100;
            
            // Step 3: Convert it back to original format (multiply by 1000)
            amount = amountWithDecimal * 1000;
            
            // Ensure it's an integer after conversion
            amount = Math.round(amount);
        }
    
        cumulativeXP += amount;
        // console.log(amount); // Log the rounded and formatted value
        
        return {
            date: new Date(t.createdAt),
            xp: cumulativeXP
        };
    });
    

    const svg = createSVG(width, height);

    // Calculate scales
    const xScale = (width - padding.left - padding.right) / (progressData.length - 1);
    const yScale = (height - padding.top - padding.bottom) / cumulativeXP;

    // Format XP value
    function formatXP(xp) {
        const kbValue = xp / 1000;
        let formatted;
        
        if (kbValue >= 100) {
            formatted = Math.round(kbValue).toString();
        } else if (kbValue >= 10) {
            formatted = kbValue.toFixed(1);
        } else {
            formatted = kbValue.toFixed(2);
        }
        
        formatted = formatted.replace(/\.?0+$/, '');
        return `${formatted} kB`;
    }

    // Create the line path
    let pathD = `M ${padding.left} ${height - padding.bottom}`;
    progressData.forEach((data, i) => {
        const x = padding.left + (i * xScale);
        const y = height - padding.bottom - (data.xp * yScale);
        pathD += ` L ${x} ${y}`;
    });

    // Add grid lines
    for (let i = 0; i <= 5; i++) {
        const y = height - padding.bottom - ((height - padding.top - padding.bottom) * i / 5);
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", padding.left);
        gridLine.setAttribute("x2", width - padding.right);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "#e0e0e0");
        gridLine.setAttribute("stroke-dasharray", "4");
        svg.appendChild(gridLine);
    }

    // Create and style the line
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#2196F3");
    path.setAttribute("stroke-width", "3");
    svg.appendChild(path);

    // Add data points
    progressData.forEach((data, i) => {
        const x = padding.left + (i * xScale);
        const y = height - padding.bottom - (data.xp * yScale);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#2196F3");

        // Add hover effect
        circle.addEventListener('mouseover', () => {
            circle.setAttribute("r", "6");
            tooltip.style.display = 'block';
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y +20}px`;
            tooltip.textContent = `Date: ${data.date.toLocaleDateString()}
XP: ${formatXP(data.xp)}`;
        });

        circle.addEventListener('mouseout', () => {
            circle.setAttribute("r", "4");
            tooltip.style.display = 'none';
        });

        svg.appendChild(circle);
    });

    // Add axes
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", padding.left);
    xAxis.setAttribute("x2", width - padding.right);
    xAxis.setAttribute("y1", height - padding.bottom);
    xAxis.setAttribute("y2", height - padding.bottom);
    xAxis.setAttribute("stroke", "#333");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", padding.left);
    yAxis.setAttribute("x2", padding.left);
    yAxis.setAttribute("y1", padding.top);
    yAxis.setAttribute("y2", height - padding.bottom);
    yAxis.setAttribute("stroke", "#333");
    svg.appendChild(yAxis);

    // Add Y-axis labels
    for (let i = 0; i <= 5; i++) {
        const yValue = cumulativeXP * i / 5;
        const y = height - padding.bottom - (yValue * yScale);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", padding.left - 10);
        label.setAttribute("y", y);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("alignment-baseline", "middle");
        label.textContent = formatXP(yValue);
        label.style.fontSize = "12px";
        svg.appendChild(label);
    }

    // Add X-axis labels (dates)
    const dateLabels = [
        progressData[0].date,
        progressData[Math.floor(progressData.length / 2)].date,
        progressData[progressData.length - 1].date
    ];

    dateLabels.forEach((date, i) => {
        const x = padding.left + (i * (width - padding.left - padding.right) / 2);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x);
        label.setAttribute("y", height - padding.bottom + 20);
        label.setAttribute("text-anchor", "middle");
        label.textContent = date.toLocaleDateString();
        label.style.fontSize = "12px";
        svg.appendChild(label);
    });

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: absolute;
        display: none;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        transform: translate(-50%, -100%);
        white-space: pre;
        text-align: center;
    `;

    container.style.position = 'relative';
    container.appendChild(svg);
    container.appendChild(tooltip);
}

// Main function to draw all graphs
async function drawGraphs(userData) {
    drawAuditRatioPieChart(userData.totalUp, userData.totalDown);
    
    if (userData.transactions && userData.transactions.length > 0) {
        drawXPByProjectGraph(userData.transactions);
        drawXPProgressGraph(userData.transactions);
    }

    // if (userData.results && userData.results.length > 0) {
    //     drawProjectPassFailGraph(userData.results);
    // }
}
