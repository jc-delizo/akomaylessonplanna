/**
 * Location Utility Functions
 * 
 * Helper functions for working with Philippines regions and cities data
 */

import { philippinesRegions, type Region, type City } from '@/lib/data/philippines-locations'

/**
 * Get all regions
 */
export function getAllRegions(): Region[] {
  return philippinesRegions
}

/**
 * Get cities by region code
 */
export function getCitiesByRegion(regionCode: string): City[] {
  const region = findRegionByCode(regionCode)
  return region ? region.cities : []
}

/**
 * Find region by code
 */
export function findRegionByCode(code: string): Region | undefined {
  return philippinesRegions.find((region) => region.code === code)
}

/**
 * Find region by name (case-insensitive, partial match)
 */
export function findRegionByName(name: string): Region | undefined {
  const normalizedName = name.toLowerCase().trim()
  return philippinesRegions.find(
    (region) =>
      region.name.toLowerCase() === normalizedName ||
      region.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(region.name.toLowerCase())
  )
}

/**
 * Find city in a specific region
 */
export function findCityInRegion(regionCode: string, cityName: string): City | undefined {
  const cities = getCitiesByRegion(regionCode)
  const normalizedCityName = cityName.toLowerCase().trim()
  return cities.find(
    (city) =>
      city.name.toLowerCase() === normalizedCityName ||
      city.name.toLowerCase().includes(normalizedCityName) ||
      normalizedCityName.includes(city.name.toLowerCase())
  )
}

/**
 * Find city across all regions (returns first match)
 */
export function findCityAnywhere(cityName: string): { region: Region; city: City } | undefined {
  const normalizedCityName = cityName.toLowerCase().trim()
  
  for (const region of philippinesRegions) {
    const city = region.cities.find(
      (c) =>
        c.name.toLowerCase() === normalizedCityName ||
        c.name.toLowerCase().includes(normalizedCityName) ||
        normalizedCityName.includes(c.name.toLowerCase())
    )
    
    if (city) {
      return { region, city }
    }
  }
  
  return undefined
}

/**
 * Try to match existing location data to structured data
 * Returns the best match region code and city name, or null if no match
 */
export function matchExistingLocation(
  regionName: string | null | undefined,
  cityName: string | null | undefined
): { regionCode: string; cityName: string } | null {
  if (!regionName && !cityName) {
    return null
  }

  // If we have a region name, try to find it
  let matchedRegion: Region | undefined
  if (regionName) {
    matchedRegion = findRegionByName(regionName)
  }

  // If we have a city name but no region, try to find city anywhere
  if (cityName && !matchedRegion) {
    const cityMatch = findCityAnywhere(cityName)
    if (cityMatch) {
      return {
        regionCode: cityMatch.region.code,
        cityName: cityMatch.city.name,
      }
    }
  }

  // If we have both region and city, validate the city is in that region
  if (matchedRegion && cityName) {
    const city = findCityInRegion(matchedRegion.code, cityName)
    if (city) {
      return {
        regionCode: matchedRegion.code,
        cityName: city.name,
      }
    }
    // If city not found in region, still return the region match
    return {
      regionCode: matchedRegion.code,
      cityName: cityName, // Keep original city name
    }
  }

  // If only region matched
  if (matchedRegion) {
    return {
      regionCode: matchedRegion.code,
      cityName: cityName || '',
    }
  }

  return null
}

/**
 * Get region display name by code
 */
export function getRegionDisplayName(regionCode: string): string {
  const region = findRegionByCode(regionCode)
  return region ? region.name : regionCode
}
