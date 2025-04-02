
export async function wdGetAllMembershipsbyISO(iso3="NGA") {
    const query = `# This query returns all unique ISO alpha-3 codes for countries that
        # share a current membership with the given source country.

        SELECT DISTINCT ?targetCode WHERE {
        # Get the source country by its ISO code
        ?sourceCountry wdt:P298 "NGA".
        ?sourceCountry p:P463 ?sourceStatement.
        ?sourceStatement ps:P463 ?membership.
        FILTER NOT EXISTS { ?sourceStatement pq:P582 ?endTime }

        # Find other (target) countries with the same membership
        ?targetCountry p:P463 ?targetStatement.
        ?targetStatement ps:P463 ?membership.
        FILTER NOT EXISTS { ?targetStatement pq:P582 ?endTime }

        # Get their ISO codes
        ?targetCountry wdt:P298 ?targetCode.

        # Exclude the source country from the results
        FILTER(?targetCountry != ?sourceCountry)
        }
        ORDER BY ?targetCode`;
        

    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

