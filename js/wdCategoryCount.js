
export async function wdCategoryCounts(iso3="NGA") {
    const query = `SELECT ?type ?typeLabel (COUNT(DISTINCT ?membership) AS ?count) WHERE {
  ?country wdt:P298 "${iso3}".
  ?country wdt:P463 ?membership.
  ?membership wdt:P31 ?type.

  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
GROUP BY ?type ?typeLabel
ORDER BY DESC(?count)`;
        

    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        groupMembershipsByCategory(data.results.bindings);
        // return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

function groupMembershipsByCategory(results) {
    const categoryMap = {
        // Intergovernmental
        "Q118844": "Intergovernmental Organizations (IGOs)",
      
        // Economic/Trade
        "Q4830453": "Economic/Trade Organizations", // economic union
        "Q3024240": "Economic/Trade Organizations", // customs union
        "Q37702":   "Economic/Trade Organizations", // free trade area
      
        // Political Alliances
        "Q163740": "Political Alliances", // military alliance
      
        // Scientific & Technical
        "Q79913":   "Scientific & Technical",       // scientific organization
        "Q2134524": "Scientific & Technical",       // standardization body
      
        // Cultural/Educational
        "Q31855":   "Cultural/Educational",         // cultural organization
        "Q2385804": "Cultural/Educational",         // educational institution
      
        // Environmental
        "Q36161": "Environmental",                  // environmental organization
      
        // Sports
        "Q28108": "Sports Organizations",           // sports organization
      
        // Religious or Ideological
        "Q504730": "Religious or Ideological",      // religious organization
      
        // General International fallback
        "Q43229": "General International Orgs"      // international organization
      };
    const grouped = {};
  
    results.forEach(item => {
      const qid = item.type.value.split('/').pop(); // get "Qxxxx"
      const count = parseInt(item.count.value, 10);
      const category = categoryMap[qid] || "Other";
  
      if (!grouped[category]) grouped[category] = 0;
      grouped[category] += count;
    });
  
    return grouped;
  }



