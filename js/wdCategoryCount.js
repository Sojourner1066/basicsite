export async function wdCategoryCounts(iso3 = "NGA") {
    const query = `SELECT ?country ?countryLabel ?membership ?membershipLabel ?MembershipType ?MembershipTypeLabel WHERE {
                    ?country wdt:P298 "${iso3}".  # ISO 3166-1 alpha-3 code for Nigeria
                    ?country wdt:P463 ?membership.  # Get memberships
                    OPTIONAL {
                        ?membership wdt:P31 ?MembershipType.  # Rename instanceOf to MembershipType
                    }
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
                    }
                    ORDER BY ?membershipLabel`;
  
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
    //   console.log(data.results.bindings);
      return getUniqueMembershipTypes(data.results.bindings); // ✅ return result here
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  function getUniqueMembershipTypes(data) {
    const types = new Set();
  
    data.forEach(entry => {
      if (entry.MembershipType) {
        types.add(entry.MembershipType.value.replace("http://www.wikidata.org/entity/", ""));
      }
    });
    // console.log("types", types);
    const categories = countCategoriesFromIDs(Array.from(types).sort())
    return categories;
  }

  const wikidataCategoryMap = {
    // 🧠 Cultural/Educational
    "Q10549978": "Cultural/Educational",  // cultural association
    "Q10855469": "Cultural/Educational",  // education trade union
    "Q1149061": "Cultural/Educational",  // language area
    "Q2093358": "Cultural/Educational",  // language regulator
    "Q2385804": "Cultural/Educational",  // educational institution
    "Q3502482": "Cultural/Educational",  // cultural region
    "Q96888669": "Cultural/Educational",  // academic publisher
  
    // 💰 Economic/Trade Organizations
    "Q105758271": "Economic/Trade Organizations",  // multilateral development bank
    "Q1125321": "Economic/Trade Organizations",  // currency union
    "Q1129645": "Economic/Trade Organizations",  // trade bloc
    "Q129060826": "Economic/Trade Organizations",  // regional fishery advisory body
    "Q1327750": "Economic/Trade Organizations",  // single market
    "Q1345691": "Economic/Trade Organizations",  // international financial institution
    "Q218819": "Economic/Trade Organizations",  // customs union
    "Q252550": "Economic/Trade Organizations",  // trade agreement
    "Q3536928": "Economic/Trade Organizations",  // free trade agreement
    "Q3623811": "Economic/Trade Organizations",  // economic union
    "Q5335686": "Economic/Trade Organizations",  // free trade area
  
    // 🌱 Environmental
    "Q1785733": "Environmental",  // environmental organization
    "Q3356081": "Environmental",  // Regional Plant Protection Organization
  
    // 🌐 General International Orgs
    "Q163740": "General International Orgs",  // nonprofit organization
    "Q17084016": "General International Orgs",  // nonprofit corporation
    "Q1900326": "General International Orgs",  // network
    "Q29300714": "General International Orgs",  // international association
    "Q431603": "General International Orgs",  // advocacy group
    "Q43229": "General International Orgs",  // organization
    "Q48204": "General International Orgs",  // voluntary association
    "Q6815100": "General International Orgs",  // membership organization
    "Q728646": "General International Orgs",  // partnership
    "Q79913": "General International Orgs",  // non-governmental organization
    "Q9378718": "General International Orgs",  // international cooperation
    "Q938236": "General International Orgs",  // panel
  
    // 🏛 Intergovernmental Organizations (IGOs)
    "Q1335818": "Intergovernmental Organizations (IGOs)",  // supranational union
    "Q15285626": "Intergovernmental Organizations (IGOs)",  // organization established by the United Nations
    "Q15925165": "Intergovernmental Organizations (IGOs)",  // specialized agency of the United Nations
    "Q245065": "Intergovernmental Organizations (IGOs)",  // intergovernmental organization
    "Q4120211": "Intergovernmental Organizations (IGOs)",  // regional organization
    "Q484652": "Intergovernmental Organizations (IGOs)",  // international organization
    "Q97374157": "Intergovernmental Organizations (IGOs)",  // international parliament
  
    // 🛡 Military Alliances
    "Q100906234": "Military Alliances",  // multinational military coalition
    "Q1127126": "Military Alliances",  // military alliance
    "Q115365853": "Military Alliances",  // military task force
    "Q125420442": "Military Alliances",  // intelligence alliance
    "Q1276346": "Military Alliances",  // EU battlegroup
    "Q1772543": "Military Alliances",  // command center
  
    // 🗳 Political Alliances
    "Q1140229": "Political Alliances",  // political union
    "Q120121699": "Political Alliances",  // political economic union
    "Q124964": "Political Alliances",  // coalition
    "Q170156": "Political Alliances",  // confederation
    "Q2578692": "Political Alliances",  // commonwealth
    "Q7210356": "Political Alliances",  // political organization
    "Q769802": "Political Alliances",  // continental union
  
    // ☪️ Religious or Ideological
    "Q110706912": "Religious or Ideological",  // Islamic organization
  
    // 🔬 Scientific & Technical
    "Q109909183": "Scientific & Technical",  // nuclear research institute
    "Q1254933": "Scientific & Technical",  // astronomical observatory
    "Q1328899": "Scientific & Technical",  // standards organization
    "Q1438053": "Scientific & Technical",  // research infrastructure
    "Q31855": "Scientific & Technical",  // research institute
    "Q4117139": "Scientific & Technical",  // biological database
    "Q480242": "Scientific & Technical",  // statistical service
    "Q5227240": "Scientific & Technical",  // data library
    "Q6043746": "Scientific & Technical",  // intellectual property organization
    "Q7689673": "Scientific & Technical",  // taxonomic database
  
    // ⚽️ Sports Organizations
    "Q11422536": "Sports Organizations",  // international sport governing body
  };


  export function countCategoriesFromIDs(wikidataIDs) {
    const categoryCounts = {};
  
    wikidataIDs.forEach(id => {
      const category = wikidataCategoryMap[id] || "Uncategorized";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  
    return categoryCounts;
  };