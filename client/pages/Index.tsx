import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Users, DollarSign, Plane, Train, Bus, Sparkles, ArrowRight, Globe, Clock } from "lucide-react";

interface TravelFormData {
  fromCity: string;
  toCity: string;
  days: number | string;
  members: number | string;
  budget: number | string;
  currency: string;
  travelStyle: string;
  includeRoute: boolean;
}

interface ItineraryData {
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

export default function Index() {
  const [formData, setFormData] = useState<TravelFormData>({
    fromCity: "",
    toCity: "",
    days: "",
    members: "",
    budget: "",
    currency: "INR",
    travelStyle: "Mid-range",
    includeRoute: false
  });

  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("plan");

  const currencies = [
    { value: "INR", label: "₹ INR", symbol: "₹" },
    { value: "USD", label: "$ USD", symbol: "$" },
    { value: "EUR", label: "€ EUR", symbol: "€" },
    { value: "GBP", label: "£ GBP", symbol: "£" },
    { value: "JPY", label: "¥ JPY", symbol: "¥" }
  ];

  const travelStyles = [
    "Budget", "Mid-range", "Luxury", "Adventure", "Cultural", "Romantic", "Family"
  ];

  const handleInputChange = (field: keyof TravelFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberInputChange = (field: keyof TravelFormData, value: string) => {
    // Allow empty string for better UX when clearing
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' as any }));
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const generateItinerary = async () => {
    // Convert values to numbers for validation
    const days = typeof formData.days === 'string' ? parseInt(formData.days) : formData.days;
    const members = typeof formData.members === 'string' ? parseInt(formData.members) : formData.members;
    const budget = typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget;

    if (!formData.toCity || !days || !members || !budget || days <= 0 || members <= 0 || budget <= 0) {
      alert("Please fill in all required fields with valid values!");
      return;
    }

    setLoading(true);
    setActiveTab("results");

    try {
      // Prepare data with proper number types for API
      const apiData = {
        ...formData,
        days,
        members,
        budget
      };

      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate itinerary");
      }

      const data = await response.json();
      setItinerary(data);
    } catch (error) {
      console.error("Error generating itinerary:", error);
      alert("Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    return currencies.find(c => c.value === currency)?.symbol || currency;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <Globe className="inline-block w-12 h-12 mr-4 mb-2" />
              AI Travel Planner
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Plan your perfect trip with AI-powered recommendations, budget optimization, and personalized itineraries
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Sparkles className="w-4 h-4 mr-1" />
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <DollarSign className="w-4 h-4 mr-1" />
                Budget Optimized
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <MapPin className="w-4 h-4 mr-1" />
                Route Planning
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="plan" className="text-lg">Plan Your Trip</TabsTrigger>
            <TabsTrigger value="results" disabled={!itinerary && !loading}>Your Itinerary</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Plan Your Dream Trip</CardTitle>
                <CardDescription className="text-center">
                  Fill in your travel details and let AI create the perfect itinerary for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trip Type Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Trip Planning Mode</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${!formData.includeRoute ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => handleInputChange('includeRoute', false)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-6 h-6 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Destination Planning</h3>
                            <p className="text-sm text-gray-600">Plan activities and stay at your destination</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card 
                      className={`cursor-pointer transition-all ${formData.includeRoute ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => handleInputChange('includeRoute', true)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <ArrowRight className="w-6 h-6 text-green-600" />
                          <div>
                            <h3 className="font-semibold">Full Journey Planning</h3>
                            <p className="text-sm text-gray-600">Include travel routes and transportation</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Location Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {formData.includeRoute && (
                    <div className="space-y-2">
                      <Label htmlFor="fromCity" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        From City *
                      </Label>
                      <Input
                        id="fromCity"
                        placeholder="e.g., Mumbai, Delhi, New York"
                        value={formData.fromCity}
                        onChange={(e) => handleInputChange('fromCity', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="toCity" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {formData.includeRoute ? 'To City *' : 'Destination City *'}
                    </Label>
                    <Input
                      id="toCity"
                      placeholder="e.g., Paris, Tokyo, Goa"
                      value={formData.toCity}
                      onChange={(e) => handleInputChange('toCity', e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="days" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Number of Days *
                    </Label>
                    <Input
                      id="days"
                      type="number"
                      min="1"
                      max="30"
                      step="1"
                      value={formData.days}
                      onChange={(e) => handleNumberInputChange('days', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="e.g., 5"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="members" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Number of Travelers *
                    </Label>
                    <Input
                      id="members"
                      type="number"
                      min="1"
                      max="20"
                      step="1"
                      value={formData.members}
                      onChange={(e) => handleNumberInputChange('members', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="e.g., 2"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Currency
                    </Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget and Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Budget ({getCurrencySymbol(formData.currency)}) *
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      min="1000"
                      step="1000"
                      value={formData.budget}
                      onChange={(e) => handleNumberInputChange('budget', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="e.g., 50000"
                      className="h-12"
                    />
                    <p className="text-xs text-gray-500">
                      Total budget for {formData.members || '?'} traveler{(formData.members && Number(formData.members) > 1) ? 's' : ''} for {formData.days || '?'} day{(formData.days && Number(formData.days) > 1) ? 's' : ''}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="travelStyle" className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Travel Style
                    </Label>
                    <Select value={formData.travelStyle} onValueChange={(value) => handleInputChange('travelStyle', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {travelStyles.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={generateItinerary}
                  disabled={loading}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Your Perfect Itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate My Dream Itinerary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-8">
            {loading ? (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">Crafting Your Perfect Itinerary</h3>
                  <p className="text-gray-600">
                    Our AI is analyzing destinations, optimizing your budget, and creating personalized recommendations...
                  </p>
                </CardContent>
              </Card>
            ) : itinerary ? (
              <div className="space-y-6">
                {/* Overview Card */}
                <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="text-2xl">Trip Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-blue-100">Destination</p>
                        <p className="font-semibold text-lg">{itinerary.overview.destination}</p>
                      </div>
                      <div>
                        <p className="text-blue-100">Duration</p>
                        <p className="font-semibold text-lg">{itinerary.overview.duration}</p>
                      </div>
                      <div>
                        <p className="text-blue-100">Budget</p>
                        <p className="font-semibold text-lg">
                          {getCurrencySymbol(itinerary.overview.currency)} {itinerary.overview.total_budget.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-100">Style</p>
                        <p className="font-semibold text-lg">{itinerary.overview.travel_style}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget Breakdown */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Budget Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {Object.entries(itinerary.budget_breakdown).map(([category, amount]) => (
                        <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</p>
                          <p className="font-semibold text-lg text-green-600">
                            {getCurrencySymbol(itinerary.overview.currency)} {amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Accommodation Details */}
                {itinerary.accommodation_details && (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Recommended Accommodation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                        {itinerary.accommodation_details.image_url && (
                          <div className="mb-6">
                            <img
                              src={itinerary.accommodation_details.image_url}
                              alt={itinerary.accommodation_details.hotel_name}
                              className="w-full h-64 object-cover rounded-lg shadow-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              🏨 {itinerary.accommodation_details.hotel_name}
                            </h3>
                            <p className="text-gray-600 mb-3">
                              📍 {itinerary.accommodation_details.location}
                            </p>
                            <div className="space-y-2">
                              <p className="text-sm">
                                <span className="font-semibold">Per Night:</span> {getCurrencySymbol(itinerary.overview.currency)} {itinerary.accommodation_details.cost_per_night.toLocaleString()}
                              </p>
                              <p className="text-sm">
                                <span className="font-semibold">Total Nights:</span> {itinerary.accommodation_details.total_nights}
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                <span className="font-semibold text-gray-800">Total Cost:</span> {getCurrencySymbol(itinerary.overview.currency)} {itinerary.accommodation_details.total_cost.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">✨ Amenities</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {itinerary.accommodation_details.amenities.map((amenity, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                            {itinerary.accommodation_details.booking_tips && (
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                <p className="text-sm text-yellow-800">
                                  <span className="font-semibold">💡 Booking Tip:</span> {itinerary.accommodation_details.booking_tips}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Daily Itinerary */}
                {itinerary.daily_itinerary && (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Detailed Daily Itinerary
                      </CardTitle>
                      <CardDescription>
                        Day-by-day plan with specific places, hotels, restaurants, and costs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {Object.entries(itinerary.daily_itinerary).map(([day, activities], dayIndex) => (
                          <div key={day} className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                            <h3 className="text-xl font-bold mb-4 text-blue-700 capitalize">
                              {day.replace('_', ' ')} - Day {dayIndex + 1}
                            </h3>

                            {typeof activities === 'object' && activities !== null && !activities.raw_response ? (
                              <div className="space-y-6">
                                {Object.entries(activities).map(([timeOfDay, activityData]) => (
                                  <div key={timeOfDay} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-400">
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        {timeOfDay === 'morning' ? '🌅' : timeOfDay === 'afternoon' ? '☀️' : '🌙'}
                                      </div>
                                      <h4 className="text-lg font-semibold text-gray-800 capitalize">
                                        {timeOfDay}
                                      </h4>
                                    </div>

                                    {typeof activityData === 'object' && activityData !== null && (
                                      <div className="space-y-3">
                                        {/* Main Activity */}
                                        <div className="bg-gray-50 rounded p-3">
                                          {activityData.image_url && (
                                            <div className="mb-3">
                                              <img
                                                src={activityData.image_url}
                                                alt={activityData.activity || 'Activity'}
                                                className="w-full h-48 object-cover rounded-md shadow-sm"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                              />
                                            </div>
                                          )}
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <h5 className="font-semibold text-gray-800 mb-1">
                                                📍 {activityData.activity || 'Activity'}
                                              </h5>
                                              {activityData.description && (
                                                <p className="text-gray-600 text-sm mb-2">{activityData.description}</p>
                                              )}
                                            </div>
                                            {activityData.cost && (
                                              <div className="ml-4">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                                                  {getCurrencySymbol(itinerary.overview.currency)} {activityData.cost.toLocaleString()}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Restaurant/Meal Info */}
                                        {activityData.restaurant && typeof activityData.restaurant === 'object' && (
                                          <div className="bg-orange-50 rounded p-3 border-l-4 border-orange-400">
                                            {activityData.restaurant.image_url && (
                                              <div className="mb-3">
                                                <img
                                                  src={activityData.restaurant.image_url}
                                                  alt={`${activityData.restaurant.name} - ${activityData.restaurant.cuisine}`}
                                                  className="w-full h-32 object-cover rounded-md shadow-sm"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                  }}
                                                />
                                              </div>
                                            )}
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h6 className="font-semibold text-orange-800 mb-1">
                                                  🍽️ {activityData.restaurant.name || 'Restaurant'}
                                                  <span className="text-sm font-normal text-orange-600 ml-2">
                                                    ({activityData.restaurant.meal || 'meal'})
                                                  </span>
                                                </h6>
                                                <div className="space-y-1">
                                                  {activityData.restaurant.cuisine && (
                                                    <p className="text-orange-700 text-sm">
                                                      🍳 Cuisine: {activityData.restaurant.cuisine}
                                                    </p>
                                                  )}
                                                  {activityData.restaurant.location && (
                                                    <p className="text-orange-700 text-sm">
                                                      📍 {activityData.restaurant.location}
                                                    </p>
                                                  )}
                                                  {activityData.restaurant.recommended_dish && (
                                                    <p className="text-orange-700 text-sm font-medium">
                                                      ⭐ Try: {activityData.restaurant.recommended_dish}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              {activityData.restaurant.cost && (
                                                <div className="ml-4">
                                                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-semibold">
                                                    {getCurrencySymbol(itinerary.overview.currency)} {activityData.restaurant.cost.toLocaleString()}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Additional Activity Details */}
                                        {activityData.location && (
                                          <div className="text-sm text-gray-600">
                                            <MapPin className="inline w-4 h-4 mr-1" />
                                            Location: {activityData.location}
                                          </div>
                                        )}

                                        {activityData.duration && (
                                          <div className="text-sm text-gray-600">
                                            <Clock className="inline w-4 h-4 mr-1" />
                                            Duration: {activityData.duration}
                                          </div>
                                        )}

                                        {activityData.tips && (
                                          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                            💡 Tip: {activityData.tips}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : activities.raw_response ? (
                              <div className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
                                {activities.raw_response}
                              </div>
                            ) : (
                              <p className="text-gray-500">No detailed activities available for this day.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Travel Tips */}
                {itinerary.travel_tips && itinerary.travel_tips.length > 0 && (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Travel Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {itinerary.travel_tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-sm">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Emergency Contacts */}
                {itinerary.emergency_contacts && itinerary.emergency_contacts.length > 0 && (
                  <Card className="shadow-xl border-0 bg-red-50 border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        📞 Emergency Contacts
                      </CardTitle>
                      <CardDescription>
                        Important numbers to keep handy during your trip
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {itinerary.emergency_contacts.map((contact, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-red-100 rounded-lg border border-red-200">
                            <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              🚨
                            </div>
                            <p className="text-sm font-medium text-red-800">{contact}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Routes (if applicable) */}
                {itinerary.routes && (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ArrowRight className="w-5 h-5" />
                        Travel Routes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {itinerary.routes.map((route, index) => (
                          <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              {route.mode === 'flight' && <Plane className="w-5 h-5 text-blue-600" />}
                              {route.mode === 'train' && <Train className="w-5 h-5 text-green-600" />}
                              {route.mode === 'bus' && <Bus className="w-5 h-5 text-orange-600" />}
                              <span className="font-semibold capitalize">{route.mode}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Duration: {route.duration}</p>
                            <p className="text-sm text-gray-600 mb-2">
                              Cost: {getCurrencySymbol(itinerary.overview.currency)} {route.cost.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">{route.details}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Itinerary Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Go back to the planning tab to create your travel itinerary.
                  </p>
                  <Button onClick={() => setActiveTab("plan")} variant="outline">
                    Start Planning
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
