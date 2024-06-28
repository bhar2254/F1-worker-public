export function extractRaceClassification(jsonData) {
	const tableKey = 'Race classification';
	let raceClassificationHtml = '';

	// Split the content to find the specific table
	const tables = jsonData.parse.text['*'].split('<table class="');
	for (const table of tables) {
		if (table.includes(tableKey)) {
			raceClassificationHtml = '<table class="' + table.split('</table>')[0] + '</table>';
			break;
		}
	}

	return raceClassificationHtml;
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