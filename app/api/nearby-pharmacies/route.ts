import { NextRequest, NextResponse } from 'next/server';

// Get distance between two coordinates in kilometers
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, radius = 5000 } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // In a real implementation, we would call an external API like Google Places API
    // For demo purposes, we'll return mock data
    
    // Generate some mock pharmacies around the user's location
    const mockPharmacies = [
      {
        name: "City Pharmacy",
        address: "123 Main St, City Center",
        lat: latitude + 0.01,
        lng: longitude - 0.005,
        distance: (getDistance(latitude, longitude, latitude + 0.01, longitude - 0.005)).toFixed(2)
      },
      {
        name: "Health Plus Pharmacy",
        address: "456 Park Avenue, Uptown",
        lat: latitude - 0.008,
        lng: longitude + 0.003,
        distance: (getDistance(latitude, longitude, latitude - 0.008, longitude + 0.003)).toFixed(2)
      },
      {
        name: "MediCare Pharmacy",
        address: "789 Oak St, Downtown",
        lat: latitude + 0.005,
        lng: longitude + 0.01,
        distance: (getDistance(latitude, longitude, latitude + 0.005, longitude + 0.01)).toFixed(2)
      },
      {
        name: "Community Drugs",
        address: "987 Elm St, West End",
        lat: latitude - 0.015,
        lng: longitude - 0.008,
        distance: (getDistance(latitude, longitude, latitude - 0.015, longitude - 0.008)).toFixed(2)
      },
      {
        name: "Express Pharmacy",
        address: "321 Pine Rd, East Side",
        lat: latitude + 0.02,
        lng: longitude + 0.018,
        distance: (getDistance(latitude, longitude, latitude + 0.02, longitude + 0.018)).toFixed(2)
      }
    ];
    
    // Sort pharmacies by distance
    mockPharmacies.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    // Add a slight delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      pharmacies: mockPharmacies,
      userLocation: { lat: latitude, lng: longitude }
    });
  } catch (error) {
    console.error('Error in nearby-pharmacies API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby pharmacies' },
      { status: 500 }
    );
  }
} 