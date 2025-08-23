import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TravelFormData {
  fromCity: string;
  toCity: string;
  days: number;
  members: number;
  budget: number;
  currency: string;
  travelStyle: string;
  includeRoute: boolean;
}

interface ItineraryResponse {
  overview: {
    destination: string;
    duration: string;
    total_budget: number;
    currency: string;
    travel_style: string;
    recommended_hotel?: string;
    total_accommodation_cost?: number;
  };
  budget_breakdown: {
    accommodation: number;
    food: number;
    transportation: number;
    activities: number;
    miscellaneous: number;
  };
  daily_itinerary: any;
  accommodation_details?: {
    hotel_name: string;
    location: string;
    cost_per_night: number;
    total_nights: number;
    total_cost: number;
    amenities: string[];
    booking_tips: string;
    image_url?: string;
  };
  travel_tips: string[];
  emergency_contacts?: string[];
  routes?: {
    mode: string;
    duration: string;
    cost: number;
    details: string;
  }[];
}

class TravelPlannerService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error("Missing Gemini API key. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.");
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      throw new Error("Failed to initialize Gemini AI client");
    }
  }

  private createItineraryPrompt(data: TravelFormData): string {
    const { fromCity, toCity, days, members, budget, currency, travelStyle, includeRoute } = data;

    return `
Create a comprehensive ${days}-day travel itinerary for ${members} people traveling ${includeRoute ? `from ${fromCity} ` : ''}to ${toCity}.

Travel Details:
- Budget: ${budget} ${currency} (total for all ${members} people)
- Travel Style: ${travelStyle}
- Duration: ${days} days
${includeRoute ? `- Include route planning from ${fromCity} to ${toCity}` : ''}

IMPORTANT REQUIREMENTS:
1. Provide SPECIFIC hotel recommendations with names, locations, and nightly costs
2. Include REAL restaurant names with specific dishes and meal costs for breakfast, lunch, and dinner
3. List SPECIFIC tourist attractions, museums, landmarks with entry fees and visit durations
4. Include exact costs for each activity, meal, and accommodation
5. Provide detailed descriptions of what to do, see, and experience
6. Include transportation costs within the city (taxi, metro, bus)
7. Add practical details like opening hours, booking requirements, dress codes
8. Break down costs per person and total for the group
9. Include specific addresses or areas where possible
10. Suggest ${travelStyle} appropriate options (budget/mid-range/luxury)

Format the response as a valid JSON object with this EXACT structure:
{
  "overview": {
    "destination": "${toCity}",
    "duration": "${days} days",
    "total_budget": ${budget},
    "currency": "${currency}",
    "travel_style": "${travelStyle}",
    "recommended_hotel": "Hotel Name with location",
    "total_accommodation_cost": number
  },
  "budget_breakdown": {
    "accommodation": number,
    "food": number,
    "transportation": number,
    "activities": number,
    "miscellaneous": number
  },
  "daily_itinerary": {
    "day_1": {
      "morning": {
        "activity": "Specific activity/attraction name",
        "description": "Detailed description of what to do, see, experience",
        "location": "Specific address or area",
        "duration": "2-3 hours",
        "cost": number,
        "tips": "Practical tip for this activity",
        "restaurant": {
          "name": "Specific restaurant name",
          "cuisine": "cuisine type",
          "meal": "breakfast",
          "location": "restaurant address/area",
          "recommended_dish": "specific dish name",
          "cost": number
        }
      },
      "afternoon": {
        "activity": "Specific attraction/activity name",
        "description": "Detailed description",
        "location": "Specific address or area",
        "duration": "3-4 hours",
        "cost": number,
        "tips": "Useful tip",
        "restaurant": {
          "name": "Specific restaurant name",
          "cuisine": "cuisine type",
          "meal": "lunch",
          "location": "restaurant address/area",
          "recommended_dish": "specific dish name",
          "cost": number
        }
      },
      "evening": {
        "activity": "Evening activity/entertainment",
        "description": "What to do in the evening",
        "location": "Specific area/venue",
        "duration": "2-3 hours",
        "cost": number,
        "tips": "Evening tip",
        "restaurant": {
          "name": "Specific restaurant name",
          "cuisine": "cuisine type",
          "meal": "dinner",
          "location": "restaurant address/area",
          "recommended_dish": "signature dish",
          "cost": number
        }
      }
    },
    "day_2": { /* Same structure for each day */ },
    "day_3": { /* Continue for all ${days} days */ }
  },
  "accommodation_details": {
    "hotel_name": "Specific hotel name",
    "location": "Hotel address/area",
    "cost_per_night": number,
    "total_nights": ${days - 1},
    "total_cost": number,
    "amenities": ["WiFi", "Breakfast", "Pool", etc.],
    "booking_tips": "How to book, best rates, etc."
  },
  "travel_tips": [
    "Specific tip about ${toCity}",
    "Local custom to be aware of",
    "Best time to visit attractions",
    "Transportation tips",
    "Safety advice"
  ],
  "emergency_contacts": ["Local emergency number", "Tourist helpline"]${includeRoute ? ',\n  "routes": [\n    {\n      "mode": "flight",\n      "duration": "X hours",\n      "cost": number,\n      "details": "Airline suggestions, booking tips"\n    },\n    {\n      "mode": "train",\n      "duration": "X hours", \n      "cost": number,\n      "details": "Train types, booking process"\n    },\n    {\n      "mode": "bus",\n      "duration": "X hours",\n      "cost": number,\n      "details": "Bus operators, comfort level"\n    }\n  ]' : ''}
}

CRITICAL: Use REAL place names, restaurant names, and attractions that actually exist in ${toCity}. All costs should be realistic and add up to approximately the total budget of ${budget} ${currency}. Make this a practical, actionable itinerary someone could actually follow.
`;
  }

  private parseItineraryResponse(text: string): ItineraryResponse {
    // Try to extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error("Failed to parse JSON:", error);
      }
    }

    // Fallback: extract key information and create a structured response
    return this.createFallbackResponse(text);
  }

  private createFallbackResponse(text: string): ItineraryResponse {
    // Extract basic information from text response
    const overview = {
      destination: "Unknown",
      duration: "5 days",
      total_budget: 50000,
      currency: "INR",
      travel_style: "Mid-range"
    };

    const budget_breakdown = {
      accommodation: overview.total_budget * 0.4,
      food: overview.total_budget * 0.3,
      transportation: overview.total_budget * 0.15,
      activities: overview.total_budget * 0.1,
      miscellaneous: overview.total_budget * 0.05
    };

    return {
      overview,
      budget_breakdown,
      daily_itinerary: {
        raw_response: text
      },
      travel_tips: [
        "Check visa requirements",
        "Pack according to weather",
        "Keep emergency contacts handy",
        "Learn basic local phrases",
        "Keep copies of important documents"
      ]
    };
  }

  async generateItinerary(data: TravelFormData): Promise<ItineraryResponse> {
    try {
      const prompt = this.createItineraryPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const itinerary = this.parseItineraryResponse(text);

      // Enhance with images for places and restaurants
      const enhancedItinerary = await this.addImagesToItinerary(itinerary);

      return enhancedItinerary;
    } catch (error) {
      console.error("Error generating itinerary:", error);

      // Check if it's an API key issue and provide a demo response
      if (error.status === 403 && error.errorDetails?.some(detail => detail.reason === 'API_KEY_SERVICE_BLOCKED')) {
        console.log("API key blocked, returning demo itinerary");
        return this.createDemoItinerary(data);
      }

      throw new Error("Failed to generate itinerary");
    }
  }

  private async addImagesToItinerary(itinerary: ItineraryResponse): Promise<ItineraryResponse> {
    try {
      // Add images to daily itinerary places and restaurants
      if (itinerary.daily_itinerary) {
        for (const [dayKey, dayData] of Object.entries(itinerary.daily_itinerary)) {
          if (typeof dayData === 'object' && dayData !== null) {
            for (const [timeKey, timeData] of Object.entries(dayData)) {
              if (typeof timeData === 'object' && timeData !== null) {
                const activity = timeData as any;

                // Add image for the main activity/place
                if (activity.activity) {
                  activity.image_url = this.getPlaceImageUrl(activity.activity, itinerary.overview.destination);
                }

                // Add image for restaurant
                if (activity.restaurant && activity.restaurant.name) {
                  activity.restaurant.image_url = this.getRestaurantImageUrl(activity.restaurant.name, activity.restaurant.cuisine);
                }
              }
            }
          }
        }
      }

      // Add image to accommodation
      if (itinerary.accommodation_details && itinerary.accommodation_details.hotel_name) {
        itinerary.accommodation_details.image_url = this.getHotelImageUrl(itinerary.accommodation_details.hotel_name);
      }

      return itinerary;
    } catch (error) {
      console.error("Error adding images to itinerary:", error);
      return itinerary; // Return original itinerary if image addition fails
    }
  }

  private getPlaceImageUrl(placeName: string, destination: string): string {
    // Generate Unsplash URLs for monuments and attractions
    const searchQuery = `${placeName} ${destination} monument landmark architecture`.replace(/\s+/g, '%20');
    return `https://source.unsplash.com/800x400/?${searchQuery}`;
  }

  private getRestaurantImageUrl(restaurantName: string, cuisine: string): string {
    // Generate Unsplash URLs for restaurants and food
    const searchQuery = `${cuisine} food restaurant dish meal`.replace(/\s+/g, '%20');
    return `https://source.unsplash.com/600x400/?${searchQuery}`;
  }

  private getHotelImageUrl(hotelName: string): string {
    // Generate Unsplash URLs for hotels
    const searchQuery = `hotel luxury room accommodation interior`.replace(/\s+/g, '%20');
    return `https://source.unsplash.com/800x500/?${searchQuery}`;
  }

  private createDemoItinerary(data: TravelFormData): ItineraryResponse {
    const { toCity, days, members, budget, currency, travelStyle } = data;

    return {
      overview: {
        destination: toCity,
        duration: `${days} days`,
        total_budget: Number(budget),
        currency: currency,
        travel_style: travelStyle
      },
      budget_breakdown: {
        accommodation: Number(budget) * 0.4,
        food: Number(budget) * 0.3,
        transportation: Number(budget) * 0.15,
        activities: Number(budget) * 0.1,
        miscellaneous: Number(budget) * 0.05
      },
      daily_itinerary: {
        day_1: {
          morning: {
            activity: `Arrive in ${toCity} and check into hotel`,
            description: `Start your ${travelStyle.toLowerCase()} adventure in ${toCity}`,
            cost: Number(budget) * 0.05,
            restaurant: {
              name: "Local Breakfast Cafe",
              cuisine: "Local Cuisine",
              meal: "breakfast",
              cost: Number(budget) * 0.02
            }
          },
          afternoon: {
            activity: `Explore main attractions in ${toCity}`,
            description: "Visit the most popular landmarks and take photos",
            cost: Number(budget) * 0.08,
            restaurant: {
              name: "Popular Local Restaurant",
              cuisine: "Traditional",
              meal: "lunch",
              cost: Number(budget) * 0.03
            }
          },
          evening: {
            activity: `Dinner and evening stroll in ${toCity}`,
            description: "Experience the nightlife and local culture",
            cost: Number(budget) * 0.06,
            restaurant: {
              name: "Recommended Dinner Spot",
              cuisine: "Fine Dining",
              meal: "dinner",
              cost: Number(budget) * 0.04
            }
          }
        },
        day_2: {
          morning: {
            activity: "Cultural experiences and museums",
            description: "Immerse yourself in local history and culture",
            cost: Number(budget) * 0.07,
            restaurant: {
              name: "Hotel Restaurant",
              cuisine: "Continental",
              meal: "breakfast",
              cost: Number(budget) * 0.02
            }
          },
          afternoon: {
            activity: "Shopping and leisure time",
            description: "Browse local markets and shops",
            cost: Number(budget) * 0.09,
            restaurant: {
              name: "Market Food Court",
              cuisine: "Street Food",
              meal: "lunch",
              cost: Number(budget) * 0.025
            }
          },
          evening: {
            activity: "Entertainment and nightlife",
            description: "Experience local entertainment",
            cost: Number(budget) * 0.08,
            restaurant: {
              name: "Rooftop Restaurant",
              cuisine: "International",
              meal: "dinner",
              cost: Number(budget) * 0.045
            }
          }
        }
      },
      travel_tips: [
        `Check visa requirements for ${toCity}`,
        "Pack appropriate clothing for the weather",
        "Learn basic local phrases",
        "Keep copies of important documents",
        "Use official transport and avoid unlicensed taxis",
        "Try local cuisine but be mindful of food allergies",
        "Respect local customs and traditions"
      ]
    };
  }
}

export const handleGenerateItinerary: RequestHandler = async (req, res) => {
  try {
    const formData: TravelFormData = req.body;

    // Validate input
    if (!formData.toCity || formData.days <= 0 || formData.members <= 0 || formData.budget <= 0) {
      return res.status(400).json({ 
        error: "Missing or invalid required fields" 
      });
    }

    // Initialize service
    const plannerService = new TravelPlannerService();

    // Generate itinerary
    const itinerary = await plannerService.generateItinerary(formData);

    res.json(itinerary);
  } catch (error) {
    console.error("Error in generateItinerary handler:", error);
    res.status(500).json({ 
      error: "Failed to generate itinerary. Please try again." 
    });
  }
};
