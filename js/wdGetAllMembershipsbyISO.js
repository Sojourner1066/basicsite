
export async function wdGetAllMembershipsbyISO(iso3="NGA") {
    const query = `# This query finds all current memberships of a target country (e.g. Nigeria),
# and then finds all other countries that are also members of those same organizations.
# It returns ISO 3166-1 alpha-3 codes for both the target and other countries, 
# along with the organization (membership) involved.

SELECT DISTINCT 
  ?targetCountry       # Wikidata entity for the target country (e.g., wd:Q1033 for Nigeria)
  ?targetCode          # ISO 3166-1 alpha-3 code for the target country
  ?membership          # Wikidata entity for the organization or group
  ?membershipLabel     # Human-readable label for the organization
  ?otherCountry        # Wikidata entity for the other country that shares membership
  ?otherCode           # ISO 3166-1 alpha-3 code for the other country
WHERE {
  # --------------------------
  # STEP 1: Get the target country by ISO code
  ?targetCountry wdt:P298 "${iso3}".  # this is the iso code passed by the function

  # STEP 2: Find all current memberships of the target country
  ?targetCountry p:P463 ?targetStatement.        # P463 = member of
  ?targetStatement ps:P463 ?membership.          # Get the organization entity
  FILTER NOT EXISTS { ?targetStatement pq:P582 ?endTime }  # Only include current memberships

  # STEP 3: Get the ISO code of the target country (will just return the input iso again, but good for structure)
  ?targetCountry wdt:P298 ?targetCode.

  # --------------------------
  # STEP 4: Find other countries that are also members of the same organization
  ?otherCountry p:P463 ?otherStatement.
  ?otherStatement ps:P463 ?membership.            # Must be the same organization
  FILTER NOT EXISTS { ?otherStatement pq:P582 ?endTime }  # Must be current

  # STEP 5: Get the ISO alpha-3 code of each "other" country
  ?otherCountry wdt:P298 ?otherCode.

  # STEP 6: Make sure we don't include the target country itself in the results
  FILTER(?otherCountry != ?targetCountry)

  # --------------------------
  # STEP 7: Get human-readable labels (e.g., for ?membership)
  SERVICE wikibase:label { 
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". 
  }
}
ORDER BY ?membershipLabel ?otherCode`;
        

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

