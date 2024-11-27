export function extractWikiTable(table, jsonData) {
    const tableKey = table;
    let outputHtml = '';

    // Split the content to find the specific table
    const tables = jsonData.parse.text['*'].split('<table class="');
    for (const table of tables) {
        if (table.includes(tableKey)) {
            outputHtml = '<table class="' + table.split('</table>')[0] + '</table>';
            break;
        }
    }
    return outputHtml;
} 

export function wikiTableToJSON(table, jsonData) {
    const tableKey = table
    let outputData = []
    function removeTextBeforeFirstGreaterThan(inputString) {
        // Find the index of the first '>'
        const index = inputString.indexOf('>');

        // If '>' exists in the string
        if (index !== -1) {
            // Return substring starting from index + 1
            return inputString.substring(index + 1);
        }

        // Return original string if '>' does not exist
        return inputString;
    }

    function removeTextBeforeAfterNl(inputString) {
        // Return original string if '>' does not exist
        return inputString.split('\n')[0];
    }

    function removeHtmlTags(inputString) {
        // Regular expression to match HTML tags
        const htmlRegex = /<[^>]*>/g;

        // Remove HTML tags using replace method with regex
        return inputString.replace(htmlRegex, '');
    }

    function removeEndnotes(str) {
        const regex = /<a href="#endnote_\d+">\d+<\/a>/g;
        const result = str.replace(regex, '');
        return result
    }

    // Split the content to find the specific table
    const tables = jsonData.parse.text['*'].split('<table');
    let saveNextValue = false
    for(const table of tables){
        if (saveNextValue) {
            const rows = table.split('<tr').map(x => removeTextBeforeFirstGreaterThan(x))
            let row_index = 0
            for (const row of rows) {
                let rowData = []
                if(row_index > 1) {
                    const tableData = row.split('<td')
                    for (const each of tableData) {
                        let rowDataValue = each.split('</td>')[0]
                        rowDataValue = removeTextBeforeFirstGreaterThan(rowDataValue)
                        rowDataValue = removeTextBeforeAfterNl(rowDataValue)
                        rowDataValue = removeEndnotes(rowDataValue)
                        rowData.push(rowDataValue)
                    }
                }
                row_index++
                outputData.push(rowData)
            }
            break;
        }
        if (table.includes(`id="${tableKey}"`)) {
            saveNextValue = true
        }
    }
    return outputData;
}

export function extractInfoboxImageUrl(jsonData) {
    const searchKey = 'infobox-image';
    let infoboxImageUrl = '';

    // Split the content to find the infobox image URL
    const lines = jsonData.parse.text['*'].split('\n');
    for (const line of lines) {
        if (line.includes(searchKey)) {
            const urlMatch = line.match(/src="([^"]+)"/);
            if (urlMatch) {
                infoboxImageUrl = 'https:' + urlMatch[1];
                break;
            }
        }
    }

    return infoboxImageUrl;
}