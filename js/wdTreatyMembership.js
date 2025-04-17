let treatyMembers = [];

// Dynamically load TreatyMembers.json
async function loadTreatyMembers() {
  if (treatyMembers.length === 0) {
    const response = await fetch('./data/TreatyMembers.json');
    if (!response.ok) throw new Error("Failed to load TreatyMembers.json");
    treatyMembers = await response.json();
  }
  return treatyMembers;
}

// Query all treaty memberships for a given ISO code
async function getCountryMemberships(isoCode) {
  const query = `
    SELECT ?organization WHERE {
      ?country wdt:P298 "${isoCode}".
      ?country wdt:P463 ?organization.
    }
  `;
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
  const response = await fetch(url);
  const data = await response.json();

  const countryMemebership = data.results.bindings.map(b => b.organization.value);
  // const testing =  getUniqueMembershipTypes(countryMemebership);
  // console.log("Membership Types: ", testing);
  // console.log("Country Memberships: ", countryMemebership);
  return countryMemebership;

  // return data.results.bindings.map(b => b.organization.value);
}

// Filter local treaties by participant threshold
async function filterTreatiesByMemberCount(orgURIs, maxCount) {
  const data = await loadTreatyMembers();
  return data
    .filter(t => orgURIs.includes(t.organization) && parseInt(t.memberCount) < maxCount)
    .map(t => t.organization);
}

// Query Wikidata for members of those treaties and return grouped by org
async function getMembersOfTreaties(treatyURIs) {
  if (treatyURIs.length === 0) return {};

  const valuesClause = treatyURIs.map(uri => `<${uri}>`).join(' ');
  const query = `
    SELECT ?organizationLabel ?isoCode WHERE {
      VALUES ?organization { ${valuesClause} }
      ?country wdt:P463 ?organization;
               wdt:P31 wd:Q6256;
               wdt:P298 ?isoCode.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
  const response = await fetch(url);
  const data = await response.json();

  const grouped = {};
  for (const d of data.results.bindings) {
    const org = d.organizationLabel.value;
    const iso = d.isoCode.value;
    if (!grouped[org]) grouped[org] = [];
    grouped[org].push(iso);
  }

  return grouped;
}

// Main function to export
export async function getSmallTreatyMembersGrouped(isoCode, maxParticipants) {
  const memberships = await getCountryMemberships(isoCode);
  const smallTreaties = await filterTreatiesByMemberCount(memberships, maxParticipants);
  const groupedMembers = await getMembersOfTreaties(smallTreaties);
  return groupedMembers;
}

export function getUniqueMemberCountries(groupedResults, originalISO) {
  const countrySet = new Set();

  for (const members of Object.values(groupedResults)) {
    for (const iso of members) {
      if (iso !== originalISO) {
        countrySet.add(iso);
      }
    }
  }

  return Array.from(countrySet);
}

